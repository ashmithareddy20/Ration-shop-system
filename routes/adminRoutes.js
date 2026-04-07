const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Seller = require("../models/seller");
const Stock = require("../models/Stock");
const Transaction = require("../models/Transaction");
const DeliveryPerson = require("../models/DeliveryPerson");
const MonthlyItem = require("../models/MonthlyItem");
const {
  ITEM_CATALOG,
  normalizeTransactionDocument,
  getMonthKey,
  toNonNegativeInteger,
} = require("../utils/catalog");

function sellerStatus(seller) {
  return {
    openTime: seller.openTime || "09:00",
    closeTime: seller.closeTime || "16:00",
    isClosed: Boolean(seller.isClosed),
    leaveNote: seller.leaveNote || "",
  };
}

async function ensureMonthConfig(monthKey) {
  const existing = await MonthlyItem.find({ monthKey }).lean();
  if (existing.length > 0) {
    return existing;
  }

  const defaults = ITEM_CATALOG.map((item) => ({
    monthKey,
    itemKey: item.key,
    name: item.name,
    price: item.price,
    monthlyLimit: item.monthlyLimit,
    isAvailable: true,
    image: item.image,
  }));

  await MonthlyItem.insertMany(defaults, { ordered: false });
  return MonthlyItem.find({ monthKey }).lean();
}

router.post("/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();

  if (username === "admin" && password === "admin123") {
    return res.json({ ok: true, message: "Admin login successful." });
  }

  return res.status(401).json({ ok: false, message: "Invalid admin credentials." });
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1, name: 1 })
      .select("-__v")
      .lean();

    return res.json({ ok: true, users });
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const payload = {
      name: String(req.body.name || "").trim(),
      rationCard: String(req.body.rationCard || "").trim(),
      aadhaar: String(req.body.aadhaar || "").trim(),
      village: String(req.body.village || "").trim(),
      phone: String(req.body.phone || "").trim(),
      password: String(req.body.password || "").trim(),
    };

    if (!payload.name || !payload.rationCard || !payload.password) {
      return res.status(400).json({
        ok: false,
        message: "Name, ration card, and password are required.",
      });
    }

    const existingByCard = await User.findOne({ rationCard: payload.rationCard }).lean();
    if (existingByCard) {
      return res.status(409).json({
        ok: false,
        message: "A user already exists with this ration card.",
      });
    }

    if (payload.aadhaar) {
      const existingByAadhaar = await User.findOne({ aadhaar: payload.aadhaar }).lean();
      if (existingByAadhaar) {
        return res.status(409).json({
          ok: false,
          message: "A user already exists with this Aadhaar number.",
        });
      }
    }

    const created = await User.create(payload);

    return res.status(201).json({
      ok: true,
      message: "User added successfully to MongoDB.",
      user: {
        name: created.name,
        rationCard: created.rationCard,
        aadhaar: created.aadhaar,
        village: created.village,
        phone: created.phone,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "Duplicate value found while creating user.",
      });
    }
    next(error);
  }
});

router.get("/delivery-persons", async (req, res, next) => {
  try {
    const people = await DeliveryPerson.find().sort({ village: 1 }).lean();
    return res.json({ ok: true, deliveryPersons: people });
  } catch (error) {
    next(error);
  }
});

