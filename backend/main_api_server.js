console.log("🚀 SCRIPT STARTED - Loading dependencies...");

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");

console.log("📦 Dependencies loaded, loading price_tracker...");

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

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Price Alert Schema
const priceAlertSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  currentPrice: { type: mongoose.Schema.Types.Mixed },
  targetPrice: { type: Number, required: true },
  source: { type: String },
  productUrl: { type: String },
  productImage: { type: String },
  isTriggered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  triggeredAt: { type: Date }
});

// Create models
const Product = mongoose.model("Product", productSchema);
const Wishlist = mongoose.model("Wishlist", wishlistSchema);
const User = mongoose.model("User", userSchema);
const PriceAlert = mongoose.model("PriceAlert", priceAlertSchema);

// ==========================================
// DEBUG: SEND TEST EMAIL (uses same SMTP config)
// ==========================================
// Allow GET (with ?to=) or POST (with JSON {to}) for easier testing
app.all("/api/debug/send-test-email", async (req, res) => {
  try {
    const to = req.method === "GET" ? req.query?.to : req.body?.to;
    if (!to) return res.status(400).json({ error: "Missing 'to' email" });

    const nodemailer = require("nodemailer");
    const fromAddress = process.env.EMAIL_FROM || `ValueScout <${process.env.EMAIL_USER || "noreply@valuescout.com"}>`;
    let transporter;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const host = process.env.EMAIL_HOST || "smtp.gmail.com";
      const port = Number(process.env.EMAIL_PORT) || 587;
      const secure = String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      try {
        await transporter.verify();
      } catch (verifyErr) {
        return res.status(500).json({ error: "SMTP verify failed", details: verifyErr.message });
      }
    } else {
      // Ethereal fallback for testing
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: "ValueScout Test Email",
      text: "This is a test email from ValueScout backend.",
    });

    return res.json({ status: "sent", messageId: info.messageId || null, response: info.response || null });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to send" });
  }
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "ValueScout backend running" });
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

/**
 * POST /api/auth/register
 * Register a new user and send verification email
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password: password, // TODO: Hash with bcrypt in production
      name: name || email.split('@')[0],
      isEmailVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpiry: tokenExpiry
    });

    await newUser.save();

    // Send verification email (using nodemailer)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    try {
      const nodemailer = require('nodemailer');

      const fromAddress = process.env.EMAIL_FROM || `ValueScout <${process.env.EMAIL_USER || 'noreply@valuescout.com'}>`;
      let transporter;
      
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
        const port = Number(process.env.EMAIL_PORT) || 587;
        const secure = String(process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';
        console.log('📧 Using real SMTP credentials', { host, port, secure, user: process.env.EMAIL_USER });
        transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        try {
          await transporter.verify();
          console.log('✅ SMTP connection verified');
        } catch (verifyErr) {
          console.error('⚠️ SMTP verification failed:', verifyErr.message);
        }
      } else {
        // Test email config - creates a fake inbox at ethereal.email
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log(`📧 Using Ethereal Email for testing: ${testAccount.user}`);
      }

      const info = await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: 'Verify Your Email - ValueScout',
        html: `
          <h2>Welcome to ValueScout!</h2>
          <p>Please verify your email to complete registration.</p>
          <a href="${verificationLink}" style="background-color: #14b8a6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p>This link expires in 24 hours.</p>
        `
      });

      console.log(`✅ Verification email sent to: ${email} (messageId: ${info.messageId || 'n/a'})`);
      
      // For Ethereal Email (testing), show preview URL
      if (process.env.NODE_ENV !== 'production' && info.response && info.response.includes('250')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`📧 Preview email: ${previewUrl}`);
        }
      }
    } catch (emailError) {
      console.error("⚠️ Failed to send verification email:", emailError.message);
      if (emailError && emailError.response) {
        console.error("SMTP response:", emailError.response);
      }
      // Don't fail the registration if email sending fails
    }

    res.status(201).json({
      message: "Registration successful! Check your email to verify your account.",
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        isEmailVerified: false
      }
    });

  } catch (error) {
    console.error("❌ Registration error:", error.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * GET /api/auth/verify-email
 * Verify email with token
 */
