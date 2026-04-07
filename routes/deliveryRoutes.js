const express = require("express");
const router = express.Router();

const DeliveryPerson = require("../models/DeliveryPerson");
const Transaction = require("../models/Transaction");
const { normalizeTransactionDocument, getMonthKey } = require("../utils/catalog");

function escapeRegex(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findActiveDeliveryPerson(village) {
  const normalizedVillage = String(village || "").trim();
  if (!normalizedVillage) {
    return null;
  }

  return DeliveryPerson.findOne({
    village: { $regex: new RegExp(`^${escapeRegex(normalizedVillage)}$`, "i") },
    isActive: true,
  }).lean();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function isSamePhone(a, b) {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return left && right && left === right;
}

router.post("/login", async (req, res, next) => {
  try {
    const village = String(req.body.village || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!village || !phone) {
      return res.status(400).json({
        ok: false,
        message: "Village and phone are required.",
      });
    }

    const person = await findActiveDeliveryPerson(village);
    if (!person || !isSamePhone(person.phone, phone)) {
      return res.status(401).json({
        ok: false,
        message: "Invalid delivery credentials.",
      });
    }

    return res.json({
      ok: true,
      message: "Delivery login successful.",
      deliveryPerson: {
        village: person.village,
        name: person.name,
        phone: person.phone,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const village = String(req.query.village || "").trim();
    const phone = String(req.query.phone || "").trim();
    const monthKey = String(req.query.month || getMonthKey()).trim();

    if (!village || !phone) {
      return res.status(400).json({
        ok: false,
        message: "Village and phone are required.",
      });
    }

    const person = await findActiveDeliveryPerson(village);
    if (!person || !isSamePhone(person.phone, phone)) {
      return res.status(401).json({
        ok: false,
        message: "Invalid delivery credentials.",
      });
    }

    const orders = await Transaction.find({
      monthKey,
      "deliveryPerson.village": person.village,
    })
      .sort({ deliverySlot: 1, date: -1 })
      .lean();

    const normalized = orders.map(normalizeTransactionDocument);
    const stats = {
      totalOrders: normalized.length,
      totalAmount: normalized.reduce((sum, order) => sum + Number(order.total || 0), 0),
      paidOrders: normalized.filter((order) =>
        String(order.paymentStatus || "").toLowerCase().includes("paid")
      ).length,
    };

    return res.json({
      ok: true,
      monthKey,
      deliveryPerson: {
        village: person.village,
        name: person.name,
        phone: person.phone,
      },
      stats,
      orders: normalized,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
