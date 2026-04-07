const express = require("express");
const router = express.Router();

const Seller = require("../models/seller");
const Stock = require("../models/Stock");
const Transaction = require("../models/Transaction");
const {
  ITEM_CATALOG,
  normalizeTransactionDocument,
  toNonNegativeInteger,
} = require("../utils/catalog");

async function getOrCreateStock(shopId) {
  let stock = await Stock.findOne({ shopId });
  if (!stock) {
    stock = await Stock.create({ shopId });
  }
  return stock;
}

function sellerStatus(seller) {
  return {
    openTime: seller.openTime || "09:00",
    closeTime: seller.closeTime || "16:00",
    isClosed: Boolean(seller.isClosed),
    leaveNote: seller.leaveNote || "",
  };
}

router.post("/login", async (req, res, next) => {
  try {
    const shopId = String(req.body.shopId || "").trim();
    const password = String(req.body.password || "").trim();

    if (!shopId || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Shop ID and password are required." });
    }

    const seller = await Seller.findOne({ shopId, password }).lean();
    if (!seller) {
      return res.status(401).json({ ok: false, message: "Invalid credentials." });
    }

    return res.json({
      ok: true,
      message: "Seller login successful.",
      seller: {
        shopId: seller.shopId,
        name: seller.name,
        village: seller.village,
        phone: seller.phone,
        status: sellerStatus(seller),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/stock/:shopId", async (req, res, next) => {
  try {
    const shopId = String(req.params.shopId || "").trim();
    const seller = await Seller.findOne({ shopId }).lean();

    if (!seller) {
      return res.status(404).json({ ok: false, message: "Seller not found." });
    }

    const stock = await getOrCreateStock(shopId);

    return res.json({
      ok: true,
      seller: {
        shopId: seller.shopId,
        name: seller.name,
        village: seller.village,
        status: sellerStatus(seller),
      },
      stock: {
        shopId: stock.shopId,
        rice: stock.rice,
        wheat: stock.wheat,
        sugar: stock.sugar,
        kerosene: stock.kerosene,
      },
      items: ITEM_CATALOG.map((item) => ({ key: item.key, name: item.name })),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/stock/:shopId", async (req, res, next) => {
  try {
    const shopId = String(req.params.shopId || "").trim();
    const updates = req.body.stock || req.body;

    const seller = await Seller.findOne({ shopId }).lean();
    if (!seller) {
      return res.status(404).json({ ok: false, message: "Seller not found." });
    }

    const stock = await getOrCreateStock(shopId);

    let updatedFieldCount = 0;
    for (const item of ITEM_CATALOG) {
      if (updates[item.key] === undefined || updates[item.key] === null) {
        continue;
      }

      const parsed = Number.parseInt(updates[item.key], 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({
          ok: false,
          message: `${item.name} must be a non-negative number.`,
        });
      }

      stock[item.key] = toNonNegativeInteger(parsed);
      updatedFieldCount += 1;
    }

    if (updatedFieldCount === 0) {
      return res.status(400).json({
        ok: false,
        message: "Provide at least one stock field to update.",
      });
    }

    await stock.save();

    return res.json({
      ok: true,
      message: "Stock updated successfully.",
      stock: {
        shopId: stock.shopId,
        rice: stock.rice,
        wheat: stock.wheat,
        sugar: stock.sugar,
        kerosene: stock.kerosene,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/shop-status/:shopId", async (req, res, next) => {
  try {
    const shopId = String(req.params.shopId || "").trim();
    const openTime = String(req.body.openTime || "09:00").trim();
    const closeTime = String(req.body.closeTime || "16:00").trim();
    const isClosed = Boolean(req.body.isClosed);
    const leaveNote = String(req.body.leaveNote || "").trim();

    const seller = await Seller.findOne({ shopId });
    if (!seller) {
      return res.status(404).json({ ok: false, message: "Seller not found." });
    }

    seller.openTime = openTime || "09:00";
    seller.closeTime = closeTime || "16:00";
    seller.isClosed = isClosed;
    seller.leaveNote = leaveNote;
    await seller.save();

    return res.json({
      ok: true,
      message: isClosed
        ? "Shop marked as closed (leave)."
        : "Shop timings updated successfully.",
      status: sellerStatus(seller),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:shopId", async (req, res, next) => {
  try {
    const shopId = String(req.params.shopId || "").trim();
    const orders = await Transaction.find({ shopId }).sort({ date: -1 }).lean();

    return res.json({
      ok: true,
      orders: orders.map(normalizeTransactionDocument),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/summary/:shopId", async (req, res, next) => {
  try {
    const shopId = String(req.params.shopId || "").trim();
    const orders = await Transaction.find({ shopId }).lean();

    const totals = ITEM_CATALOG.reduce((result, item) => {
      result[item.key] = 0;
      return result;
    }, {});

    let totalRevenue = 0;
    for (const order of orders.map(normalizeTransactionDocument)) {
      totalRevenue += order.total;
      for (const line of order.items) {
        totals[line.itemKey] += line.qty;
      }
    }

    return res.json({
      ok: true,
      summary: {
        shopId,
        orderCount: orders.length,
        totalRevenue,
        totalDistributed: totals,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
