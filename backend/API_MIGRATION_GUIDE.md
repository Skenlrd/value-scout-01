# ValueScout Backend Migration: Flask → Node.js/Express/Mongoose

## Overview

This document outlines the migration from the Python Flask backend to a Node.js/Express backend with MongoDB for product storage and wishlist management.

---

## Architecture Changes

### Before (Flask)
- **Server**: Flask on port 5000
- **Database**: MySQL (users, wishlist, tracking, notifications)
- **Search**: SerpApi via Python requests library
- **Session Management**: Flask sessions

### After (Node.js)
- **Server**: Express.js on port 8000
- **Database**: MongoDB for products and wishlists
- **Search**: SerpApi via axios
- **Session Management**: Handled by frontend JWT or cookies

---

## Database Schemas

### 1. Product Schema (MongoDB)

```javascript
{
  _id: ObjectId,
  productName: String,           // Product title
  price: Mixed,                  // String or number
  source: String,                // "Amazon", "Flipkart", "Google Shopping"
  image: String,                 // URL to product image
  link: String,                  // Product URL (unique)
  asin: String,                  // Amazon ASIN (optional)
  rating: Mixed,                 // Number or string
  reviews: Mixed,                // Number or string
  createdAt: Date,               // Auto-set on insert
  updatedAt: Date                // Auto-set on upsert
}
```

**Indexes**: `link` (unique)

### 2. Wishlist Schema (MongoDB)

```javascript
{
  _id: ObjectId,
  userId: String,                // User ID from session
  productId: ObjectId,           // Reference to Product (optional)
  title: String,                 // Product title
  price: Mixed,                  // Current price
  image: String,                 // Product image URL
  source: String,                // "Amazon", "Flipkart", etc.
  link: String,                  // Product URL
  asin: String,                  // Amazon ASIN (optional)
  targetPrice: Mixed,            // Price alert threshold (optional)
  createdAt: Date                // Auto-set on insert
}
```

---

## API Endpoints

### 🔍 Search & Products

#### 1. **External Search (SerpApi Integration)**

```
GET /api/external-search?q=<query>
```

**Description**: Searches Amazon and Flipkart via SerpApi, upserts results to MongoDB.

**Request Parameters**:
- `q` (required): Search query string

**Response**:
```json
{
  "success": true,
  "count": 40,
  "amazon": [
    {
      "productName": "Nike Shoes",
      "price": "₹5999",
      "source": "Amazon",
      "image": "https://...",
      "link": "https://amazon.in/dp/...",
      "asin": "B07XYZ123",
      "rating": 4.5,
      "reviews": 1250
    }
  ],
  "flipkart": [
    {
      "productName": "Nike Shoes",
      "price": "₹5899",
      "source": "Google Shopping",
      "image": "https://...",
      "link": "https://flipkart.com/...",
      "rating": null,
      "reviews": null
    }
  ],
  "all": [...]  // Combined results
}
```

**Status Codes**:
- `200`: Success
- `400`: Missing query parameter
- `500`: SerpApi or database error

**Example**:
```bash
curl "http://localhost:8000/api/external-search?q=nike+shoes"
```

---

#### 2. **Local Product Search**

```
GET /api/search?q=<query>
```

**Description**: Search products already stored in MongoDB. Uses regex matching.

**Request Parameters**:
- `q` (optional): Search query

**Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "productName": "Nike Shoes",
    "price": "₹5999",
    "source": "Amazon",
    "image": "https://...",
    "link": "https://amazon.in/dp/...",
    "asin": "B07XYZ123"
  }
]
```

**Status Codes**:
- `200`: Success
- `500`: Database error

---

#### 3. **Fetch Products by IDs**

```
GET /api/products-by-ids?ids=<id1>,<id2>,<id3>
```

**Description**: Retrieve multiple products by their MongoDB IDs.

**Request Parameters**:
- `ids` (required): Comma-separated MongoDB ObjectIds

**Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "productName": "Nike Shoes",
    ...
  }
]
```

---

### ❤️ Wishlist Management

#### 4. **Add to Wishlist**

```
POST /api/wishlist/add
Content-Type: application/json
```

**Description**: Add a product to user's wishlist. Prevents duplicates by link.