app.get("/api/auth/verify-email", async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ error: "Token and email are required" });
    }

    // Find user with verification token
    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: token
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    // Check if token has expired
    if (user.verificationTokenExpiry < new Date()) {
      return res.status(400).json({ error: "Verification token has expired. Please register again." });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    console.log(`✅ Email verified: ${email}`);

    res.json({
      message: "Email verified successfully! You can now log in.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error("❌ Email verification error:", error.message);
    res.status(500).json({ error: "Email verification failed" });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email to an unverified user
 */
app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // New token
    const verificationToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = tokenExpiry;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const nodemailer = require("nodemailer");
    const fromAddress = process.env.EMAIL_FROM || `ValueScout <${process.env.EMAIL_USER || "noreply@valuescout.com"}>`;
    let transporter;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const host = process.env.EMAIL_HOST || "smtp.gmail.com";
      const port = Number(process.env.EMAIL_PORT) || 587;
      const secure = String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";
      transporter = nodemailer.createTransport({ host, port, secure, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({ host: "smtp.ethereal.email", port: 587, secure: false, auth: { user: testAccount.user, pass: testAccount.pass } });
      console.log(`📧 Using Ethereal Email for testing: ${testAccount.user}`);
    }

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Verify Your Email - ValueScout (Resent)",
      html: `
        <h2>Welcome to ValueScout!</h2>
        <p>Please verify your email to complete registration.</p>
        <a href="${verificationLink}" style="background-color: #14b8a6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
      `
    });

    res.json({ message: "Verification email resent" });
  } catch (error) {
    console.error("❌ Resend verification error:", error.message);
    res.status(500).json({ error: "Failed to resend verification" });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in. Check your inbox for the verification link." });
    }

    // Check password (in production, use bcrypt.compare!)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log(`✅ User logged in: ${email}`);
    
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/auth/google
 * Quick login/register with Google
 */
app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: "Email and Google ID are required" });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user with email auto-verified (trusted OAuth provider)
      user = new User({
        email: email.toLowerCase(),
        password: `oauth_google_${googleId}`, // Placeholder password
        name: name || email.split('@')[0],
        isEmailVerified: true, // Auto-verify for OAuth
        verificationToken: null,
        verificationTokenExpiry: null
      });
      await user.save();
      console.log(`✅ New user created via Google: ${email}`);
    }

    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error("❌ Google login error:", error.message);
    res.status(500).json({ error: "Google login failed" });
  }
});

/**
 * POST /api/auth/apple
 * Quick login/register with Apple
 */
