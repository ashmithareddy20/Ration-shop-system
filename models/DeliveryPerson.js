const mongoose = require("mongoose");

const deliveryPersonSchema = new mongoose.Schema(
  {
    village: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "deliverypersons" }
);

deliveryPersonSchema.index({ village: 1 }, { unique: true });

module.exports =
  mongoose.models.DeliveryPerson ||
  mongoose.model("DeliveryPerson", deliveryPersonSchema);