**Request Body**:
```json
{
  "userId": "user123",
  "title": "Nike Shoes",
  "price": "₹5999",
  "image": "https://...",
  "source": "Amazon",
  "link": "https://amazon.in/dp/B07XYZ123",
  "asin": "B07XYZ123",
  "targetPrice": 4999  // Optional: for price alerts
}
```

**Response** (Success - 201):
```json
{
  "message": "Added to wishlist",
  "status": "added",
  "item": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "user123",
    "title": "Nike Shoes",
    "link": "https://amazon.in/dp/B07XYZ123",
    "createdAt": "2024-12-11T10:30:00.000Z"
  }
}
```

**Response** (Duplicate - 409):
```json
{
  "message": "Item already in wishlist",
  "status": "duplicate",
  "item": { ... }
}
```

**Status Codes**:
- `201`: Item added successfully
- `400`: Missing required fields
- `409`: Item already in wishlist
- `500`: Database error

---

#### 5. **Remove from Wishlist**

```
DELETE /api/wishlist/remove
Content-Type: application/json
```

**Description**: Remove a product from user's wishlist.

**Request Body** (Option A - by item ID):
```json
{
  "userId": "user123",
  "itemId": "507f1f77bcf86cd799439012"
}
```

**Request Body** (Option B - by product link):
```json
{
  "userId": "user123",
  "link": "https://amazon.in/dp/B07XYZ123"
}
```

**Response** (Success - 200):
```json
{
  "message": "Removed from wishlist",
  "status": "removed",
  "item": { ... }
}
```

**Response** (Not Found - 404):
```json
{
  "message": "Item not found in wishlist",
  "status": "not_found"
}
```

**Status Codes**:
- `200`: Item removed successfully
- `400`: Missing userId or both itemId/link
- `404`: Item not found
- `500`: Database error

---

#### 6. **Get User's Wishlist**

```
GET /api/wishlist/:userId
```

**Description**: Retrieve all wishlist items for a specific user.

**Request Parameters**:
- `userId` (path parameter): User identifier

