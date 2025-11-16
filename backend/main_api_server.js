const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");

dotenv.config();

console.log("\n🔧 Backend Initializing...");
console.log("PORT:", process.env.PORT || 8000);
console.log("MONGO_URI:", process.env.MONGO_URI ? "✓ Set" : "✗ Not set");
console.log("AI_API_URL:", process.env.AI_API_URL || "not set");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

let db = null;

// -----------------------------
// MongoDB Connection
// -----------------------------
console.log("\n📡 Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/value_scout")
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    db = mongoose.connection.db;
    console.log("✅ Database object obtained");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️ Continuing without database...");
  });

// Mongoose Model (flexible schema)
const Product = mongoose.model("Product", new mongoose.Schema({}, { strict: false }));

// -----------------------------
// HEALTH CHECK
// -----------------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "ValueScout backend running" });
});

// -----------------------------
// 1️⃣ AI STYLE BUILDER → PROXY TO PYTHON API
// -----------------------------
app.get("/api/style-builder/:productId", async (req, res) => {
  const productId = req.params.productId;
  const aiApiUrl = `${process.env.AI_API_URL}/api/style-builder/${productId}`;
  
  console.log(`[BACKEND] Style builder request for productId: ${productId}`);
  console.log(`[BACKEND] Calling AI API: ${aiApiUrl}`);

  try {
    const response = await axios.get(aiApiUrl);
    console.log(`[BACKEND] AI API response status: ${response.status}`);
    res.json(response.data);
  } catch (error) {
    console.error("⚠️ AI API error:", error.message);
    if (error.response) {
      console.error(`[BACKEND] AI API error status: ${error.response.status}`);
      console.error(`[BACKEND] AI API error data:`, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "AI service unavailable" });
    }
  }
});

// -----------------------------
// 2️⃣ PRODUCT SEARCH (IMPROVED VERSION)
// FROM YOUR NEW CODE → NOW INTEGRATED
// -----------------------------
app.get("/api/search", async (req, res) => {
  const q = req.query.q || "";
  const trimmed = String(q).trim();

  if (trimmed === "") return res.json([]);
  if (!db) return res.status(500).json({ error: "Database not initialized" });

  try {
    const col = db.collection(process.env.COLLECTION_NAME || "products");
    const regex = new RegExp(trimmed, "i");

    const docs = await col
      .find({
        $or: [
          { productName: { $regex: regex } },
          { brand: { $regex: regex } },
          { category: { $regex: regex } },
          { source: { $regex: regex } }
        ],
      })
      .limit(100)
      .toArray();

    res.json(docs);
  } catch (err) {
    console.error("Error in /api/search:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 3️⃣ FETCH MULTIPLE PRODUCTS BY IDS
// FROM YOUR NEW CODE → NOW INTEGRATED
// -----------------------------
app.get("/api/products-by-ids", async (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam) return res.status(400).json({ error: "ids query parameter is required" });

  try {
    const ids = String(idsParam)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const converted = ids.map((id) =>
      mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
    );

    if (!db) return res.status(500).json({ error: "Database not initialized yet" });

    const collection = db.collection(process.env.COLLECTION_NAME || "products");
    const docs = await collection.find({ _id: { $in: converted } }).toArray();

    res.json(docs);
  } catch (err) {
    console.error("Error in /api/products-by-ids:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 Backend Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\nReady to accept requests. Press Ctrl+C to stop.\n`);
});

// Global error handlers
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
