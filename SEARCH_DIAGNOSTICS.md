# 🔧 Search Not Working? Diagnostics Guide

## Quick Checklist

Use this to diagnose why search isn't showing results.

---

## ✅ Step 1: Is Backend Running?

### Check if backend is running on port 8000:
```bash
curl http://localhost:8000/
```

**Expected response**:
```json
{
  "status": "ok",
  "message": "ValueScout backend running"
}
```

**If you get an error** like `Connection refused`:
```bash
# Start backend in a terminal
cd backend
npm start
```

---

## ✅ Step 2: Is MongoDB Running?

### Check MongoDB connection:
```bash
mongo --eval "db.version()"
```

**Expected**: Shows MongoDB version (e.g., "5.0.0")

**If you get an error**:
```bash
# Start MongoDB
mongod

# Or on Windows, start the MongoDB service
```

---

## ✅ Step 3: Test Backend API Directly

### Test search endpoint with curl:
```bash
curl "http://localhost:8000/api/external-search?q=shoes"
```

**Expected response**:
```json
{
  "success": true,
  "count": 40,
  "amazon": [...],
  "flipkart": [...],
  "all": [...]
}
```

**If you get an error**:
- Check backend console for error messages
- Verify SerpApi key is valid
- Check MongoDB is running

---

## ✅ Step 4: Check Frontend Console

### Open browser DevTools:

1. **Press F12** to open Developer Tools
2. **Go to Console tab**
3. **Try searching** for something
4. **Look for errors** in the console

**Common errors and fixes**:

### Error: "Failed to fetch"
```
⚠️ Failed to fetch results: Failed to fetch
```
**Fix**: Backend not running. Run `npm start` in backend folder.

### Error: "localhost:8000 refused connection"
```
⚠️ Failed to fetch results: Failed to connect to localhost:8000
```
**Fix**: Backend not running. Make sure port 8000 is correct in backend/.env

### Error: "CORS error"
```
⚠️ Access to XMLHttpRequest blocked by CORS policy
```
**Fix**: Backend doesn't have CORS enabled. Check `main_api_server.js` line 20 has:
```javascript
app.use(cors());
```

---

## ✅ Step 5: Verify Network Request

### In DevTools, go to Network tab:

1. **Open DevTools → Network tab**
2. **Type in search box** (e.g., "shoes")
3. **Look for request** to `localhost:8000/api/external-search`
4. **Click on it** to see request/response

**Expected request**:
```
GET /api/external-search?q=shoes HTTP/1.1
Host: localhost:8000
```

**Expected response status**: `200 OK`

**If status is not 200**:
- `404`: Endpoint doesn't exist
- `500`: Backend error (check console)
- `Connection refused`: Backend not running

---

## Complete Diagnostic Test

Run this full test in order:

### Test 1: Backend Status
```bash
curl http://localhost:8000/
# Expected: {"status": "ok", ...}
```

### Test 2: MongoDB Status
```bash
mongo --eval "db.version()"
# Expected: Shows version number
```

### Test 3: Search API
```bash
curl "http://localhost:8000/api/external-search?q=test"
# Expected: {success: true, count: X, ...}
```

### Test 4: Frontend
- Open browser to `http://localhost:5173`
- Type in search box
- Should see results appear
- Check DevTools Console for errors

---

## If All Tests Pass But Still No Results

### 1. Check Backend Logs
Look at terminal running backend server. Should show:
```
🔍 Searching for: "shoes"
📦 Fetching from Amazon...
✓ Amazon: 20 products
📦 Fetching from Google Shopping (Flipkart)...
✓ Flipkart/Shopping: 20 products
📊 MongoDB upsert: X inserted, Y updated
✅ Search complete: 20 Amazon + 20 Flipkart results
```

### 2. Check SerpApi Issues
If you see errors like:
```
⚠️ Amazon fetch error: Invalid API key
```

