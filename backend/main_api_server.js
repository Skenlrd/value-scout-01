const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const { startPriceTracker } = require("./price_tracker");

dotenv.config();

console.log("\n🔧 Backend Initializing...");
console.log("PORT:", process.env.PORT || 8000);
console.log("MONGO_URI:", process.env.MONGO_URI ? "✓ Set" : "✗ Not set");
console.log("AI_API_URL:", process.env.AI_API_URL || "not set");

const app = express();
const PORT = process.env.PORT || 8000;
const SERPAPI_KEY = "9c9ebdb9f7851dff0077e2ca096e4b82023ddbbb7b63fa5264ecaa0550ccdab5";

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

// ==========================================
// MONGOOSE SCHEMAS
// ==========================================

// Product Schema for storing search results
const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  price: { type: mongoose.Schema.Types.Mixed }, // Can be string or number
  source: { type: String, required: true }, // Amazon, Flipkart, Google Shopping
  image: { type: String },
  link: { type: String, required: true, unique: true }, // Unique to prevent duplicates
  asin: { type: String }, // Amazon ASIN
  rating: { type: mongoose.Schema.Types.Mixed },
  reviews: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });

// Wishlist Schema
const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title: { type: String, required: true },
  price: { type: mongoose.Schema.Types.Mixed },
  image: { type: String },
  source: { type: String },
  link: { type: String, required: true },
  asin: { type: String }, // For tracking purposes
  targetPrice: { type: mongoose.Schema.Types.Mixed }, // For price tracking alerts
  createdAt: { type: Date, default: Date.now }
});

// Create models
const Product = mongoose.model("Product", productSchema);
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "ValueScout backend running" });
});

// ==========================================
// 1️⃣ EXTERNAL SEARCH - SERPAPI INTEGRATION
// ==========================================
/**
 * GET /api/external-search?q=query
 * Fetches results from SerpApi (Amazon & Google Shopping for Flipkart)
 * Upserts results into MongoDB products collection
 * Returns combined results
 */
