# Price Tracker Migration: Python → Node.js

**Status**: ✅ Complete  
**Date**: December 2024  
**Framework Migration**: Flask + BeautifulSoup → Express.js + Cheerio + Nodemailer  

---

## 📋 Overview

The price tracker system has been fully migrated from Python (`price_tracker_cron.py`) to Node.js (`backend/price_tracker.js`). This service monitors user-tracked wishlist items for price drops and sends email notifications when prices fall below target thresholds.

### Key Features
- ⏰ **Scheduled Execution**: Runs every 12 hours (0 AM & 12 PM)
- 🔍 **Dual Price Checking**: SerpAPI primary + HTML scraping fallback
- 📧 **Email Notifications**: Combined HTML emails via Nodemailer
- 💾 **Database Integration**: MongoDB for tracking and notifications
- 🔗 **Smart Duplicate Prevention**: Avoids duplicate notifications
- 🎯 **Price Drop Detection**: Only notifies when price ≤ target

---

## 🏗️ Architecture

### File Locations
```
backend/
├── main_api_server.js       ← Main server (imports price_tracker)
├── price_tracker.js         ← Price tracking logic (NEW)
└── package.json             ← Dependencies (node-cron, nodemailer, cheerio)

PROJECT_DOCUMENTATION/
└── PRICE_TRACKER/
    ├── PRICE_TRACKER_README.md  ← This file
    └── API_ENDPOINTS.md          ← Backend API reference
```

### Dependencies
```json
{
  "node-cron": "^3.0.2",      // Scheduling
  "nodemailer": "^6.x.x",     // Email delivery
  "cheerio": "^1.0.0-rc.10",  // HTML parsing/scraping
  "mongoose": "^7.x.x",       // MongoDB driver
  "axios": "^1.x.x"           // HTTP requests
}
```

---

## 🔄 How It Works

### 1. **Initialization** (`startPriceTracker()`)
```javascript
// Called in main_api_server.js on server startup
startPriceTracker();
```

- ✅ Registers cron job: every 12 hours
- ✅ Logs scheduled timing
- ✅ Ready to track price drops

### 2. **Scheduled Check** (Every 12 Hours)
```
Runs: 00:00 (midnight) and 12:00 (noon)
```

**Flow**:
```
runPriceCheck()
  ↓
  fetchTrackedItems() → Get all items with targetPrice set
  ↓
  For each item:
    ├─ checkPriceOnAmazon(asin, link)
    │  ├─ Try: SerpAPI search
    │  └─ Fallback: Cheerio HTML scrape
    ├─ Check if price ≤ targetPrice
    ├─ checkExistingNotification() → Avoid duplicates
    ├─ addNotification() → Save to DB
    └─ Batch for email
  ↓
  sendCombinedEmail() → Send 1 email per user
```

### 3. **Price Checking** (Dual Strategy)

#### Primary: SerpAPI
```javascript
GET https://serpapi.com/search?engine=amazon&asin=B123XYZ&api_key=KEY
```

**Extracts**:
- `data.product.price` (direct product price)
- `data.organic_results[].price` (search results)

#### Fallback: HTML Scraping (Cheerio)
```
If SerpAPI fails or returns no price
  ↓
  GET https://www.amazon.in/dp/{asin}
  ↓
  Parse with Cheerio selectors:
    - .a-price-whole
    - .a-price.a-text-price
    - #priceblock_ourprice
    - #priceblock_dealprice
    - .a-price .a-offscreen
```

### 4. **Notification Logic**

#### Duplicate Prevention
```javascript
checkExistingNotification(userId, asin)
  ├─ IF unread notification exists AND same price
  │  └─ SKIP (already notified)
  ├─ IF price dropped further
  │  └─ ADD new notification (price change detected)
  └─ IF price first drops below target
     └─ ADD new notification
```