**Fix**: Verify API key in `backend/main_api_server.js` line 17:
```javascript
const SERPAPI_KEY = "9c9ebdb9f7851dff0077e2ca096e4b82023ddbbb7b63fa5264ecaa0550ccdab5";
```

### 3. Check MongoDB Data
```bash
mongo
> use value_scout
> db.products.count()  # Should show number of products
> db.products.findOne()  # Should show a product
```

If empty, try searching again - products are auto-saved.

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Connection refused" on port 8000 | Backend not running | Run `npm start` in backend |
| "Connection refused" on port 27017 | MongoDB not running | Run `mongod` |
| No results appear | No data in MongoDB | Search once to populate DB |
| Results from API but not in UI | Frontend not calling API | Check Network tab in DevTools |
| CORS errors | Backend doesn't have CORS | Verify `app.use(cors())` in main_api_server.js |
| Search shows defaults | Backend returning error | Check backend console logs |
| "SerpApi quota exceeded" | API rate limited | Wait for reset or check API key |

---

## Step-by-Step Recovery

If nothing is working, follow this exact sequence:

### Terminal 1: Start MongoDB
```bash
mongod
# Wait for: "Waiting for connections on port 27017"
```

### Terminal 2: Start Backend
```bash
cd backend
npm install  # If you haven't yet
npm start
# Wait for: "🚀 Backend Server running on port 8000"
```

### Terminal 3: Start Frontend
```bash
cd frontend
npm run dev
# Wait for: "VITE v... ready in X ms"
```

### Browser
```
http://localhost:5173
```

### Test
1. Click in search box
2. Type "shoes"
3. Should see results immediately
4. If not, check DevTools Console for errors

---

## What Changed in Frontend

### Changes Made:
1. ✅ **Home.tsx** - Search now navigates to Compare page
2. ✅ **Compare.tsx** - Now calls `/api/external-search` endpoint
3. ✅ **Compare.tsx** - Handles loading, error, and success states
4. ✅ **Compare.tsx** - Displays real API results instead of mock data

### How It Works Now:
```
User types "shoes" on Home page
    ↓
SearchBar calls onSearch callback
    ↓
Home navigates to Compare page with query parameter
    ↓
Compare page receives query parameter
    ↓
Compare calls backend: GET /api/external-search?q=shoes
    ↓
Backend fetches from SerpApi (Amazon + Flipkart)
    ↓
Backend stores in MongoDB
    ↓
Backend returns results to frontend
    ↓
Frontend displays results in grid
```

---

## Browser Console Messages

### Success (what you should see):
```
Searching across Amazon and Flipkart...
Found 40 results
```

### Error (what indicates a problem):
```
Failed to fetch results: Failed to connect to localhost:8000
```

---

## Advanced: Check Network Timing

In DevTools Network tab, you should see:
- **Request**: `GET /api/external-search?q=shoes`
- **Status**: `200 OK`
- **Time**: 2-5 seconds (waiting for SerpApi)
- **Size**: ~100-500KB

If timing is wrong, backend might be slow or hanging.

---

## Still Need Help?

Check these files for debugging:
1. **Backend**: `backend/main_api_server.js` (check logs)
2. **Frontend**: Open DevTools Console (check errors)
3. **Documentation**: `backend/API_MIGRATION_GUIDE.md`
4. **Testing**: `backend/TESTING_GUIDE.md`

---

## Quick Test Commands

```bash
# Check everything is running
ps aux | grep node    # Check Node.js running
ps aux | grep mongo   # Check MongoDB running

# Quick API test
curl -s http://localhost:8000/ | jq .

# Check backend logs in real-time
cd backend && npm start 2>&1 | grep -E "🔍|✓|❌|📊|⚠️"
```

---

## 🎯 If You Fix It

Once it's working, you should see:
- ✅ Search box accepts input
- ✅ Results appear after 2-5 seconds
- ✅ Multiple products from Amazon and Flipkart
- ✅ Products have images, prices, ratings
- ✅ Can click "View Deal" to visit product

**Congratulations!** Your search is working! 🎉
