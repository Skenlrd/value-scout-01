# Developer Reference: Node.js Backend API

## Quick Reference Card

### Health & Status
```bash
GET /
# Response: {status: "ok", message: "..."}
```

---

## Search API

### External Search (Amazon + Flipkart)
```bash
GET /api/external-search?q=nike
```
- **Returns**: 20 Amazon + 20 Flipkart results
- **Storage**: Auto-upserts to MongoDB
- **Time**: 2-5 seconds
- **Cache**: None (always fresh from SerpApi)

### Local Search
```bash
GET /api/search?q=nike
```
- **Returns**: Products from MongoDB only
- **Time**: <100ms
- **Filter**: productName, brand, category, source

### Get Products by IDs
```bash
GET /api/products-by-ids?ids=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012
```
- **Returns**: Array of products
- **Limit**: No limit (but use responsibly)

---

## Wishlist API

### Add Item
```javascript
// Request
POST /api/wishlist/add
{
  "userId": "user123",      // Required
  "title": "Product name",  // Required
  "link": "https://...",    // Required (must be unique per user)
  "price": "₹5999",
  "image": "https://...",
  "source": "Amazon",
  "asin": "B07XYZ123",
  "targetPrice": 4999       // Optional: for price alerts
}

// Response (201)
{
  "message": "Added to wishlist",
  "status": "added",
  "item": { ... }
}

// Response (409) - Already exists
{
  "message": "Item already in wishlist",
  "status": "duplicate",
  "item": { ... }
}
```

### Remove Item
```javascript
// By Link
DELETE /api/wishlist/remove
{
  "userId": "user123",                                    // Required
  "link": "https://www.amazon.in/dp/B09B9CPVF5"         // OR itemId
}

// By Item ID
DELETE /api/wishlist/remove
{
  "userId": "user123",                                    // Required
  "itemId": "507f1f77bcf86cd799439020"                   // OR link
}

// Response (200)
{
  "message": "Removed from wishlist",
  "status": "removed",
  "item": { ... }
}

// Response (404)
{
  "message": "Item not found in wishlist",
  "status": "not_found"
}
```

### Get User's Wishlist
```bash
GET /api/wishlist/user123

# Response (200)
{
  "userId": "user123",
  "count": 5,
  "items": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "userId": "user123",
      "title": "Nike Shoes",
      "price": "₹5999",
      "image": "https://...",
      "source": "Amazon",
      "link": "https://www.amazon.in/dp/B09B9CPVF5",
      "asin": "B09B9CPVF5",
      "targetPrice": 4999,
      "createdAt": "2024-12-11T10:35:00.000Z"
    }
  ]
}
```

### Check If In Wishlist
```bash
GET /api/wishlist/check/user123?link=https://www.amazon.in/dp/B09B9CPVF5

# Response: true
{
  "inWishlist": true,
  "item": { ... }
}

# Response: false
{
  "inWishlist": false,
  "item": null
}
```

---

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET successful, DELETE successful |
| 201 | Created | POST successful (item added) |
| 400 | Bad Request | Missing required field |
| 404 | Not Found | Item doesn't exist |
| 409 | Conflict | Duplicate item in wishlist |
| 500 | Server Error | Database connection failed |

---

## MongoDB Document Structures

### Product
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  productName: "Nike Men's Revolution 6",
  price: "₹4,999",
  source: "Amazon",
  image: "https://m.media-amazon.com/...",
  link: "https://www.amazon.in/dp/B09B9CPVF5",
  asin: "B09B9CPVF5",
  rating: 4.5,
  reviews: 8456,
  createdAt: ISODate("2024-12-11T10:30:00Z"),
  updatedAt: ISODate("2024-12-11T10:30:00Z")
}
```

### Wishlist
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439020"),
  userId: "user123",
  productId: null,              // Optional reference
  title: "Nike Men's Revolution 6",
  price: "₹4,999",
  image: "https://m.media-amazon.com/...",
  source: "Amazon",
  link: "https://www.amazon.in/dp/B09B9CPVF5",
  asin: "B09B9CPVF5",
  targetPrice: 3999,            // Optional
  createdAt: ISODate("2024-12-11T10:35:00Z")
}
```

---

## Error Messages

### Search Errors
```javascript
// Missing query
{ error: "Query parameter 'q' is required" }

// Database not ready
{ error: "Database not initialized" }

// SerpApi error
{ error: "Error fetching Amazon results: Invalid API key" }
```

### Wishlist Errors
```javascript
// Missing required fields
{ error: "Missing required fields: userId, title, link" }

// Not logged in (future)
{ error: "User not logged in" }

// Database error
{ error: "Database error..." }
```