**Response** (200):
```json
{
  "userId": "user123",
  "count": 3,
  "items": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "user123",
      "title": "Nike Shoes",
      "price": "₹5999",
      "image": "https://...",
      "source": "Amazon",
      "link": "https://amazon.in/dp/B07XYZ123",
      "asin": "B07XYZ123",
      "targetPrice": 4999,
      "createdAt": "2024-12-11T10:30:00.000Z"
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `400`: Missing userId parameter
- `500`: Database error

---

#### 7. **Check if Product in Wishlist**

```
GET /api/wishlist/check/:userId?link=<product_link>
```

**Description**: Check if a specific product is already in user's wishlist.

**Request Parameters**:
- `userId` (path parameter): User identifier
- `link` (query parameter): Product URL

**Response**:
```json
{
  "inWishlist": true,
  "item": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "user123",
    "title": "Nike Shoes",
    ...
  }
}
```

or

```json
{
  "inWishlist": false,
  "item": null
}
```

---

### 🎨 AI Style Builder

#### 8. **Style Builder Recommendations**

```
GET /api/style-builder/:productId
```

**Description**: Proxy request to Python AI API for outfit recommendations.

**Request Parameters**:
- `productId` (path parameter): Product MongoDB ObjectId

**Response**:
```json
{
  "recommendations": [
    {
      "product": { ... },
      "reason": "Complements your style"
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `500`: AI service unavailable

---

## Migration Guide

### Step 1: Environment Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/value_scout
COLLECTION_NAME=products
AI_API_URL=http://localhost:5000
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Start MongoDB

```bash
# Windows
mongod

# Or using MongoDB Atlas
# Update MONGO_URI in .env
```

### Step 4: Start Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

---

## Changes from Flask Implementation

### 1. **Database Structure**
- ❌ MySQL multi-table approach (users, wishlist, wishlist_tracking, notifications)
- ✅ MongoDB document-based approach (products, wishlists)

### 2. **Search Logic**
- ❌ Flask: `@app.route("/search")` → SerpApi → return results
- ✅ Node.js: `GET /api/external-search` → SerpApi → upsert to MongoDB → return results

### 3. **Wishlist Storage**
- ❌ Flask: Wishlist stored in MySQL, linked by user_id + asin
- ✅ Node.js: Wishlist stored in MongoDB, linked by userId + link

### 4. **Duplicate Prevention**
- ❌ Flask: Primary key on (user_id, asin)
- ✅ Node.js: Unique constraint on link + check before insert

### 5. **Price Tracking**
- ❌ Flask: Separate `wishlist_tracking` table + cron job
- ✅ Node.js: Optional `targetPrice` field in wishlist doc + future enhancement

---

## API Testing Examples

### Using cURL

```bash
# Search Amazon & Flipkart
curl "http://localhost:8000/api/external-search?q=nike+shoes"

# Add to wishlist
curl -X POST http://localhost:8000/api/wishlist/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "Nike Shoes",
    "price": "₹5999",
    "image": "https://...",
    "source": "Amazon",
    "link": "https://amazon.in/dp/B07XYZ123"
  }'

# Get wishlist
curl "http://localhost:8000/api/wishlist/user123"

# Remove from wishlist
curl -X DELETE http://localhost:8000/api/wishlist/remove \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "link": "https://amazon.in/dp/B07XYZ123"
  }'
```

### Using Postman

Import this collection:

1. **External Search**
   - Method: GET
   - URL: `{{base_url}}/api/external-search?q=nike shoes`

2. **Add to Wishlist**
   - Method: POST
   - URL: `{{base_url}}/api/wishlist/add`
   - Body (JSON):
   ```json
   {
     "userId": "user123",
     "title": "Nike Shoes",
     "price": "₹5999",
     "image": "https://...",
     "source": "Amazon",
     "link": "https://amazon.in/dp/B07XYZ123"
   }
   ```

3. **Get Wishlist**
   - Method: GET
   - URL: `{{base_url}}/api/wishlist/user123`

---

## Error Handling

All endpoints return proper HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid parameters) |
| 404 | Not Found |
| 409 | Conflict (duplicate item) |
| 500 | Server Error |

---

## Performance Considerations

### Optimizations Implemented

1. **MongoDB Upsert with bulkWrite**
   - Prevents duplicate products by matching on `link`
   - Single database round-trip for multiple products

2. **Indexed Fields**
   - `link` field is indexed to prevent duplicates
   - `userId` is indexed for wishlist queries

3. **Regex Caching**
   - Search queries use compiled regex patterns
   - Limit of 100 results per search

### Future Enhancements

- [ ] Add caching layer (Redis) for frequent searches
- [ ] Implement pagination for search results
- [ ] Add price tracking notifications
- [ ] Add product reviews/ratings aggregation
- [ ] Implement user authentication with JWT
- [ ] Add analytics tracking

---

## Troubleshooting

### MongoDB Connection Failed
```
Error: ❌ MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running (`mongod`)

### SerpApi Key Invalid
```
Error: Error fetching Amazon results: Invalid API key
```
**Solution**: Verify API key in `main_api_server.js` line 17

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::8000
```
**Solution**: Change PORT in `.env` or kill process using port 8000

### Duplicate Key Error
```
Error: E11000 duplicate key error collection: value_scout.products index: link_1
```
**Solution**: Ensure all products have unique links, or rebuild collection

---

## Summary of API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/external-search?q=...` | Search Amazon & Flipkart, upsert results |
| GET | `/api/search?q=...` | Search local MongoDB products |
| GET | `/api/products-by-ids?ids=...` | Fetch products by IDs |
| POST | `/api/wishlist/add` | Add item to wishlist |
| DELETE | `/api/wishlist/remove` | Remove item from wishlist |
| GET | `/api/wishlist/:userId` | Get all wishlist items |
| GET | `/api/wishlist/check/:userId?link=...` | Check if product in wishlist |
| GET | `/api/style-builder/:productId` | Get AI recommendations |

---

## Next Steps

1. ✅ Update `frontend/src/lib/api.ts` to call new Node.js endpoints
2. ✅ Update React components to use new wishlist API
3. ✅ Test search flow: Home → Compare → Results
4. ✅ Test wishlist functionality
5. ⏳ Implement user authentication with JWT (future)
6. ⏳ Add price tracking notifications (future)
7. ⏳ Migrate user data from MySQL to MongoDB (if needed)
