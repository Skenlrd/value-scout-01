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

// Root endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "ValueScout backend running" });
});

// Route that proxies to Flask AI API
app.get("/api/style-builder/:productId", async (req, res) => {
  const aiApiUrl = `${process.env.AI_API_URL}/api/style-builder/${req.params.productId}`;
  try {
    const response = await axios.get(aiApiUrl);
    res.json(response.data);
  } catch (error) {
    console.error("⚠️ AI API error:", error.message);
    res.status(500).json({ error: "AI service unavailable" });
  }
});

// Simple product search endpoint
app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  if (!q || String(q).trim() === "") return res.json([]);

  if (!db) return res.status(500).json({ error: "Database not initialized" });

  try {
    const col = db.collection(process.env.COLLECTION_NAME || "products");
    const regex = new RegExp(String(q).trim(), "i");
    const docs = await col
      .find({
        $or: [
          { productName: { $regex: regex } },
          { name: { $regex: regex } },
          { brand: { $regex: regex } },
          { category: { $regex: regex } },
          { source: { $regex: regex } },
        ],
      })
      .limit(100)
      .toArray();

    return res.json(docs);
  } catch (err) {
    console.error("Error in /api/search:", err && err.message ? err.message : err);
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

// Fetch multiple products by ids
app.get("/api/products-by-ids", async (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam) {
    return res.status(400).json({ error: "ids query parameter is required" });
  }

  try {
    const ids = String(idsParam).split(",").map((s) => s.trim()).filter(Boolean);
    const converted = ids.map((id) => (mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : id));

    if (!db) {
      return res.status(500).json({ error: "Database not initialized yet" });
    }

    const collection = db.collection(process.env.COLLECTION_NAME || "products");
    const docs = await collection.find({ _id: { $in: converted } }).toArray();
    res.json(docs);
  } catch (err) {
    console.error("Error in /api/products-by-ids:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Connect to MongoDB
console.log("\n📡 Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/value_scout")
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    db = mongoose.connection.db;
    console.log("✅ Database object obtained");
    
    // Check AI service health
    if (process.env.AI_API_URL) {
      console.log(`\n🤖 Checking AI service...`);
      axios.get(`${process.env.AI_API_URL}/health`, { timeout: 2000 })
        .then(() => console.log("✅ AI service is healthy"))
        .catch(err => console.log("⚠️  AI service unreachable (will retry on requests)"));
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️ Continuing without database...");
  });

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\nReady to accept requests. Press Ctrl+C to stop.\n`);
});

// Error handlers
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