app.post("/api/auth/apple", async (req, res) => {
  try {
    const { email, name, appleId } = req.body;

    if (!email || !appleId) {
      return res.status(400).json({ error: "Email and Apple ID are required" });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user with email auto-verified (trusted OAuth provider)
      user = new User({
        email: email.toLowerCase(),
        password: `oauth_apple_${appleId}`, // Placeholder password
        name: name || email.split('@')[0],
        isEmailVerified: true, // Auto-verify for OAuth
        verificationToken: null,
        verificationTokenExpiry: null
      });
      await user.save();
      console.log(`✅ New user created via Apple: ${email}`);
    }

    res.json({
      message: "Apple login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error("❌ Apple login error:", error.message);
    res.status(500).json({ error: "Apple login failed" });
  }
});

// ==========================================
// PRICE ALERTS
// ==========================================
/**
 * POST /api/price-alerts
 * Create a price alert for a product
 */
app.post("/api/price-alerts", async (req, res) => {
  try {
    const { userId, productId, productName, currentPrice, targetPrice, source, productUrl, productImage } = req.body;

    if (!userId || !productId || !targetPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if alert already exists for this product
    const existingAlert = await PriceAlert.findOne({ userId, productId, isTriggered: false });
    if (existingAlert) {
      return res.status(400).json({ error: "Price alert already exists for this product" });
    }

    const alert = new PriceAlert({
      userId,
      productId,
      productName,
      currentPrice,
      targetPrice,
      source,
      productUrl,
      productImage
    });

    await alert.save();
    console.log(`✅ Price alert created: ${productName} at ₹${targetPrice}`);

    res.status(201).json({
      message: `Price alert set for ${productName} at ₹${targetPrice}`,
      alert
    });
  } catch (error) {
    console.error("❌ Price alert error:", error.message);
    res.status(500).json({ error: "Failed to create price alert" });
  }
});

/**
 * GET /api/price-alerts/:userId
 * Get all active price alerts for a user
 */
app.get("/api/price-alerts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const alerts = await PriceAlert.find({ userId, isTriggered: false }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    console.error("❌ Fetch alerts error:", error.message);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

/**
 * DELETE /api/price-alerts/:alertId
 * Remove a price alert
 */
app.delete("/api/price-alerts/:alertId", async (req, res) => {
  try {
    const { alertId } = req.params;
    await PriceAlert.findByIdAndDelete(alertId);
    res.json({ message: "Price alert removed" });
  } catch (error) {
    console.error("❌ Delete alert error:", error.message);
    res.status(500).json({ error: "Failed to delete alert" });
  }
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

// ==========================================
// 2️⃣ PRICE COMPARISON - MULTI-SOURCE
// ==========================================
/**
 * GET /api/compare-prices?q=query
 * Compare prices across Local DB, Amazon, and Flipkart
 * Returns structured data for all three sources
 */
app.get("/api/compare-prices", async (req, res) => {
  const q = req.query.q || "";
  const trimmed = String(q).trim();

  if (!trimmed) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    console.log(`\n⚖️ Comparing prices for: "${trimmed}"`);

    // Run 3 parallel searches
    const [localResult, amazonResult, flipkartResult] = await Promise.all([
      searchLocalDB(trimmed),
      searchAmazonForComparison(trimmed),
      searchFlipkartForComparison(trimmed)
    ]);

    console.log(`✅ Comparison complete`);

    res.json({
      query: trimmed,
      sources: {
        local: localResult,
        amazon: amazonResult,
        flipkart: flipkartResult
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error in /api/compare-prices:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search Local MongoDB for closest match
 */
async function searchLocalDB(query) {
  try {
    console.log("🗂️ Searching local DB...");
    
    // Create a regex for case-insensitive partial matching
    const regex = new RegExp(query, "i");
    
    const product = await Product.findOne({
      $or: [
        { productName: regex },
        { link: regex }
      ]
    }).sort({ createdAt: -1 });

    if (!product) {
      console.log("❌ No local product found");
      return null;
    }

    console.log(`✅ Found in local DB: ${product.productName}`);

    return {
      source: "Local DB",
      title: product.productName,
      price: product.price,
      image: product.image,
      link: product.link,
      asin: product.asin,
      rating: product.rating,
      reviews: product.reviews
    };

  } catch (error) {
    console.error("❌ Local DB search error:", error.message);
    return null;
  }
}

/**
 * Search Amazon via SerpApi for comparison
 */
async function searchAmazonForComparison(query) {
  try {
    console.log("🔍 Searching Amazon...");
    
    const url = "https://serpapi.com/search";
    const params = {
      engine: "amazon",
      api_key: SERPAPI_KEY,
      amazon_domain: "amazon.in",
      k: query
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;

    // Get the first result
    const item = (data.organic_results || [])[0];
    if (!item) {
      console.log("❌ No Amazon results found");
      return null;
    }

    const priceData = item.price;
    const price = typeof priceData === "object" ? priceData.raw : priceData;

    console.log(`✅ Found on Amazon: ${item.title}`);

    return {
      source: "Amazon",
      title: item.title,
      price: price,
      image: item.image,
      link: item.link,
      rating: item.rating,
      reviews: item.review_count
    };

  } catch (error) {
    console.error("❌ Amazon search error:", error.message);
    return null;
  }
}

/**
 * Search Flipkart via Google Shopping for comparison
 */
async function searchFlipkartForComparison(query) {
  try {
    console.log("🔍 Searching Flipkart...");
    
    const url = "https://serpapi.com/search";
    const params = {
      engine: "google_shopping",
      api_key: SERPAPI_KEY,
      q: `${query} flipkart`,
      gl: "in"
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;

    // Get the first shopping result
    const item = (data.shopping_results || [])[0];
    if (!item) {
      console.log("❌ No Flipkart results found");
      return null;
    }

    const priceStr = item.price || "";
    // Extract numeric price
    const priceMatch = String(priceStr).match(/[\d.]+/);
    const price = priceMatch ? parseFloat(priceMatch[0]) : null;

    console.log(`✅ Found on Flipkart: ${item.title}`);

    return {
      source: "Flipkart",
      title: item.title,
      price: price,
      image: item.image,
      link: item.link,
      rating: item.rating,
      reviews: null
    };

  } catch (error) {
    console.error("❌ Flipkart search error:", error.message);
    return null;
  }
}

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

  // Initialize Price Tracker after server starts (with delay to ensure DB is ready)
  setTimeout(() => {
    try {
      console.log("🔄 Attempting to start price tracker...");
      startPriceTracker();
    } catch (err) {
      console.error("⚠️ Failed to start price tracker:", err.message);
    }
  }, 3000); // Wait 3 seconds for MongoDB to connect
});

// Global error handlers
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
