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
const SERPAPI_KEY = process.env.SERPAPI_KEY || "";

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
    const fromAddress = process.env.EMAIL_FROM || `ValueScout <${process.env.EMAIL_USER || "valuescout6@gmail.com"}>`;
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

      const fromAddress = process.env.EMAIL_FROM || `ValueScout <${process.env.EMAIL_USER || 'valuescout6@gmail.com'}>`;
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

    console.log(`🔍 Verification attempt - Email: ${email}, Token: ${token}`);

    if (!token || !email) {
      return res.status(400).json({ error: "Token and email are required" });
    }

    // Find user with verification token
    const decodedEmail = decodeURIComponent(email).toLowerCase();
    console.log(`🔍 Looking for user with email: ${decodedEmail}`);
    
    const user = await User.findOne({
      email: decodedEmail,
      verificationToken: token
    });

    if (!user) {
      // Try to find user just by email to give better error message
      const userByEmail = await User.findOne({ email: decodedEmail });
      if (userByEmail) {
        if (userByEmail.isEmailVerified) {
          console.log(`ℹ️ Email already verified: ${decodedEmail}`);
          return res.status(400).json({ error: "Email is already verified. You can log in." });
        }
        console.log(`❌ Token mismatch for: ${decodedEmail}`);
        console.log(`   Expected token: ${userByEmail.verificationToken}`);
        console.log(`   Received token: ${token}`);
      } else {
        console.log(`❌ No user found with email: ${decodedEmail}`);
      }
      return res.status(400).json({ error: "Invalid verification token" });
    }

    // Check if token has expired
    if (user.verificationTokenExpiry < new Date()) {
      console.log(`❌ Token expired for: ${decodedEmail}`);
      return res.status(400).json({ error: "Verification token has expired. Please register again." });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    console.log(`✅ Email verified: ${decodedEmail}`);

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
    const fromAddress = process.env.EMAIL_FROM || `ValueScout <${process.env.EMAIL_USER || "valuescout6@gmail.com"}>`;
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

/**
 * GET /api/lowest-this-month
 * Returns lowest priced shoes from Amazon in database (sorted by price)
 */
app.get("/api/lowest-this-month", async (req, res) => {
  try {
    console.log(`\n📉 Fetching lowest priced shoes from Amazon database`);
    
    // Find shoes from Amazon, sorted by price (lowest first)
    const lowestShoes = await Product.find({
      source: "Amazon",
      productName: /shoe|sneaker|boot|sandal|trainer/i
    })
    .sort({ price: 1 })
    .limit(4);
    
    // Convert prices to numbers for sorting
    const formatted = lowestShoes.map(shoe => {
      let numPrice = shoe.price;
      if (typeof shoe.price === 'string') {
        numPrice = parseFloat(shoe.price.replace(/[^\d.]/g, '')) || 0;
      }
      return {
        ...shoe.toObject(),
        numericPrice: numPrice
      };
    });
    
    // Sort by numeric price
    formatted.sort((a, b) => a.numericPrice - b.numericPrice);
    
    // Normalize field names: imageUrl -> image, productUrl -> link
    const normalized = formatted.map(shoe => ({
      ...shoe,
      image: shoe.image || shoe.imageUrl,
      link: shoe.link || shoe.productUrl
    }));
    
    console.log(`✓ Found ${normalized.length} lowest priced shoes from Amazon`);
    
    res.json({
      success: true,
      count: normalized.length,
      shoes: normalized.slice(0, 4)
    });
    
  } catch (error) {
    console.error("❌ Lowest this month error:", error.message);
    res.status(500).json({ error: error.message });
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
    
    // Fetch Nike results (via Google Shopping)
    const nikeResults = await fetchNikeResults(trimmed);
    
    // Combine results
    const combinedResults = [...amazonResults, ...flipkartResults, ...nikeResults];

    // Upsert to MongoDB
    if (combinedResults.length > 0) {
      await upsertProductsToMongoDB(combinedResults);
    }

    console.log(`✅ Search complete: ${amazonResults.length} Amazon + ${flipkartResults.length} Flipkart + ${nikeResults.length} Nike results`);
    
    // Normalize field names across all results
    const normalizeFields = (items) => items.map(item => ({
      ...item,
      image: item.image || item.imageUrl,
      link: item.link || item.productUrl
    }));
    
    const normalized = {
      amazon: normalizeFields(amazonResults),
      flipkart: normalizeFields(flipkartResults),
      nike: normalizeFields(nikeResults),
      all: normalizeFields(combinedResults)
    };
    
    res.json({
      success: true,
      count: combinedResults.length,
      amazon: normalized.amazon,
      flipkart: normalized.flipkart,
      nike: normalized.nike,
      all: normalized.all
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
 * GET /api/compare-prices?q=query&offset=0
 * Compare prices across Local DB, Amazon, and Flipkart
 * Always returns at least 2 products
 * offset: Skip first N results (for "Find More Deals")
 */
app.get("/api/compare-prices", async (req, res) => {
  const q = req.query.q || "";
  const trimmed = String(q).trim();
  const offset = parseInt(req.query.offset) || 0;

  if (!trimmed) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    console.log(`\n⚖️ Comparing prices for: "${trimmed}" (offset: ${offset})`);

    // Run 4 parallel searches - local DB + 3 SerpAPI sources
    const [localResults, amazonResult, flipkartResult, nikeResult] = await Promise.all([
      searchLocalDBMultiple(trimmed, offset),
      searchAmazonForComparison(trimmed, offset),
      searchFlipkartForComparison(trimmed, offset),
      searchNikeForComparison(trimmed, offset)
    ]);

    // Combine all results and ensure at least 2 products
    const allResults = [
      ...localResults,
      amazonResult,
      flipkartResult,
      nikeResult
    ].filter(r => r !== null);

    // Sort by price ascending to get best deals first
    allResults.sort((a, b) => {
      const priceA = typeof a.price === "number" ? a.price : parseFloat(String(a.price).replace(/[^\d.]/g, "")) || Infinity;
      const priceB = typeof b.price === "number" ? b.price : parseFloat(String(b.price).replace(/[^\d.]/g, "")) || Infinity;
      return priceA - priceB;
    });

    // Return up to 4 results
    const topResults = allResults.slice(0, 4);

    if (topResults.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    console.log(`✅ Comparison complete: ${topResults.length} products found`);

    res.json({
      query: trimmed,
      products: topResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error in /api/compare-prices:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search Local MongoDB for multiple matches
 * Returns array of products from local database with actual source names
 * offset: Skip first N scored results
 */
async function searchLocalDBMultiple(query, offset = 0) {
  try {
    console.log("🗂️ Searching local DB...");
    
    // Words that indicate it's NOT the product we want (accessories)
    const excludeWords = ["crease", "protector", "guard", "cleaner", "lace", "insole", "polish", "brush", "spray", "kit", "care", "shield", "tree", "stretcher", "horn", "socks", "sock"];
    
    // Create a regex for case-insensitive partial matching
    const regex = new RegExp(query, "i");
    
    // Get multiple results for smart matching
    const products = await Product.find({
      $or: [
        { productName: regex },
        { link: regex }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    if (!products || products.length === 0) {
      console.log("❌ No local product found");
      return [];
    }

    // Smart matching: find best matches based on query keywords
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const scoredProducts = [];

    for (const product of products) {
      const title = (product.productName || "").toLowerCase();
      let score = 0;
      
      // HARD EXCLUDE: Skip accessories completely
      let isAccessory = false;
      for (const word of excludeWords) {
        if (title.includes(word)) {
          isAccessory = true;
          break;
        }
      }
      if (isAccessory) continue;
      
      // Count matching keywords
      for (const word of queryWords) {
        if (title.includes(word)) score += 2;
      }
      
      // Bonus for exact phrase match
      if (title.includes(query.toLowerCase())) score += 10;
      
      // Bonus if it contains "shoe" or "sneaker"
      if (title.includes("shoe") || title.includes("sneaker") || title.includes("footwear")) score += 2;
      
      // Penalty for "boys", "kids", "children", "girl" if not in query
      if (!query.toLowerCase().includes("boy") && title.includes("boy")) score -= 10;
      if (!query.toLowerCase().includes("kid") && title.includes("kid")) score -= 10;
      if (!query.toLowerCase().includes("child") && title.includes("child")) score -= 10;
      if (!query.toLowerCase().includes("girl") && title.includes("girl")) score -= 10;
      if (!query.toLowerCase().includes("women") && title.includes("women")) score -= 5;
      
      // Prefer items with images and prices
      if (product.image) score += 1;
      if (product.price) score += 1;
      
      if (score >= 2) {
        scoredProducts.push({ product, score });
      }
    }

    // Sort by score and skip offset, take next 2-3
    scoredProducts.sort((a, b) => b.score - a.score);
    const skipCount = offset > 0 ? Math.floor(offset / 2) : 0; // Skip pairs for each offset
    const topProducts = scoredProducts.slice(skipCount, skipCount + 3);

    if (topProducts.length === 0) {
      console.log("❌ No suitable local products found (insufficient score)");
      return [];
    }

    const results = topProducts.map(({ product, score }) => {
      console.log(`✅ Found in local DB: ${product.productName} (source: ${product.source}, score: ${score})`);
      return {
        source: product.source || "Local DB", // Show actual website name
        title: product.productName,
        price: product.price,
        image: product.image,
        link: product.link,
        asin: product.asin,
        rating: product.rating,
        reviews: product.reviews
      };
    });

    return results;

  } catch (error) {
    console.error("❌ Local DB search error:", error.message);
    return [];
  }
}

/**
 * Search Amazon via SerpApi for comparison
 * Strict filtering to find exact product matches
 */
async function searchAmazonForComparison(query, offset = 0) {
  try {
    console.log("🔍 Searching Amazon...");

    if (!SERPAPI_KEY) {
      console.log("⚠️ SERPAPI_KEY not set; skipping Amazon search");
      return null;
    }
    
    const url = "https://serpapi.com/search";
    const params = {
      engine: "amazon",
      api_key: SERPAPI_KEY,
      amazon_domain: "amazon.in",
      k: query
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;

    const results = data.organic_results || [];
    if (results.length === 0) {
      console.log("❌ No Amazon results found");
      return null;
    }

    // Words that indicate it's NOT the product we want (accessories)
    const excludeWords = ["crease", "protector", "guard", "cleaner", "lace", "insole", "polish", "brush", "spray", "kit", "care", "shield", "tree", "stretcher", "horn", "socks", "sock", "set"];
    
    // Smart matching: find best match based on query keywords
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch = null;
    let bestScore = -100;

    for (const item of results.slice(0, 20)) {
      const title = (item.title || "").toLowerCase();
      let score = 0;
      
      // HARD EXCLUDE: Skip accessories completely
      let isAccessory = false;
      for (const word of excludeWords) {
        if (title.includes(word)) {
          isAccessory = true;
          break;
        }
      }
      if (isAccessory) continue;
      
      // Count matching keywords
      for (const word of queryWords) {
        if (title.includes(word)) score += 3;
      }
      
      // Bonus for exact phrase match
      if (title.includes(query.toLowerCase())) score += 15;
      
      // Bonus if it contains "shoe" or "sneaker"
      if (title.includes("shoe") || title.includes("sneaker") || title.includes("footwear")) score += 2;
      
      // Penalty for "boys", "kids", "children", "girl" if not in query
      if (!query.toLowerCase().includes("boy") && title.includes("boy")) score -= 15;
      if (!query.toLowerCase().includes("kid") && title.includes("kid")) score -= 15;
      if (!query.toLowerCase().includes("child") && title.includes("child")) score -= 15;
      if (!query.toLowerCase().includes("girl") && title.includes("girl")) score -= 15;
      if (!query.toLowerCase().includes("women") && title.includes("women")) score -= 8;
      if (!query.toLowerCase().includes("men") && title.includes("men")) score -= 3;
      
      // Prefer items with images and prices
      if (item.image) score += 1;
      if (item.price) score += 1;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (!bestMatch || bestScore < 5) {
      console.log("❌ No suitable Amazon product found (insufficient score)");
      return null;
    }

    const priceData = bestMatch.price;
    const price = typeof priceData === "object" ? priceData.raw : priceData;

    console.log(`✅ Found on Amazon: ${bestMatch.title} (score: ${bestScore})`);

    return {
      source: "Amazon",
      title: bestMatch.title,
      price: price,
      image: bestMatch.image,
      link: bestMatch.link,
      rating: bestMatch.rating,
      reviews: bestMatch.review_count
    };

  } catch (error) {
    console.error("❌ Amazon search error:", error.message);
    return null;
  }
}

/**
 * Search Flipkart via Google Shopping for comparison
 * Strict filtering to find exact product matches
 */
async function searchFlipkartForComparison(query, offset = 0) {
  try {
    console.log("🔍 Searching Flipkart...");

    if (!SERPAPI_KEY) {
      console.log("⚠️ SERPAPI_KEY not set; skipping Flipkart search");
      return null;
    }
    
    const url = "https://serpapi.com/search";
    const params = {
      engine: "google_shopping",
      api_key: SERPAPI_KEY,
      q: `${query} flipkart`,
      gl: "in"
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;

    const results = data.shopping_results || [];
    if (results.length === 0) {
      console.log("❌ No Flipkart results found");
      return null;
    }

    // Words that indicate it's NOT the product we want (accessories)
    const excludeWords = ["crease", "protector", "guard", "cleaner", "lace", "insole", "polish", "brush", "spray", "kit", "care", "shield", "tree", "stretcher", "horn", "socks", "sock", "set"];

    // Smart matching: find best match based on query keywords
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch = null;
    let bestScore = -100;

    for (const item of results.slice(0, 20)) {
      const title = (item.title || "").toLowerCase();
      let score = 0;
      
      // HARD EXCLUDE: Skip accessories completely
      let isAccessory = false;
      for (const word of excludeWords) {
        if (title.includes(word)) {
          isAccessory = true;
          break;
        }
      }
      if (isAccessory) continue;
      
      // Count matching keywords
      for (const word of queryWords) {
        if (title.includes(word)) score += 3;
      }
      
      // Bonus for exact phrase match
      if (title.includes(query.toLowerCase())) score += 15;
      
      // Bonus if it contains "shoe" or "sneaker"
      if (title.includes("shoe") || title.includes("sneaker") || title.includes("footwear")) score += 2;
      
      // Penalty for "boys", "kids", "children", "girl" if not in query
      if (!query.toLowerCase().includes("boy") && title.includes("boy")) score -= 15;
      if (!query.toLowerCase().includes("kid") && title.includes("kid")) score -= 15;
      if (!query.toLowerCase().includes("child") && title.includes("child")) score -= 15;
      if (!query.toLowerCase().includes("girl") && title.includes("girl")) score -= 15;
      if (!query.toLowerCase().includes("women") && title.includes("women")) score -= 8;
      if (!query.toLowerCase().includes("men") && title.includes("men")) score -= 3;
      
      // Prefer items with images and prices
      if (item.image) score += 1;
      if (item.price) score += 1;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (!bestMatch || bestScore < 5) {
      console.log("❌ No suitable Flipkart product found (insufficient score)");
      return null;
    }

    const priceStr = bestMatch.price || "";
    // Extract numeric price
    const priceMatch = String(priceStr).match(/[\d,]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, "")) : null;

    console.log(`✅ Found on Flipkart: ${bestMatch.title} (score: ${bestScore})`);

    return {
      source: "Flipkart",
      title: bestMatch.title,
      price: price,
      image: bestMatch.image,
      link: bestMatch.link,
      rating: bestMatch.rating,
      reviews: null
    };

  } catch (error) {
    console.error("❌ Flipkart search error:", error.message);
    return null;
  }
}

/**
 * Search Nike via Google Shopping for comparison
 * Strict filtering to find exact product matches
 */
async function searchNikeForComparison(query, offset = 0) {
  try {
    console.log("🔍 Searching Nike...");

    if (!SERPAPI_KEY) {
      console.log("⚠️ SERPAPI_KEY not set; skipping Nike search");
      return null;
    }
    
    const url = "https://serpapi.com/search";
    const params = {
      engine: "google_shopping",
      api_key: SERPAPI_KEY,
      q: `${query} nike`,
      gl: "in"
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;

    const results = data.shopping_results || [];
    if (results.length === 0) {
      console.log("❌ No Nike results found");
      return null;
    }

    // Words that indicate it's NOT the product we want (accessories)
    const excludeWords = ["crease", "protector", "guard", "cleaner", "lace", "insole", "polish", "brush", "spray", "kit", "care", "shield", "tree", "stretcher", "horn", "socks", "sock", "set"];

    // Smart matching: find best match based on query keywords
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch = null;
    let bestScore = -100;

    for (const item of results.slice(0, 20)) {
      const title = (item.title || "").toLowerCase();
      let score = 0;
      
      // HARD EXCLUDE: Skip accessories completely
      let isAccessory = false;
      for (const word of excludeWords) {
        if (title.includes(word)) {
          isAccessory = true;
          break;
        }
      }
      if (isAccessory) continue;
      
      // Must contain "nike" 
      if (!title.includes("nike")) score -= 20;
      
      // Count matching keywords
      for (const word of queryWords) {
        if (title.includes(word)) score += 3;
      }
      
      // Bonus for exact phrase match
      if (title.includes(query.toLowerCase())) score += 15;
      
      // Bonus if it contains "shoe" or "sneaker"
      if (title.includes("shoe") || title.includes("sneaker") || title.includes("footwear")) score += 2;
      
      // Penalty for "boys", "kids", "children", "girl" if not in query
      if (!query.toLowerCase().includes("boy") && title.includes("boy")) score -= 15;
      if (!query.toLowerCase().includes("kid") && title.includes("kid")) score -= 15;
      if (!query.toLowerCase().includes("child") && title.includes("child")) score -= 15;
      if (!query.toLowerCase().includes("girl") && title.includes("girl")) score -= 15;
      if (!query.toLowerCase().includes("women") && title.includes("women")) score -= 8;
      
      // Prefer items with images and prices
      if (item.image) score += 1;
      if (item.price) score += 1;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (!bestMatch || bestScore < 5) {
      console.log("❌ No suitable Nike product found (insufficient score)");
      return null;
    }

    const priceStr = bestMatch.price || "";
    // Extract numeric price
    const priceMatch = String(priceStr).match(/[\d,]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, "")) : null;

    console.log(`✅ Found on Nike: ${bestMatch.title} (score: ${bestScore})`);

    return {
      source: "Nike",
      title: bestMatch.title,
      price: price,
      image: bestMatch.image,
      link: bestMatch.link,
      rating: bestMatch.rating,
      reviews: null
    };

  } catch (error) {
    console.error("❌ Nike search error:", error.message);
    return null;
  }
}

/**
 * Filter products to only include clothing and footwear (NO undergarments or accessories)
 * Also validates against search query to ensure relevance
 */
function isClothingOrFootwear(productName, searchQuery = "") {
  if (!productName) return false;
  
  const text = productName.toLowerCase();
  const query = searchQuery.toLowerCase();
  
  // Always exclude these items regardless of search
  const alwaysExclude = ["perfume", "fragrance", "deodorant", "cologne", "edt", "edp", "spray", "mist", "scent"];
  if (alwaysExclude.some(keyword => text.includes(keyword))) {
    return false;
  }
  
  // Explicitly exclude undergarments
  const excludeKeywords = ["underwear", "bra", "brief", "panty", "panties", "boxers", "thermal underwear"];
  if (excludeKeywords.some(keyword => text.includes(keyword))) {
    return false;
  }
  
  // If searching for shoes/sneakers/jordan, ONLY return footwear
  const isFootwearSearch = ["shoe", "sneaker", "jordan", "air max", "dunk", "force", "boot", "trainer", "yeezy", "air force", "retro"].some(kw => query.includes(kw));
  
  if (isFootwearSearch) {
    // Must contain footwear-related keywords for shoe searches - be strict!
    const footwearKeywords = ["shoe", "sneaker", "boot", "trainer", "footwear", "running", "basketball", "athletic", "jordan", "air max", "dunk"];
    const hasFootwear = footwearKeywords.some(keyword => text.includes(keyword));
    
    // Exclude non-footwear items even if they have brand names
    const nonFootwearItems = ["shirt", "t-shirt", "tshirt", "jacket", "hoodie", "cap", "hat", "bag", "wallet", "watch", "belt", "pants", "shorts", "socks"];
    const isNonFootwear = nonFootwearItems.some(keyword => text.includes(keyword));
    
    // Only return if it has footwear keyword AND doesn't have non-footwear keywords
    return hasFootwear && !isNonFootwear;
  }
  
  const fashionKeywords = [
    // Footwear
    "shoe", "sneaker", "boot", "sandal", "slipper", "heel", "loafer", 
    "trainer", "running shoe", "casual shoe", "formal shoe", "sports shoe", "athletic shoe",
    
    // Upper body
    "shirt", "t-shirt", "tshirt", "top", "blouse", "sweater", "sweatshirt", "hoodie", 
    "jacket", "coat", "blazer", "cardigan", "pullover", "polo", "vest",
    
    // Lower body
    "pant", "pants", "jeans", "jean", "shorts", "short", "skirt", "leggings", "legging", 
    "dress", "dhoti", "saree", "kurta", "trouser", "trousers",
    
    // All major brands
    "nike", "adidas", "puma", "reebok", "new balance", "converse", "vans", "timberland", 
    "dr martens", "gucci", "louis vuitton", "lv", "prada", "dior", "chanel", 
    "tommy hilfiger", "calvin klein", "hugo boss", "lacoste", "zara", "h&m", 
    "levi's", "levis", "diesel", "armani", "ralph lauren", "skechers",
    
    // General fashion
    "apparel", "wear", "clothing", "clothes", "outfit", "fashion"
  ];
  
  return fashionKeywords.some(keyword => text.includes(keyword));
}

/**
 * Fetch Amazon results from SerpApi
 */
async function fetchAmazonResults(query) {
  try {
    if (!SERPAPI_KEY) {
      console.log("⚠️ SERPAPI_KEY not set; skipping Amazon fetch");
      return [];
    }

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
      // Filter for clothing/footwear only - pass query for context-aware filtering
      if (!isClothingOrFootwear(item.title, query)) {
        continue;
      }

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
    if (!SERPAPI_KEY) {
      console.log("⚠️ SERPAPI_KEY not set; skipping Flipkart fetch");
      return [];
    }

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
      // Filter for clothing/footwear only - pass query for context-aware filtering
      if (!isClothingOrFootwear(item.title, query)) {
        continue;
      }

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
 * Fetch Nike results from SerpApi (Google Shopping)
 */
async function fetchNikeResults(query) {
  try {
    if (!SERPAPI_KEY) {
      console.log("⚠️ SERPAPI_KEY not set; skipping Nike fetch");
      return [];
    }

    const url = "https://serpapi.com/search";
    const params = {
      engine: "google_shopping",
      api_key: SERPAPI_KEY,
      q: `nike ${query}`,
      google_domain: "google.co.in",
      hl: "en",
      gl: "in"
    };

    console.log("📦 Fetching from Nike (Google Shopping)...");
    const response = await axios.get(url, { params });
    const data = response.data;

    const results = [];
    for (const item of (data.shopping_results || []).slice(0, 20)) {
      // Filter for clothing/footwear only - pass query for context-aware filtering
      if (!isClothingOrFootwear(item.title, query)) {
        continue;
      }

      results.push({
        productName: item.title,
        price: item.price,
        source: "Nike",
        image: item.thumbnail || "",
        link: item.product_link || "",
        rating: item.rating || null,
        reviews: item.reviews || null
      });
    }

    console.log(`✓ Nike: ${results.length} products`);
    return results;

  } catch (error) {
    console.error("⚠️ Nike fetch error:", error.message);
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
    res.json({ items });  // Wrap in object to match frontend expectation

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
// 3️⃣ STYLE BUILDER → PROXY TO PYTHON SERVICE
// ==========================================
/**
 * GET /api/style-builder/:productId
 * Proxy request to Python service for style recommendations
 */
app.get("/api/style-builder/:productId", async (req, res) => {
  const productId = req.params.productId;
  const aiApiUrl = `${process.env.AI_API_URL}/api/style-builder/${productId}`;
  
  console.log(`[BACKEND] Style builder request for productId: ${productId}`);
  console.log(`[BACKEND] Calling style service: ${aiApiUrl}`);

  try {
    const response = await axios.get(aiApiUrl);
    console.log(`[BACKEND] Style service response status: ${response.status}`);
    res.json(response.data);
  } catch (error) {
    console.error("⚠️ Style service error:", error.message);
    if (error.response) {
      console.error(`[BACKEND] Style service error status: ${error.response.status}`);
      console.error(`[BACKEND] Style service error data:`, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Style service unavailable" });
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

    // Normalize field names: imageUrl -> image, productUrl -> link
    const normalized = docs.map(doc => ({
      ...doc,
      image: doc.image || doc.imageUrl,
      link: doc.link || doc.productUrl
    }));

    res.json(normalized);
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
