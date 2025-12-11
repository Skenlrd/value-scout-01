# Price Tracker & Notification API Endpoints

**Backend**: `http://localhost:8000`  
**Status**: All endpoints integrated with MongoDB

---

## 🛒 Wishlist Management Endpoints

### 1. Add to Wishlist
```
POST /api/wishlist/add
Content-Type: application/json

Request Body:
{
  "userId": "user_123",
  "title": "Nike Air Max 90",
  "price": "₹5,500",
  "source": "Amazon",
  "link": "https://amazon.in/dp/B123XYZ",
  "image": "https://...",
  "thumbnail": "https://..."
}

Response (201):
{
  "_id": "649a1b2c3d4e5f6g7h8i9j0k",
  "userId": "user_123",
  "title": "Nike Air Max 90",
  "price": "₹5,500",
  "createdAt": "2024-12-11T10:30:00Z"
}

Response (400):
{
  "error": "User not logged in"
}
```

### 2. Remove from Wishlist
```
DELETE /api/wishlist/remove
Content-Type: application/json

Request Body:
{
  "userId": "user_123",
  "title": "Nike Air Max 90",
  "asin": "B123XYZ"
}

Response (200):
{
  "message": "Item removed from wishlist"
}
```

### 3. Get Wishlist
```
GET /api/wishlist/guest
Authorization: Optional

Response (200):
[
  {
    "_id": "649a1b2c3d4e5f6g7h8i9j0k",
    "userId": "guest",
    "title": "Nike Air Max 90",
    "price": "₹5,500",
    "image": "https://...",
    "source": "Amazon",
    "link": "https://amazon.in/dp/B123XYZ"
  }
]
```

---

## 📍 Price Tracking Endpoints

### 4. Set Price Alert (Track Item)
```
POST /api/wishlist/track
Content-Type: application/json

Request Body:
{
  "userId": "user_123",
  "asin": "B123XYZ",
  "title": "Nike Air Max 90",
  "targetPrice": 4999
}

Response (200):
{
  "status": "tracking",
  "message": "Price alert set for ₹4,999"
}
```

### 5. Remove Price Alert
```
DELETE /api/wishlist/untrack
Content-Type: application/json

Request Body:
{
  "userId": "user_123",
  "asin": "B123XYZ"
}

Response (200):
{
  "status": "untracked",
  "message": "Price alert removed"
}
```

### 6. Get Tracked Items (Admin/Cron)
```
GET /api/tracked-items
Authorization: Internal (Cron job uses this)

Response (200):
[
  {
    "userId": "user_123",
    "asin": "B123XYZ",
    "title": "Nike Air Max 90",
    "targetPrice": 4999,
    "currentPrice": 5500,
    "link": "https://amazon.in/dp/B123XYZ",
    "image": "https://...",
    "email": "user@gmail.com"
  }
]
```

---

## 🔔 Notification Endpoints

### 7. Get Notifications
```
GET /api/notifications
Authorization: Required (Session/JWT)

Response (200):
[
  {
    "_id": "649b2c3d4e5f6g7h8i9j0k1l",
    "userId": "user_123",
    "asin": "B123XYZ",
    "title": "Nike Air Max 90",
    "currentPrice": 4899,
    "targetPrice": 4999,
    "isRead": false,
    "createdAt": "2024-12-11T12:00:00Z"
  }
]
```

### 8. Mark Notification as Read
```
PUT /api/notifications/read
Content-Type: application/json

Request Body:
{
  "notificationId": "649b2c3d4e5f6g7h8i9j0k1l"
}

Response (200):
{
  "message": "Notification marked as read"
}
```

### 9. Delete Notification
```
DELETE /api/notifications/:notificationId
Authorization: Required

Response (200):
{
  "message": "Notification deleted"
}
```

---

## 🔍 Search Endpoints

### 10. External Search (Amazon + Flipkart)
```
GET /api/external-search?q=nike shoes
Content-Type: application/json

Query Parameters:
- q: Search query (required)
- limit: Number of results (optional, default: 20)

Response (200):
{
  "amazon": [
    {
      "asin": "B123XYZ",
      "title": "Nike Air Max 90",
      "price": "₹5,500",
      "link": "https://amazon.in/dp/B123XYZ",
      "image": "https://...",
      "rating": 4.5,
      "reviews": 1250,
      "source": "Amazon"
    }
  ],
  "flipkart": [
    {
      "title": "Nike Running Shoes",
      "price": "₹4,999",
      "link": "https://flipkart.com/...",
      "image": "https://...",
      "source": "Flipkart"
    }
  ],
  "all": [
    // Combined results
  ]
}
```