---

## Common Tasks

### 1. Search and Add to Wishlist

```javascript
// Step 1: Search
const searchResults = await fetch('/api/external-search?q=nike')
  .then(r => r.json());

// Step 2: Get first result
const product = searchResults.amazon[0];

// Step 3: Add to wishlist
const wishlistItem = await fetch('/api/wishlist/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    title: product.productName,
    price: product.price,
    image: product.image,
    source: product.source,
    link: product.link,
    asin: product.asin,
    targetPrice: 4000  // Alert if price drops below ₹4000
  })
}).then(r => r.json());

if (wishlistItem.status === 'added') {
  console.log('✅ Added to wishlist!');
} else if (wishlistItem.status === 'duplicate') {
  console.log('⚠️ Already in wishlist');
}
```

### 2. Display User's Wishlist

```javascript
const wishlist = await fetch('/api/wishlist/user123')
  .then(r => r.json());

wishlist.items.forEach(item => {
  console.log(`${item.title} - ₹${item.price}`);
});
```

### 3. Remove from Wishlist

```javascript
// By link
await fetch('/api/wishlist/remove', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    link: product.link
  })
});

// OR by itemId
await fetch('/api/wishlist/remove', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    itemId: '507f1f77bcf86cd799439020'
  })
});
```

### 4. Check if Product in Wishlist

```javascript
const check = await fetch(
  `/api/wishlist/check/user123?link=${encodeURIComponent(product.link)}`
).then(r => r.json());

if (check.inWishlist) {
  console.log('✓ Already in wishlist');
  console.log('Price alert at: ₹' + check.item.targetPrice);
} else {
  console.log('× Not in wishlist yet');
}
```

---

## Configuration

### .env File
```env
# Port where backend runs
PORT=8000

# MongoDB connection string
MONGO_URI=mongodb://127.0.0.1:27017/value_scout

# Collection name for products
COLLECTION_NAME=products

# Python AI API URL
AI_API_URL=http://localhost:5000

# Optional: Node environment
NODE_ENV=development
```

### SerpApi Key
Located in `main_api_server.js` line 17:
```javascript
const SERPAPI_KEY = "9c9ebdb9f7851dff0077e2ca096e4b82023ddbbb7b63fa5264ecaa0550ccdab5";
```

---

## Performance Tips

1. **Search Performance**
   - First search: ~3-5 seconds (SerpApi)
   - Subsequent searches from MongoDB: <100ms
   - Recommend: Search → store → then search locally

2. **Wishlist Performance**
   - Add item: ~20-50ms
   - Get all items: ~10-30ms (depends on count)
   - Optimize: Add index on userId if >10k users

3. **Memory Usage**
   - Keep default Mongoose connection pooling
   - Each search response: ~100-500KB
   - MongoDB default memory: auto-managed

---

## Debugging Tips

### Check if Backend is Running
```bash
curl http://localhost:8000/
# Should return: {status: "ok", ...}
```

### Check MongoDB Connection
```bash
mongo --eval "db.version()"
# Should show MongoDB version

# Or in backend logs:
# ✅ MongoDB connected successfully
```

### Check SerpApi Connection
```bash
# Make a search request and watch server logs
curl "http://localhost:8000/api/external-search?q=test"
# Should show: 📦 Fetching from Amazon...
# Then: ✓ Amazon: 20 products
```

### View Database
```bash
mongo
> use value_scout
> db.products.find().limit(3)
> db.wishlists.find().limit(3)
> db.products.countDocuments()
```

---

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Ensure MongoDB is running and accessible
- [ ] Test all endpoints in production
- [ ] Set up MongoDB backups
- [ ] Monitor error logs
- [ ] Set up uptime monitoring
- [ ] Cache search results (optional)
- [ ] Add rate limiting (optional)
- [ ] Enable HTTPS (optional)

---

## Future Enhancements

```javascript
// Price tracking notifications
POST /api/notifications/track
{
  "userId": "user123",
  "link": "https://...",
  "targetPrice": 3999
}

// Product reviews
GET /api/products/:id/reviews

// Recommendations
GET /api/products/:id/similar

// Analytics
GET /api/analytics/searches
GET /api/analytics/wishlists
```

---

## License & Credits

Backend Migration: Node.js/Express/Mongoose
- Original Flask Backend: Python
- Migration Date: December 2024
- API Key: SerpApi (amazon.in, google.co.in)

---

## Contact & Support

For issues:
1. Check TESTING_GUIDE.md
2. Check API_MIGRATION_GUIDE.md
3. Review server console logs
4. Check MongoDB connection
5. Verify .env configuration
