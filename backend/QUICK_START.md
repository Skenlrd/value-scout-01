# Quick Start: Flask → Node.js Backend Migration

## What Changed?

Your Flask backend (Python) has been replaced with an Express.js backend (Node.js). All the same functionality is now available with the same API endpoints but with MongoDB instead of MySQL.

---

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create a `.env` file in the `backend/` directory:
```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/value_scout
COLLECTION_NAME=products
AI_API_URL=http://localhost:5000
```

### 3. Start MongoDB
Make sure MongoDB is running:
```bash
# Windows: Start MongoDB service
# Or run: mongod

# macOS/Linux:
mongod
```

### 4. Start the Backend
```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:
```
🚀 Backend Server running on port 8000
📍 http://localhost:8000
```

---

## API Endpoints Summary

### 🔍 Search
```
GET /api/external-search?q=nike+shoes
```
- Searches Amazon & Flipkart via SerpApi
- Automatically saves results to MongoDB
- Returns combined results from both sources

### ❤️ Wishlist
```
POST /api/wishlist/add
DELETE /api/wishlist/remove
GET /api/wishlist/:userId
```

### 🎨 AI Style Builder
```
GET /api/style-builder/:productId
```
- Proxies to Python AI backend for recommendations

---

## Testing the Backend

### Using cURL

**Test 1: Search for products**
```bash
curl "http://localhost:8000/api/external-search?q=shoes"
```

**Test 2: Add to wishlist**
```bash
curl -X POST http://localhost:8000/api/wishlist/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testuser123",
    "title": "Nike Shoes",
    "price": "₹5999",
    "source": "Amazon",
    "link": "https://amazon.in/dp/B07XYZ123"
  }'
```

**Test 3: Get wishlist**
```bash
curl "http://localhost:8000/api/wishlist/testuser123"
```

---

## Key Differences from Flask

| Aspect | Flask | Node.js |
|--------|-------|---------|
| **Language** | Python | JavaScript |
| **Framework** | Flask | Express.js |
| **Database** | MySQL | MongoDB |
| **Port** | 5000 | 8000 |
| **Search Results** | Returned only | Upserted to DB + returned |
| **Wishlist Storage** | MySQL (user_id + asin) | MongoDB (userId + link) |

---

## Important: Update Frontend

The frontend API client was already updated to use the new endpoints on `localhost:8000`:

✅ `frontend/src/lib/api.ts` - Uses correct port and endpoints
✅ `SearchBar.tsx` - Calls `/api/external-search`
✅ `Compare.tsx` - Uses normalized results format
✅ `ProductCard.tsx` - Updated to new wishlist API

---

## Troubleshooting

### Backend won't start
```
Error: listen EADDRINUSE: address already in use :::8000
```
**Fix**: Kill the process using port 8000 or change PORT in .env

### MongoDB connection failed
```
Error: ❌ MongoDB connection failed: connect ECONNREFUSED
```
**Fix**: Start MongoDB with `mongod`

### SerpApi rate limited
```
Error: SerpApi quota exceeded
```
**Fix**: Wait for quota reset or use a different API key

### Duplicate key error
```
Error: E11000 duplicate key error
```
**Fix**: This is normal - it means the product was already saved

---

## Running All Services Together

You can start all three services (AI, Backend, Frontend) with:

```bash
cd backend
npm run start:all
```

This will start:
- Python AI API on `localhost:5000`
- Node.js Backend on `localhost:8000`
- React Frontend on `localhost:5173` (Vite)

---

## Full API Documentation

See `API_MIGRATION_GUIDE.md` for complete endpoint documentation with all parameters and response formats.

---

## Next Steps

1. ✅ Start the backend server
2. ✅ Test the search endpoint
3. ✅ Test the wishlist endpoints
4. ✅ Use the frontend to test end-to-end flow
5. (Future) Add user authentication with JWT
6. (Future) Add price tracking notifications

---

## Support

For issues or questions:
1. Check `API_MIGRATION_GUIDE.md` for detailed docs
2. Check server logs for error messages
3. Verify MongoDB is running
4. Ensure `.env` file is configured correctly
5. Check that all npm dependencies are installed
