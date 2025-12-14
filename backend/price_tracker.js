const cron = require("node-cron");
const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

// ============================
// EMAIL CONFIGURATION
// ============================
const EMAIL_CONFIG = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const mailTransporter = nodemailer.createTransport(EMAIL_CONFIG);

// SerpAPI Key
const SERPAPI_KEY = process.env.SERPAPI_KEY || "";

// ============================
// 1️⃣ FETCH TRACKED ITEMS FROM DB
// ============================
async function fetchTrackedItems() {
  try {
    // Get connection reference
    const db = mongoose.connection.db;
    if (!db) {
      console.log("⚠️ Database not connected");
      return [];
    }

    // Query wishlist collection with tracking information
    const wishlistCollection = db.collection("wishlists");
    const userCollection = db.collection("users");

    // Get all tracked items
    const trackedItems = await wishlistCollection
      .find({ targetPrice: { $exists: true, $ne: null } })
      .toArray();

    console.log(`📦 Found ${trackedItems.length} tracked items`);

    // Enrich with user email data
    const enrichedItems = await Promise.all(
      trackedItems.map(async (item) => {
        if (item.userId) {
          const user = await userCollection.findOne({
            _id: new mongoose.Types.ObjectId(item.userId),
          });
          return {
            ...item,
            email: user?.email || "unknown@email.com",
          };
        }
        return item;
      })
    );

    return enrichedItems;
  } catch (err) {
    console.error("❌ Failed to fetch tracked items:", err.message);
    return [];
  }
}

// ============================
// 2️⃣ CHECK PRICE (SerpAPI PRIMARY + HTML FALLBACK)
// ============================
async function checkPriceOnAmazon(asin, link) {
  // Try SerpAPI first
  try {
    if (!SERPAPI_KEY) {
      console.log("⚠️ SERPAPI_KEY not set; skipping SerpAPI and using HTML fallback");
      throw new Error("SERPAPI_KEY not configured");
    }

    console.log(`🔍 SerpAPI checking ASIN: ${asin}`);
    const params = {
      engine: "amazon",
      api_key: SERPAPI_KEY,
      amazon_domain: "amazon.in",
      asin: asin,
    };

    const response = await axios.get("https://serpapi.com/search", { params });
    const data = response.data;

    // Extract price from first product result
    if (data.product && data.product.price) {
      const priceRaw = data.product.price;
      const priceNum = parseFloat(
        String(priceRaw).replace(/[^\d.]/g, "")
      );
      if (!isNaN(priceNum)) {
        console.log(`✅ SerpAPI price found: ₹${priceNum}`);
        return priceNum;
      }
    }

    // Check organic results as fallback
    for (const item of data.organic_results || []) {
      if (item.link?.includes(`/dp/${asin}`)) {
        const priceData = item.price;
        const priceStr =
          typeof priceData === "string" ? priceData : priceData?.raw;
        if (priceStr) {
          const priceNum = parseFloat(String(priceStr).replace(/[^\d.]/g, ""));
          if (!isNaN(priceNum)) {
            console.log(`✅ SerpAPI (organic) price found: ₹${priceNum}`);
            return priceNum;
          }
        }
      }
    }

    console.log(`⚠️ SerpAPI returned no price for ASIN ${asin}, trying HTML...`);
  } catch (err) {
    console.error("⚠️ SerpAPI error:", err.message);
  }

  // Fallback: HTML Scraping with Cheerio
  try {
    if (!link) {
      link = `https://www.amazon.in/dp/${asin}`;
    }

    console.log(`🕵️ Scraping Amazon page: ${link}`);

    const response = await axios.get(link, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Common Amazon price selectors
    const selectors = [
      ".a-price-whole",
      ".a-price.a-text-price.a-size-medium.a-color-price",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      ".a-price .a-offscreen",
    ];

    for (const selector of selectors) {
      const priceText = $(selector).first().text();
      if (priceText) {
        const priceNum = parseFloat(priceText.replace(/[^\d.]/g, ""));
        if (!isNaN(priceNum) && priceNum > 0) {
          console.log(`✅ HTML scrape price found: ₹${priceNum}`);
          return priceNum;
        }
      }
    }

    console.log(`❌ No price found via HTML scraping`);
  } catch (err) {
    console.error("❌ HTML scraping error:", err.message);
  }

  return null;
}

// ============================
// 3️⃣ CHECK EXISTING NOTIFICATION
// ============================
async function checkExistingNotification(userId, asin) {
  try {
    const db = mongoose.connection.db;
    if (!db) return { exists: false };

    const notificationCollection = db.collection("notifications");

    const existing = await notificationCollection
      .findOne({
        userId: new mongoose.Types.ObjectId(userId),
        asin: asin,
        isRead: false,
      })
      .sort({ createdAt: -1 });

    if (existing) {
      return {
        exists: true,
        lastPrice: existing.currentPrice,
      };
    }

    return { exists: false };
  } catch (err) {
    console.error("Error checking notification:", err.message);
    return { exists: false };
  }
}

// ============================
// 4️⃣ ADD NOTIFICATION TO DB
// ============================
async function addNotification(userId, asin, title, currentPrice, targetPrice) {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.log("⚠️ Database not connected");
      return false;
    }

    const notificationCollection = db.collection("notifications");

    const result = await notificationCollection.insertOne({
      userId: new mongoose.Types.ObjectId(userId),
      asin: asin,
      title: title,
      currentPrice: currentPrice,
      targetPrice: targetPrice,
      isRead: false,
      createdAt: new Date(),
    });

    console.log(`📌 Notification added: ${title} @ ₹${currentPrice}`);
    return true;
  } catch (err) {
    console.error("❌ Error adding notification:", err.message);
    return false;
  }
}

