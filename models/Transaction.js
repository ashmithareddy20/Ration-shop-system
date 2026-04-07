const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema(
  {
    itemKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, trim: true, unique: true },
    rationCard: { type: String, required: true, trim: true, index: true },
    userName: { type: String, trim: true },
    shopId: { type: String, required: true, trim: true, index: true },
    village: { type: String, trim: true },
    items: { type: [lineItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    rice: { type: Number, default: 0, min: 0 },
    wheat: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    kerosene: { type: Number, default: 0, min: 0 },
    monthKey: { type: String, trim: true, index: true },
    deliverySlot: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    paymentStatus: { type: String, trim: true, default: "Paid Online" },
    paymentReference: { type: String, trim: true },
    deliveryPerson: {
      village: { type: String, trim: true },
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