#### Database Storage
```javascript
notifications.insert({
  userId: ObjectId,
  asin: "B123XYZ",
  title: "Nike Shoes",
  currentPrice: 4999,
  targetPrice: 5500,
  isRead: false,
  createdAt: Date.now()
})
```

### 5. **Email Sending**

#### Configuration
```javascript
const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,    // valuescout6@gmail.com
    pass: process.env.EMAIL_PASSWORD  // App password
  }
});
```

#### Email Format (HTML)
```html
📉 Price Drop Alert!
  ├─ Product Image (140x140px)
  ├─ Product Title
  ├─ Current Price: ₹4,999
  ├─ Your Target: ₹5,500
  └─ "View Product" Button (Link)
```

#### Batch Sending
```javascript
// Group items by user email
emailBatches = {
  "user@gmail.com": [item1, item2, item3],
  "other@gmail.com": [item4]
}

// Send 1 email per user with all their price drops
```

---

## 📊 Database Collections

### Required Collections

#### 1. `wishlists`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  asin: "B123XYZ",
  title: "Nike Air Max",
  price: 5500,
  targetPrice: 4999,        ← If set, this item is tracked
  link: "https://amazon.in/dp/B123XYZ",
  image: "https://...",
  thumbnail: "https://...",
  source: "Amazon"
}
```

#### 2. `notifications` (Auto-created)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  asin: "B123XYZ",
  title: "Nike Air Max",
  currentPrice: 4999,
  targetPrice: 5500,
  isRead: false,
  createdAt: ISODate
}
```

#### 3. `users`
```javascript
{
  _id: ObjectId,
  email: "user@gmail.com",
  username: "john_doe"
  // ... other fields
}
```

---

## 🚀 Usage

### Starting the Server
```bash
cd backend
npm install  # Install dependencies if not done
node main_api_server.js
```

**Expected Output**:
```
🔧 Backend Initializing...
📡 Connecting to MongoDB...
✅ MongoDB connected successfully

🚀 Backend Server running on port 8000
📍 http://localhost:8000

⏰ Price Tracker initialized
✅ Price Tracker scheduled: Every 12 hours (0 AM & 12 PM)
```

### Manual Testing (Trigger Check Immediately)
```javascript
// In price_tracker.js, uncomment:
runPriceCheck();  // Instead of cron schedule
```

Or create a test endpoint:
```javascript
// In main_api_server.js
app.get("/api/price-tracker/run-now", async (req, res) => {
  try {
    const { runPriceCheckNow } = require("./price_tracker");
    await runPriceCheckNow();
    res.json({ message: "Price check triggered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## 🔧 Configuration

### Environment Variables (`.env`)
```
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/value_scout
SERPAPI_KEY=your_serpapi_key_here
EMAIL_USER=valuescout6@gmail.com
EMAIL_PASSWORD=odpf qvdg ulle iism    # Gmail app password
```

### Cron Schedule (Modify in `price_tracker.js`)

**Current (Every 12 hours)**:
```javascript
cron.schedule("0 0,12 * * *", () => runPriceCheck());
// Runs: 00:00 (midnight) and 12:00 (noon)
```

**Alternative Schedules**:
```javascript
// Every hour
cron.schedule("0 * * * *", () => runPriceCheck());

// Every 6 hours
cron.schedule("0 0,6,12,18 * * *", () => runPriceCheck());

// Every day at 9 AM
cron.schedule("0 9 * * *", () => runPriceCheck());

