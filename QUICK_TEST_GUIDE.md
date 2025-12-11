# Quick Start Guide - Frontend Real Data Integration

## What Was Changed?

Your Home.tsx now connects to your backend API to fetch real products instead of showing hardcoded placeholder data.

## Key Features Implemented

### ✅ Real Data Loading
- Trending Deals - Fetches Nike shoes from backend
- Lowest This Month - Fetches Adidas deals from backend  
- Your Wishlist - Fetches user's saved items from backend
- Search Results - Queries backend in real-time

### ✅ Loading States
- Spinning loader appears while fetching data
- Loading text: "Loading trending deals..."
- Animated spinners with consistent styling

### ✅ Empty States
- "Your wishlist is empty" when user has no saved items
- "No items found" for search with no results
- "No trending deals found" if API returns no data

### ✅ Logo Navigation
- Click "ValueScout" logo to return home from anywhere
- Smooth hover effect on logo

### ✅ Wishlist Management
- Heart icon to add/remove items from wishlist
- Wishlist syncs with backend in real-time
- Items appear immediately in "Your Wishlist" section

## How to Test

### 1. Start Backend
```bash
cd backend
npm start
```
Backend runs on `http://localhost:8000`

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### 3. Test Search
1. Type "nike shoes" in search bar
2. See loading spinner appear
3. Results show real Nike products from Amazon/Flipkart
4. Click heart icon to add to wishlist
5. Item appears in "Your Wishlist" section below

### 4. Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Perform a search
4. Look for GET request: `/api/external-search?q=...`
5. Response shows `all: [...]` array with products

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/external-search?q=...` | GET | Search products |
| `/api/wishlist/:userId` | GET | Get user's wishlist |
| `/api/wishlist/add` | POST | Add item to wishlist |
| `/api/wishlist/remove` | DELETE | Remove from wishlist |

## Code Structure

```
Home.tsx
├── State Management (search results, loading, wishlist)
├── Data Fetching
│   ├── fetchWishlist() → /api/wishlist/guest
│   ├── fetchTrendingDeals() → /api/external-search?q=nike shoes
│   └── fetchLowestDeals() → /api/external-search?q=adidas
├── Wishlist Operations
│   ├── toggleWishlist()
│   ├── saveToWishlist() → POST /api/wishlist/add
│   └── removeFromWishlist() → DELETE /api/wishlist/remove
├── Search
│   └── handleSearch() → /api/external-search?q={query}
└── JSX Rendering
    ├── Search Results Section
    ├── Trending Deals Section
    ├── Lowest Deals Section
    └── Wishlist Section
```

## Common Issues & Solutions

### Issue: "No items loading in Trending Deals"
**Solution:** Verify backend is running on port 8000
```bash
curl http://localhost:8000/api/external-search?q=nike shoes
```

### Issue: "Wishlist not showing items"
**Solution:** Check if wishlist endpoint returns array
```bash
curl http://localhost:8000/api/wishlist/guest
```

### Issue: "CORS error in console"
**Solution:** Ensure backend has CORS enabled:
```javascript
// In backend/main_api_server.js
app.use(cors());
```

### Issue: "Loading spinners spin forever"
**Solution:** Check browser console for fetch errors (F12 → Console)

## File Changes Summary

### Modified Files
1. **BrandLogo.tsx** - Added click handler to navigate home
2. **Home.tsx** - Complete backend integration

### Not Modified
- SearchBar.tsx
- ProductCard.tsx
- DealCard.tsx
- WishlistCard.tsx
- Navbar.tsx
- App.tsx

## Next Steps

1. ✅ Test search with real products
2. ✅ Verify wishlist adds/removes
3. ✅ Check all loading states work
4. ⏳ (Optional) Add user authentication to replace "guest" userId
5. ⏳ (Optional) Create dedicated /wishlist page

## User ID Placeholder

Currently using `userId = "guest"` for all requests. To enable per-user functionality:

```typescript
// Change this line in Home.tsx
const userId = "guest"; // Current

// To this once auth is implemented:
const userId = getCurrentUserId(); // Get from auth context/state
```

## Performance Tips

- Trending and Lowest deals load on mount (3 parallel requests)
- Search results load on user input (not on mount)
- Wishlist refreshes after add/remove operations
- Consider caching trending/lowest results in future

---

**All API calls are configured to use `http://localhost:8000/api/*` automatically!**
