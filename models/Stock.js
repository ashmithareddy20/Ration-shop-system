const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, trim: true, unique: true },
    rice: { type: Number, default: 0, min: 0 },
    wheat: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    kerosene: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Stock || mongoose.model("Stock", stockSchema);
