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
  DELIVERY_SLOTS,
  ONLINE_PAYMENT_METHODS,
  normalizeQuantities,
  hasAnyQuantity,
  findShopForUser,
  normalizeTransactionDocument,
  getMonthKey,
} = require("../utils/catalog");

function toShopStatus(seller) {
  return {
    openTime: seller?.openTime || "09:00",
    closeTime: seller?.closeTime || "16:00",
    isClosed: Boolean(seller?.isClosed),
    leaveNote: seller?.leaveNote || "",
  };
}

function normalizeMonthlyItems(monthlyItems, stock) {
  const itemMap = new Map(
    monthlyItems.map((entry) => [entry.itemKey, entry])
  );

  return ITEM_CATALOG.map((baseItem) => {
    const configured = itemMap.get(baseItem.key);
    return {
      key: baseItem.key,
      name: configured?.name || baseItem.name,
      price: configured?.price ?? baseItem.price,
      monthlyLimit: configured?.monthlyLimit ?? baseItem.monthlyLimit ?? 0,
      isAvailable: configured?.isAvailable ?? true,
      image: configured?.image || baseItem.image,
      availableQty: Number(stock?.[baseItem.key] || 0),
    };
  });
}

async function ensureMonthConfig(monthKey) {
  const existing = await MonthlyItem.find({ monthKey }).lean();
  if (existing.length > 0) {
    return existing;
  }

  const defaultDocs = ITEM_CATALOG.map((item) => ({
    monthKey,
    itemKey: item.key,
    name: item.name,
    price: item.price,
    monthlyLimit: item.monthlyLimit,
    isAvailable: true,
    image: item.image,
  }));

  await MonthlyItem.insertMany(defaultDocs, { ordered: false });
  return MonthlyItem.find({ monthKey }).lean();
}

async function getOrCreateStock(shopId) {
  let stock = await Stock.findOne({ shopId });
  if (!stock) {
    stock = await Stock.create({ shopId });
  }
  return stock;
}

async function getContextForUser(rationCard) {
  const user = await User.findOne({ rationCard }).lean();
  if (!user) {
    return null;
  }

  const sellers = await Seller.find().lean();
  const shop = findShopForUser(user, sellers);
  const deliveryPerson = await DeliveryPerson.findOne({
    village: user.village,
    isActive: true,
  }).lean();

  return { user, shop, deliveryPerson };
}

