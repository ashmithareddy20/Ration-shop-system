const mongoose = require("mongoose");

const monthlyItemSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, trim: true, index: true },
    itemKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    monthlyLimit: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
    image: { type: String, trim: true },
  },
  { timestamps: true, collection: "monthlyitems" }
);

monthlyItemSchema.index({ monthKey: 1, itemKey: 1 }, { unique: true });

module.exports =
  mongoose.models.MonthlyItem || mongoose.model("MonthlyItem", monthlyItemSchema);
