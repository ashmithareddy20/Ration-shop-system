const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    village: { type: String, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, trim: true },
    openTime: { type: String, default: "09:00" },
    closeTime: { type: String, default: "16:00" },
    isClosed: { type: Boolean, default: false },
    leaveNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Seller || mongoose.model("Seller", sellerSchema);