### 11. Amazon Search Only
```
GET /api/search?q=adidas shoes

Response (200):
[
  {
    "asin": "B456ABC",
    "title": "Adidas Ultra Boost",
    "price": "₹7,999",
    "link": "https://amazon.in/dp/B456ABC",
    "image": "https://...",
    "source": "Amazon"
  }
]
```

### 12. Flipkart Search Only
```
GET /api/flipkart?q=puma shoes

Response (200):
[
  {
    "title": "Puma Running Shoes",
    "price": "₹3,500",
    "link": "https://flipkart.com/...",
    "image": "https://...",
    "source": "Flipkart"
  }
]
```

---

## 👤 Authentication Endpoints (If Implemented)

### 13. Register
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "username": "john_doe",
  "email": "john@gmail.com",
  "password": "secure_password"
}

Response (201):
{
  "userId": "user_123",
  "username": "john_doe",
  "email": "john@gmail.com",
  "message": "User registered successfully"
}
```

### 14. Login
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@gmail.com",
  "password": "secure_password"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "user_123",
  "username": "john_doe",
  "email": "john@gmail.com"
}
```

---

## ⚙️ System Endpoints

### 15. Health Check
```
GET /
Response (200):
{
  "status": "ok",
  "message": "ValueScout backend running"
}
```

### 16. Price Tracker Status
```
GET /api/price-tracker/status
Response (200):
{
  "status": "active",
  "nextRun": "2024-12-12T00:00:00Z",
  "lastRun": "2024-12-11T12:00:00Z",
  "itemsTracked": 15,
  "emailsSent": 3
}
```

### 17. Trigger Manual Price Check (Testing)
```
POST /api/price-tracker/run-now
Authorization: Admin

Response (200):
{
  "message": "Price check triggered",
  "itemsChecked": 15,
  "priceDropsFound": 3,
  "emailsSent": 2
}
```

---

## 📊 Database Collections Schema

### Wishlists Collection
```javascript
db.wishlists.insertOne({
  userId: ObjectId,
  asin: String,
  title: String,
  price: Number || String,
  targetPrice: Number,           // Set only if tracking
  link: String,
  image: String,
  thumbnail: String,
  source: String,                // "Amazon" | "Flipkart"
  rating: Number,
  reviews: Number,
  createdAt: ISODate,
  updatedAt: ISODate
})
```

### Notifications Collection
```javascript
db.notifications.insertOne({
  userId: ObjectId,
  asin: String,
  title: String,
  currentPrice: Number,
  targetPrice: Number,
  isRead: Boolean,
  emailSent: Boolean,
  createdAt: ISODate,
  readAt: ISODate
})
```

### Users Collection
```javascript
db.users.insertOne({
  username: String,
  email: String,
  passwordHash: String,
  createdAt: ISODate,
  lastLogin: ISODate,
  preferences: {
    emailNotifications: Boolean,
    pushNotifications: Boolean
  }
})
```

---

## 🔐 Authentication Headers

**All protected endpoints require**:
```
Authorization: Bearer <token>
```

**Or Session-based**:
```
Cookie: sessionId=xyz123
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required field: email"
}
```

### 401 Unauthorized
```json
{
  "error": "User not logged in"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Database query failed",
  "message": "Connection timeout"
}
```

---

## 📈 Rate Limiting

**Current**: No rate limiting (implement as needed)

**Recommended**:
- Search endpoints: 30 requests/minute
- Wishlist endpoints: 100 requests/minute
- Price check: Manual only (internal)

---

## 🔄 WebSocket Events (Future Enhancement)

```javascript
// Client subscribes to real-time updates
socket.on("price-drop", {
  productId: "B123XYZ",
  title: "Nike Air Max",
  oldPrice: 5500,
  newPrice: 4899
});
```

---

## 📝 Example Usage (JavaScript)

### Add to Wishlist
```javascript
const response = await fetch("http://localhost:8000/api/wishlist/add", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "user_123",
    title: "Nike Air Max 90",
    price: "₹5,500",
    source: "Amazon",
    link: "https://amazon.in/dp/B123XYZ",
    image: "https://..."
  })
});
const data = await response.json();
```

### Set Price Alert
```javascript
const response = await fetch("http://localhost:8000/api/wishlist/track", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "user_123",
    asin: "B123XYZ",
    title: "Nike Air Max 90",
    targetPrice: 4999
  })
});
```

### Get Notifications
```javascript
const response = await fetch("http://localhost:8000/api/notifications");
const notifications = await response.json();
```

---

## 📞 Contact

For API documentation updates or issues:
- Repository: ValueScout
- Maintainer: Development Team
- Last Updated: December 2024