// ============================
// 5️⃣ SEND EMAIL
// ============================
async function sendCombinedEmail(userEmail, droppedItems) {
  try {
    if (!droppedItems || droppedItems.length === 0) {
      return;
    }

    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.log("⚠️ Email not configured (EMAIL_USER/EMAIL_PASSWORD missing); skipping email send");
      return;
    }

    const htmlItems = droppedItems
      .map(
        (item) => `
      <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
        <img src="${item.image || item.thumbnail}" width="140" style="border-radius: 8px; margin-bottom: 10px; max-height: 140px; object-fit: cover;"><br><br>
        <b style="font-size: 16px;">${item.title}</b><br>
        <div style="margin-top: 8px;">
          <p style="margin: 5px 0;"><strong>Current Price:</strong> ₹${item.currentPrice}</p>
          <p style="margin: 5px 0;"><strong>Your Target:</strong> ₹${item.targetPrice}</p>
          <a href="${item.link}" style="color: #10b981; text-decoration: none; font-weight: bold; margin-top: 10px; display: inline-block;">View Product →</a>
        </div>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb;">
    `
      )
      .join("");

    const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #eaf6f2 0%, #b6c9c3 100%); padding: 20px; border-radius: 8px; text-align: center; }
          .header h1 { color: #1f2937; margin: 0; }
          .content { margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📉 Price Drop Alert!</h1>
            <p style="margin: 0; color: #4b5563;">The following items dropped in price</p>
          </div>
          <div class="content">
            ${htmlItems}
          </div>
          <div class="footer">
            <p>ValueScout - Shop Smarter 🛍️</p>
            <p>Happy shopping!</p>
          </div>
        </div>
      </body>
    </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || EMAIL_CONFIG.auth.user,
      to: userEmail,
      subject: `🔥 ${droppedItems.length} Price Drop Alert(s)! — ValueScout`,
      html: htmlBody,
    };

    await mailTransporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${userEmail} (${droppedItems.length} items)`);
  } catch (err) {
    console.error("❌ Email sending error:", err.message);
  }
}

// ============================
// 6️⃣ MAIN PRICE TRACKER LOGIC
// ============================
async function runPriceCheck() {
  console.log("\n🚀 Starting Price Tracker Check...\n");

  const trackedItems = await fetchTrackedItems();
  if (trackedItems.length === 0) {
    console.log("⚠️ No tracked items found");
    return;
  }

  // Group items by user email for batch sending
  const emailBatches = {};

  for (const item of trackedItems) {
    const {
      _id: itemId,
      userId,
      asin,
      link,
      title,
      targetPrice,
      email,
      image,
      thumbnail,
    } = item;

    console.log(
      `🔍 Checking "${title}" (ASIN: ${asin}, Target: ₹${targetPrice})...`
    );

    // Check price
    const currentPrice = await checkPriceOnAmazon(asin, link);

    if (currentPrice === null) {
      console.log("❌ Price not found. Skipping.\n");
      continue;
    }

    console.log(`   💰 Current Price: ₹${currentPrice}`);

    if (currentPrice <= targetPrice) {
      console.log(
        `   🎯 Price Drop! (₹${currentPrice} ≤ ₹${targetPrice})`
      );

      // Check if already notified
      const existingCheck = await checkExistingNotification(
        userId,
        asin
      );

      if (existingCheck.exists) {
        // If price is the same, skip
        if (existingCheck.lastPrice === currentPrice) {
          console.log(
            `   ⚠️ Already notified with same price. Skipping.`
          );
          console.log("-".repeat(60));
          continue;
        }

        // If price dropped further, add new notification
        if (currentPrice < existingCheck.lastPrice) {
          console.log(
            `   🔻 Price dropped further. Updating notification...`
          );
        }
      }

      // Add notification to DB
      const notified = await addNotification(
        userId,
        asin,
        title,
        currentPrice,
        targetPrice
      );

      if (notified) {
        // Add to email batch
        if (!emailBatches[email]) {
          emailBatches[email] = [];
        }

        emailBatches[email].push({
          title,
          asin,
          currentPrice,
          targetPrice,
          image,
          thumbnail,
          link,
        });
      }
    } else {
      console.log(
        `   ❌ Price not dropped yet (₹${currentPrice} > ₹${targetPrice})`
      );
    }

    console.log("-".repeat(60));
  }

  // Send batch emails
  console.log("\n📧 Sending email notifications...\n");
  for (const [email, items] of Object.entries(emailBatches)) {
    await sendCombinedEmail(email, items);
  }

  console.log(
    `\n✅ Price check completed. ${Object.keys(emailBatches).length} email(s) sent.\n`
  );
}

// ============================
// 7️⃣ EXPORT FUNCTION FOR INTEGRATION
// ============================
function startPriceTracker() {
  console.log("⏰ Price Tracker initialized");

  // Run immediately for testing
  // runPriceCheck();

  // Schedule to run every 12 hours (0 AM and 12 PM)
  cron.schedule("0 0,12 * * *", () => {
    console.log("\n⏰ Running scheduled price check...");
    runPriceCheck();
  });

  // Optional: Run every hour for frequent checking (uncomment if needed)
  // cron.schedule("0 * * * *", runPriceCheck);

  console.log("✅ Price Tracker scheduled: Every 12 hours (0 AM & 12 PM)");
}

// ============================
// 8️⃣ MANUAL RUN (for testing)
// ============================
async function runPriceCheckNow() {
  try {
    await runPriceCheck();
  } catch (err) {
    console.error("Error during manual price check:", err.message);
  }
}

module.exports = {
  startPriceTracker,
  runPriceCheckNow,
  checkPriceOnAmazon,
  addNotification,
  fetchTrackedItems,
};
