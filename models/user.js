const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rationCard: { type: String, required: true, trim: true, unique: true },
    aadhaar: { type: String, trim: true },
    village: { type: String, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