// Cron syntax: minute hour day month day-of-week
```

---

## 📝 Exported Functions

### `startPriceTracker()`
Initializes the cron job and schedules price checks.

```javascript
const { startPriceTracker } = require("./price_tracker");
startPriceTracker();  // Call once on server startup
```

### `runPriceCheckNow()`
Manually trigger a price check (for testing).

```javascript
const { runPriceCheckNow } = require("./price_tracker");
await runPriceCheckNow();
```

### `checkPriceOnAmazon(asin, link)`
Check price for a single product.

```javascript
const price = await checkPriceOnAmazon("B123XYZ", "https://amazon.in/dp/B123XYZ");
// Returns: 4999 (number) or null
```

### `addNotification(userId, asin, title, currentPrice, targetPrice)`
Manually add a notification.

```javascript
await addNotification(
  "user_id_123",
  "B123XYZ",
  "Nike Air Max",
  4999,
  5500
);
```

### `fetchTrackedItems()`
Get all tracked wishlist items from database.

```javascript
const items = await fetchTrackedItems();
// Returns: Array of wishlist items with targetPrice set
```

---

## 🐛 Troubleshooting

### Issue: "Database not connected"
**Solution**: Ensure MongoDB is running
```bash
# Check MongoDB status
mongod --version
```

### Issue: Emails not sending
**Solutions**:
1. Verify email credentials in `.env`
2. Use Gmail App Password (not regular password)
3. Enable "Less secure app access" if needed
4. Check firewall/port 587

### Issue: SerpAPI key invalid
**Solution**: Update `SERPAPI_KEY` in `.env` or `price_tracker.js`
```javascript
const SERPAPI_KEY = process.env.SERPAPI_KEY || "YOUR_KEY_HERE";
```

### Issue: No price found for ASIN
**Diagnosis**:
1. Check if ASIN is valid
2. Try manual URL: `https://amazon.in/dp/{asin}`
3. Check if product still exists
4. Verify HTML selectors (Amazon HTML changes frequently)

### Issue: Cron job not running
**Debug**:
```javascript
// Add logging in startPriceTracker()
console.log("Current time:", new Date());
cron.schedule("* * * * *", () => {  // Every minute for testing
  console.log("Cron triggered at:", new Date());
});
```

---

## 📈 Monitoring & Logging

### Console Logs
```
🚀 Starting Price Tracker Check...
📦 Found 5 tracked items
🔍 Checking "Nike Air Max" (ASIN: B123XYZ, Target: ₹4999)...
✅ SerpAPI price found: ₹4899
🎯 Price Drop! (₹4899 ≤ ₹4999)
📌 Notification added: Nike Air Max @ ₹4899
📧 Email sent to user@gmail.com (1 items)
✅ Price check completed. 1 email(s) sent.
```

### Suggested Enhancements
1. Add file logging (Winston/Morgan)
2. Database query logging
3. Email send confirmations
4. Metrics dashboard

---

## 🔄 Migration Summary

### From Python (`price_tracker_cron.py`)

| Feature | Python | Node.js |
|---------|--------|---------|
| **Scheduling** | APScheduler | node-cron ✅ |
| **SerpAPI** | requests | axios ✅ |
| **HTML Parsing** | BeautifulSoup | cheerio ✅ |
| **Email** | smtplib | nodemailer ✅ |
| **Database** | Flask-SQLAlchemy | mongoose ✅ |
| **Error Handling** | try/except | try/catch ✅ |
| **Deployment** | Python process | Node.js process ✅ |

### Code Comparison

**Python**:
```python
res = requests.get("https://serpapi.com/search", params=params)
html = requests.get(url, headers=headers).text
soup = BeautifulSoup(html, "html.parser")
```

**Node.js**:
```javascript
const response = await axios.get("https://serpapi.com/search", { params });
const response = await axios.get(url, { headers });
const $ = cheerio.load(response.data);
```

---

## 🎯 Next Steps

1. **Testing**: Run price check on test wishlist items
2. **Email Templates**: Customize email HTML design
3. **Monitoring**: Set up logging and alerts
4. **Scale**: Add more users and tracked items
5. **Features**:
   - Push notifications (in addition to email)
   - Price history tracking
   - Wishlist sharing
   - Custom price alerts (SMS, Discord webhooks)

---

## 📞 Support

For issues or questions:
1. Check logs in console output
2. Review database collections
3. Test with manual `runPriceCheckNow()`
4. Verify all environment variables are set

**Last Updated**: December 2024  
**Maintained By**: ValueScout Development Team