router.post("/login", async (req, res, next) => {
  try {
    const rationCard = String(req.body.rationCard || "").trim();
    const password = String(req.body.password || "").trim();

    if (!rationCard || !password) {
      return res.status(400).json({
        ok: false,
        message: "Ration card and password are required.",
      });
    }

    const user = await User.findOne({ rationCard, password }).lean();
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid credentials." });
    }

    const sellers = await Seller.find().lean();
    const shop = findShopForUser(user, sellers);
    const deliveryPerson = await DeliveryPerson.findOne({
      village: user.village,
      isActive: true,
    }).lean();

    return res.json({
      ok: true,
      message: "Login successful.",
      user: {
        name: user.name,
        rationCard: user.rationCard,
        village: user.village,
        phone: user.phone,
      },
      assignedShop: shop
        ? {
            shopId: shop.shopId,
            name: shop.name,
            village: shop.village,
            status: toShopStatus(shop),
          }
        : null,
      deliveryPerson: deliveryPerson
        ? {
            village: deliveryPerson.village,
            name: deliveryPerson.name,
            phone: deliveryPerson.phone,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/profile/:rationCard", async (req, res, next) => {
  try {
    const rationCard = String(req.params.rationCard || "").trim();
    const context = await getContextForUser(rationCard);

    if (!context) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    const { user, shop, deliveryPerson } = context;

    return res.json({
      ok: true,
      user: {
        name: user.name,
        rationCard: user.rationCard,
        village: user.village,
        phone: user.phone,
        aadhaar: user.aadhaar,
      },
      assignedShop: shop
        ? {
            shopId: shop.shopId,
            name: shop.name,
            village: shop.village,
            status: toShopStatus(shop),
          }
        : null,
      deliveryPerson: deliveryPerson
        ? {
            village: deliveryPerson.village,
            name: deliveryPerson.name,
            phone: deliveryPerson.phone,
          }
        : null,
      deliverySlots: DELIVERY_SLOTS,
      paymentMethods: ONLINE_PAYMENT_METHODS,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/items/:rationCard", async (req, res, next) => {
  try {
    const rationCard = String(req.params.rationCard || "").trim();
    const monthKey = String(req.query.month || getMonthKey()).trim();
    const context = await getContextForUser(rationCard);

    if (!context) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    const { user, shop, deliveryPerson } = context;
    if (!shop) {
      return res
        .status(400)
        .json({ ok: false, message: "No seller is assigned to this user." });
    }

    const [stock, monthlyConfig] = await Promise.all([
      getOrCreateStock(shop.shopId),
      ensureMonthConfig(monthKey),
    ]);

    const items = normalizeMonthlyItems(monthlyConfig, stock);

    return res.json({
      ok: true,
      monthKey,
      shop: {
        shopId: shop.shopId,
        name: shop.name,
        village: shop.village,
        status: toShopStatus(shop),
      },
      deliveryPerson: deliveryPerson
        ? {
            village: deliveryPerson.village,
            name: deliveryPerson.name,
            phone: deliveryPerson.phone,
          }
        : null,
      paymentMethods: ONLINE_PAYMENT_METHODS,
      deliverySlots: DELIVERY_SLOTS,
      items,
      user: {
        rationCard: user.rationCard,
        name: user.name,
        village: user.village,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/order", async (req, res, next) => {
  try {
    const rationCard = String(req.body.rationCard || "").trim();
    const paymentMethod = String(req.body.paymentMethod || "").trim();
    const deliverySlot = String(req.body.deliverySlot || "").trim();
    const monthKey = String(req.body.monthKey || getMonthKey()).trim();
    const quantities = normalizeQuantities(req.body.quantities || req.body);

    if (!rationCard) {
      return res
        .status(400)
        .json({ ok: false, message: "Ration card is required." });
    }

    if (!ONLINE_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        ok: false,
        message: "Please choose a valid online payment method.",
      });
    }

    if (!DELIVERY_SLOTS.includes(deliverySlot)) {
      return res.status(400).json({
        ok: false,
        message: "Please choose a delivery time between 09:00 and 16:00.",
      });
    }

    if (!hasAnyQuantity(quantities)) {
      return res.status(400).json({
        ok: false,
        message: "At least one item quantity must be greater than zero.",
      });
    }

    const context = await getContextForUser(rationCard);
    if (!context) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    const { user, shop, deliveryPerson } = context;
    if (!shop) {
      return res
        .status(400)
        .json({ ok: false, message: "No seller is assigned to this user." });
    }

    if (shop.isClosed) {
      return res.status(400).json({
        ok: false,
        message: "Shop is closed today. Please try on another day.",
      });
    }

    const [stock, monthlyConfig] = await Promise.all([
      getOrCreateStock(shop.shopId),
      ensureMonthConfig(monthKey),
    ]);

    const configuredItems = normalizeMonthlyItems(monthlyConfig, stock);
    const configMap = new Map(configuredItems.map((item) => [item.key, item]));

    for (const [key, qty] of Object.entries(quantities)) {
      if (qty <= 0) continue;
      const itemConfig = configMap.get(key);
      if (!itemConfig?.isAvailable) {
        return res.status(400).json({
          ok: false,
          message: `${itemConfig?.name || key} is not available this month.`,
        });
      }
      if (itemConfig.monthlyLimit > 0 && qty > itemConfig.monthlyLimit) {
        return res.status(400).json({
          ok: false,
          message: `${itemConfig.name} limit is ${itemConfig.monthlyLimit} for this month.`,
        });
      }
      if (qty > itemConfig.availableQty) {
        return res.status(400).json({
          ok: false,
          message: `Insufficient ${itemConfig.name} stock at shop ${shop.shopId}.`,
        });
      }
    }

    const monthOrders = await Transaction.find({ rationCard, monthKey }).lean();
    const monthTotals = ITEM_CATALOG.reduce((result, item) => {
      result[item.key] = 0;
      return result;
    }, {});

    for (const oldOrder of monthOrders) {
      const normalized = normalizeTransactionDocument(oldOrder);
      for (const line of normalized.items || []) {
        monthTotals[line.itemKey] += Number(line.qty || 0);
      }
    }

    for (const [key, qty] of Object.entries(quantities)) {
      if (qty <= 0) continue;
      const itemConfig = configMap.get(key);
      const projected = monthTotals[key] + qty;
      if (itemConfig.monthlyLimit > 0 && projected > itemConfig.monthlyLimit) {
        return res.status(400).json({
          ok: false,
          message: `${itemConfig.name} monthly limit exceeded. Used ${monthTotals[key]}, requested ${qty}, limit ${itemConfig.monthlyLimit}.`,
        });
      }
    }

    const items = ITEM_CATALOG.filter((item) => quantities[item.key] > 0).map(
      (item) => {
        const config = configMap.get(item.key) || item;
        return {
          itemKey: item.key,
          name: config.name,
          qty: quantities[item.key],
          price: config.price,
          amount: quantities[item.key] * config.price,
        };
      }
    );

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    ITEM_CATALOG.forEach((item) => {
      stock[item.key] = Number(stock[item.key] || 0) - quantities[item.key];
    });
    await stock.save();

    const paymentReference = `PAY-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    const order = await Transaction.create({
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rationCard,
      userName: user.name,
      shopId: shop.shopId,
      village: user.village,
      items,
      total,
      rice: quantities.rice,
      wheat: quantities.wheat,
      sugar: quantities.sugar,
      kerosene: quantities.kerosene,
      monthKey,
      paymentMethod,
      paymentStatus: "Paid Online",
      paymentReference,
      deliverySlot,
      deliveryPerson: deliveryPerson
        ? {
            village: deliveryPerson.village,
            name: deliveryPerson.name,
            phone: deliveryPerson.phone,
          }
        : {
            village: user.village,
            name: "Not Assigned",
            phone: "",
          },
      date: new Date(),
    });

    return res.status(201).json({
      ok: true,
      message: "Order placed and paid online successfully.",
      order: normalizeTransactionDocument(order.toObject()),
      stockAfterOrder: {
        shopId: shop.shopId,
        rice: stock.rice,
        wheat: stock.wheat,
        sugar: stock.sugar,
        kerosene: stock.kerosene,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "Duplicate order ID generated. Please retry.",
      });
    }
    next(error);
  }
});

router.get("/orders/:rationCard", async (req, res, next) => {
  try {
    const rationCard = String(req.params.rationCard || "").trim();
    const orders = await Transaction.find({ rationCard }).sort({ date: -1 }).lean();

    return res.json({
      ok: true,
      orders: orders.map(normalizeTransactionDocument),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
