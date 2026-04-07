const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const publicDir = path.join(__dirname, "public");
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rationDB";

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.use("/user", require("./routes/userRoutes"));
app.use("/seller", require("./routes/sellerRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/delivery", require("./routes/deliveryRoutes"));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, message: "Internal server error." });
});

async function startServer() {
  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected at ${mongoUri}`);

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