router.post("/delivery-persons", async (req, res, next) => {
  try {
    const payload = {
      village: String(req.body.village || "").trim(),
      name: String(req.body.name || "").trim(),
      phone: String(req.body.phone || "").trim(),
      isActive: req.body.isActive !== false,
    };

    if (!payload.village || !payload.name) {
      return res.status(400).json({
        ok: false,
        message: "Village and delivery person name are required.",
      });
    }

    const updated = await DeliveryPerson.findOneAndUpdate(
      { village: payload.village },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      ok: true,
      message: "Delivery person assigned successfully.",
      deliveryPerson: updated,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/month-items", async (req, res, next) => {
  try {
    const monthKey = String(req.query.month || getMonthKey()).trim();
    const items = await ensureMonthConfig(monthKey);
    return res.json({ ok: true, monthKey, items });
  } catch (error) {
    next(error);
  }
});

router.put("/month-items", async (req, res, next) => {
  try {
    const monthKey = String(req.body.monthKey || getMonthKey()).trim();
    const incomingItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (incomingItems.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Provide at least one item configuration.",
      });
    }

    const docs = ITEM_CATALOG.map((baseItem) => {
      const incoming =
        incomingItems.find((item) => item.itemKey === baseItem.key) || {};
      return {
        monthKey,
        itemKey: baseItem.key,
        name: baseItem.name,
        price:
          Number.isFinite(Number(incoming.price)) && Number(incoming.price) >= 0
            ? Number(incoming.price)
            : baseItem.price,
        monthlyLimit:
          Number.isFinite(Number(incoming.monthlyLimit)) &&
          Number(incoming.monthlyLimit) >= 0
            ? toNonNegativeInteger(incoming.monthlyLimit)
            : baseItem.monthlyLimit,
        isAvailable:
          typeof incoming.isAvailable === "boolean" ? incoming.isAvailable : true,
        image: baseItem.image,
      };
    });

    await MonthlyItem.deleteMany({ monthKey });
    await MonthlyItem.insertMany(docs);

    return res.json({
      ok: true,
      message: `Monthly items updated for ${monthKey}.`,
      monthKey,
      items: await MonthlyItem.find({ monthKey }).lean(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/overview", async (req, res, next) => {
  try {
    const monthKey = String(req.query.month || getMonthKey()).trim();

    const [usersCount, sellers, stocks, transactions, deliveryPersons, monthItems] =
      await Promise.all([
        User.countDocuments(),
        Seller.find().lean(),
        Stock.find().lean(),
        Transaction.find().lean(),
        DeliveryPerson.countDocuments({ isActive: true }),
        ensureMonthConfig(monthKey),
      ]);

    const normalizedTransactions = transactions.map(normalizeTransactionDocument);
    const totalRevenue = normalizedTransactions.reduce(
      (sum, order) => sum + order.total,
      0
    );

    const stockMap = new Map(stocks.map((stock) => [stock.shopId, stock]));
    const lowStockShops = sellers
      .map((seller) => {
        const stock = stockMap.get(seller.shopId) || {};
        const lowItems = ITEM_CATALOG.filter(
          (item) => Number(stock[item.key] || 0) < 100
        ).map((item) => item.name);

        if (lowItems.length === 0) {
          return null;
        }

        return {
          shopId: seller.shopId,
          name: seller.name,
          village: seller.village,
          lowItems,
        };
      })
      .filter(Boolean);

    return res.json({
      ok: true,
      stats: {
        totalUsers: usersCount,
        totalSellers: sellers.length,
        totalTransactions: normalizedTransactions.length,
        totalRevenue,
        activeDeliveryPersons: deliveryPersons,
        availableMonthlyItems: monthItems.filter((item) => item.isAvailable).length,
      },
      lowStockShops,
      monthKey,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/shops", async (req, res, next) => {
  try {
    const [sellers, stocks, transactions] = await Promise.all([
      Seller.find().lean(),
      Stock.find().lean(),
      Transaction.find().lean(),
    ]);

    const stockMap = new Map(stocks.map((stock) => [stock.shopId, stock]));
    const normalizedTransactions = transactions.map(normalizeTransactionDocument);

    const shops = sellers.map((seller) => {
      const stock = stockMap.get(seller.shopId) || {
        shopId: seller.shopId,
        rice: 0,
        wheat: 0,
        sugar: 0,
        kerosene: 0,
      };
      const shopOrders = normalizedTransactions.filter(
        (order) => order.shopId === seller.shopId
      );

      const distributed = ITEM_CATALOG.reduce((result, item) => {
        result[item.key] = 0;
        return result;
      }, {});

      let totalSales = 0;
      for (const order of shopOrders) {
        totalSales += order.total;
        for (const line of order.items) {
          distributed[line.itemKey] += line.qty;
        }
      }

      return {
        shopId: seller.shopId,
        sellerName: seller.name,
        village: seller.village,
        phone: seller.phone,
        status: sellerStatus(seller),
        stock: {
          shopId: stock.shopId,
          rice: Number(stock.rice || 0),
          wheat: Number(stock.wheat || 0),
          sugar: Number(stock.sugar || 0),
          kerosene: Number(stock.kerosene || 0),
        },
        orderCount: shopOrders.length,
        totalSales,
        distributed,
      };
    });

    return res.json({ ok: true, shops });
  } catch (error) {
    next(error);
  }
});

router.get("/transactions", async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10);
    const maxRows = Number.isFinite(limit) && limit > 0 ? limit : 50;

    const [users, transactions] = await Promise.all([
      User.find().lean(),
      Transaction.find().sort({ date: -1 }).limit(maxRows).lean(),
    ]);

    const userNameMap = new Map(
      users.map((user) => [String(user.rationCard || ""), user.name])
    );

    const normalizedTransactions = transactions
      .map(normalizeTransactionDocument)
      .map((order) => ({
        ...order,
        userName: order.userName || userNameMap.get(order.rationCard) || "Unknown",
      }));

    return res.json({ ok: true, transactions: normalizedTransactions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