app.get("/api/external-search", async (req, res) => {
  const q = req.query.q || "";
  const trimmed = String(q).trim();

  if (!trimmed) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    console.log(`\n🔍 Searching for: "${trimmed}"`);
    
    // Fetch Amazon results
    const amazonResults = await fetchAmazonResults(trimmed);
    
    // Fetch Flipkart results (via Google Shopping)
    const flipkartResults = await fetchFlipkartResults(trimmed);
    
    // Combine results
    const combinedResults = [...amazonResults, ...flipkartResults];

    // Upsert to MongoDB
    if (combinedResults.length > 0) {
      await upsertProductsToMongoDB(combinedResults);
    }

    console.log(`✅ Search complete: ${amazonResults.length} Amazon + ${flipkartResults.length} Flipkart results`);
    
    res.json({
      success: true,
      count: combinedResults.length,
      amazon: amazonResults,
      flipkart: flipkartResults,
      all: combinedResults
    });

  } catch (error) {
    console.error("❌ Error in /api/external-search:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fetch Amazon results from SerpApi
 */
async function fetchAmazonResults(query) {
  try {
    const url = "https://serpapi.com/search";
    const params = {
      engine: "amazon",
      api_key: SERPAPI_KEY,
      amazon_domain: "amazon.in",
      k: query
    };

    console.log("📦 Fetching from Amazon...");
    const response = await axios.get(url, { params });
    const data = response.data;

    const results = [];
    for (const item of (data.organic_results || []).slice(0, 20)) {
      const link = item.link || "";
      const priceData = item.price;
      const price = typeof priceData === "object" ? priceData.raw : priceData;

      // Extract ASIN from link
      let asin = null;
      if (link.includes("/dp/")) {
        try {
          asin = link.split("/dp/")[1].split("/")[0].split("?")[0];
        } catch (e) {
          // ASIN extraction failed, continue without it
        }
      }

      results.push({
        productName: item.title,
        price: price,
        source: "Amazon",
        image: item.thumbnail,
        link: link,
        asin: asin,
        rating: item.rating,
        reviews: item.reviews
      });
    }

    console.log(`✓ Amazon: ${results.length} products`);
    return results;

  } catch (error) {
    console.error("⚠️ Amazon fetch error:", error.message);
    return [];
  }
}

/**
 * Fetch Flipkart results from SerpApi (Google Shopping)
 */
async function fetchFlipkartResults(query) {
  try {
    const url = "https://serpapi.com/search";
    const params = {
      engine: "google_shopping",
      api_key: SERPAPI_KEY,
      q: query,
      google_domain: "google.co.in",
      hl: "en",
      gl: "in"
    };

    console.log("📦 Fetching from Google Shopping (Flipkart)...");
    const response = await axios.get(url, { params });
    const data = response.data;

    const results = [];
    for (const item of (data.shopping_results || []).slice(0, 20)) {
      results.push({
        productName: item.title,
        price: item.price,
        source: item.source || "Google Shopping",
        image: item.thumbnail || "",
        link: item.product_link || "",
        rating: item.rating || null,
        reviews: item.reviews || null
      });
    }

    console.log(`✓ Flipkart/Shopping: ${results.length} products`);
    return results;

  } catch (error) {
    console.error("⚠️ Flipkart fetch error:", error.message);
    return [];
  }
}

/**
 * Upsert products to MongoDB with duplicate prevention
 * Uses link as unique identifier
 */
async function upsertProductsToMongoDB(products) {
  try {
    if (!products.length) return;

    const bulkOps = products.map((product) => ({
      updateOne: {
        filter: { link: product.link }, // Match by link to prevent duplicates
        update: { 
          $set: {
            ...product,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await Product.bulkWrite(bulkOps);
    
    console.log(`📊 MongoDB upsert: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
    return result;

  } catch (error) {
    console.error("⚠️ Error upserting to MongoDB:", error.message);
    throw error;
  }
}

// ==========================================
// 2️⃣ WISHLIST ROUTES
// ==========================================

/**
 * POST /api/wishlist/add
 * Add an item to user's wishlist
 * Prevents duplicates by link
 */
app.post("/api/wishlist/add", async (req, res) => {
  try {
    const { userId, title, price, image, source, link, asin, targetPrice } = req.body;

    if (!userId || !title || !link) {
      return res.status(400).json({ 
        error: "Missing required fields: userId, title, link" 
      });
    }

    console.log(`⭐ Adding to wishlist for user ${userId}: ${title}`);

    // Check if item already exists (prevent duplicates by link)
    const existing = await Wishlist.findOne({ userId, link });

    if (existing) {
      return res.status(409).json({ 
        message: "Item already in wishlist",
        status: "duplicate",
        item: existing
      });
    }

    // Create new wishlist item
    const wishlistItem = new Wishlist({
      userId,
      title,
      price,
      image,
      source,
      link,
      asin,
      targetPrice
    });

    const saved = await wishlistItem.save();

    console.log(`✅ Added to wishlist: ${saved._id}`);
    res.status(201).json({
      message: "Added to wishlist",
      status: "added",
      item: saved
    });

  } catch (error) {
    console.error("❌ Error in /api/wishlist/add:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/wishlist/remove
 * Remove an item from user's wishlist
 * Can remove by itemId or by link
 */
app.delete("/api/wishlist/remove", async (req, res) => {
  try {
    const { userId, itemId, link } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!itemId && !link) {
      return res.status(400).json({ 
        error: "Either itemId or link must be provided" 
      });
    }

    console.log(`🗑️ Removing from wishlist for user ${userId}`);

    let result;
    
    if (itemId) {
      // Remove by item ID
      result = await Wishlist.findByIdAndDelete(itemId);
    } else if (link) {
      // Remove by link
      result = await Wishlist.findOneAndDelete({ userId, link });
    }

    if (!result) {
      return res.status(404).json({ 
        message: "Item not found in wishlist",
        status: "not_found"
      });
    }

    console.log(`✅ Removed from wishlist: ${result._id}`);
    res.json({
      message: "Removed from wishlist",
      status: "removed",
      item: result
    });

  } catch (error) {
    console.error("❌ Error in /api/wishlist/remove:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wishlist/:userId
 * Get all wishlist items for a specific user
 */
app.get("/api/wishlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    console.log(`📋 Fetching wishlist for user ${userId}`);

    const items = await Wishlist.find({ userId }).sort({ createdAt: -1 });

    console.log(`✅ Found ${items.length} items in wishlist`);
    res.json({
      userId,
      count: items.length,
      items
    });

  } catch (error) {
    console.error("❌ Error in /api/wishlist/:userId:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wishlist/check/:userId
 * Check if a specific product (by link) is in user's wishlist
 */
app.get("/api/wishlist/check/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { link } = req.query;

    if (!userId || !link) {
      return res.status(400).json({ 
        error: "userId and link query parameter are required" 
      });
    }

    const item = await Wishlist.findOne({ userId, link });

    res.json({
      inWishlist: !!item,
      item: item || null
    });

  } catch (error) {
    console.error("❌ Error in /api/wishlist/check/:userId:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wishlist/price-alert
 * Set a price alert for a wishlist item
 */
app.post("/api/wishlist/price-alert", async (req, res) => {
  try {
    const { userId, itemId, targetPrice } = req.body;

    if (!userId || !itemId || !targetPrice) {
      return res.status(400).json({ 
        error: "userId, itemId, and targetPrice are required" 
      });
    }

    const item = await Wishlist.findByIdAndUpdate(
      itemId,
      { targetPrice: targetPrice },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ 
        message: "Item not found in wishlist",
        status: "not_found"
      });
    }

    console.log(`🔔 Price alert set for ${item.title} at ₹${targetPrice}`);
    res.json({
      message: "Price alert set successfully",
      status: "alert_set",
      item: item
    });

  } catch (error) {
    console.error("❌ Error in /api/wishlist/price-alert:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3️⃣ AI STYLE BUILDER → PROXY TO PYTHON API
// ==========================================
/**
 * GET /api/style-builder/:productId
 * Proxy request to Python AI API for style recommendations
 */
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

// ==========================================
// 4️⃣ PRODUCT SEARCH (LOCAL MONGODB)
// ==========================================
/**
 * GET /api/search
 * Search products from local MongoDB collection
 * Uses regex matching on productName, brand, category, source
 */
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

// ==========================================
// 5️⃣ FETCH MULTIPLE PRODUCTS BY IDS
// ==========================================
/**
 * GET /api/products-by-ids?ids=id1,id2,id3
 * Fetch multiple products by their MongoDB IDs
 */
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

// ==========================================
// ERROR HANDLING & SERVER STARTUP
// ==========================================
app.listen(PORT, () => {
  console.log(`\n🚀 Backend Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\nReady to accept requests. Press Ctrl+C to stop.\n`);

  // Initialize Price Tracker after server starts
  try {
    startPriceTracker();
  } catch (err) {
    console.error("⚠️ Failed to start price tracker:", err.message);
  }
});

// Global error handlers
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
