# Backend Testing Guide: Flask → Node.js Migration

## Overview

This guide provides step-by-step instructions to test all the new Node.js backend endpoints.

---

## Prerequisites

- Node.js backend running on `localhost:8000`
- MongoDB running on `localhost:27017`
- Postman or cURL installed
- (Optional) Python backend on `localhost:5000` for AI features

---

## Test Suite

### Part 1: Health Check

#### Test 1.1: Server Status
```bash
curl http://localhost:8000/
```

**Expected Response**:
```json
{
  "status": "ok",
  "message": "ValueScout backend running"
}
```

---

### Part 2: Search & Products

#### Test 2.1: External Search (SerpApi Integration)

**Endpoint**: `GET /api/external-search?q=nike`

```bash
curl "http://localhost:8000/api/external-search?q=nike"
```

**What it does**:
1. Searches Amazon for "nike"
2. Searches Flipkart (via Google Shopping) for "nike"
3. Stores results in MongoDB (upserts by link)
4. Returns combined results

**Expected Response**:
```json
{
  "success": true,
  "count": 40,
  "amazon": [
    {
      "productName": "Nike Men's Revolution 6 Running Shoe",
      "price": "₹4,999",
      "source": "Amazon",
      "image": "https://m.media-amazon.com/...",
      "link": "https://www.amazon.in/dp/B09B9CPVF5",
      "asin": "B09B9CPVF5",
      "rating": 4.5,
      "reviews": 8456
    }
  ],
  "flipkart": [
    {
      "productName": "Nike Shoes for Men",
      "price": "₹4,999",
      "source": "Google Shopping",
      "image": "https://...",
      "link": "https://www.flipkart.com/...",
      "rating": null,
      "reviews": null
    }
  ],
  "all": [...]
}
```

**Status Code**: `200`

**Test Variations**:
```bash
# Search for shoes
curl "http://localhost:8000/api/external-search?q=shoes"

# Search for specific product
curl "http://localhost:8000/api/external-search?q=iphone+15"

# Empty search (should fail)
curl "http://localhost:8000/api/external-search?q="
# Expected: 400 Bad Request
```

---

#### Test 2.2: Verify MongoDB Insert

After running Test 2.1, check if products were saved:

```bash
# Using mongo shell
mongo
> use value_scout
> db.products.find().limit(3)

# Example output:
{
  "_id": ObjectId("..."),
  "productName": "Nike Revolution 6",
  "price": "₹4,999",
  "source": "Amazon",
  "image": "https://...",
  "link": "https://www.amazon.in/dp/B09B9CPVF5",
  "asin": "B09B9CPVF5",
  "createdAt": ISODate("2024-12-11T10:30:00.000Z"),
  "updatedAt": ISODate("2024-12-11T10:30:00.000Z")
}
```

---

#### Test 2.3: Local Product Search

**Endpoint**: `GET /api/search?q=nike`

```bash
curl "http://localhost:8000/api/search?q=nike"
```

**What it does**: Searches products already in MongoDB database

**Expected Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "productName": "Nike Revolution 6",
    "price": "₹4,999",
    "source": "Amazon",
    "image": "https://...",
    "link": "https://www.amazon.in/dp/B09B9CPVF5",
    "asin": "B09B9CPVF5"
  }
]
```

**Status Code**: `200`

---

#### Test 2.4: Fetch Products by IDs

**Endpoint**: `GET /api/products-by-ids?ids=<id1>,<id2>`

First, get some product IDs from Test 2.3, then:

```bash
curl "http://localhost:8000/api/products-by-ids?ids=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012"
```

**Expected Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "productName": "Nike Revolution 6",
    ...
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "productName": "Nike Air Max",
    ...
  }
]
```

**Status Code**: `200`

---

### Part 3: Wishlist Management

#### Test 3.1: Add Item to Wishlist

**Endpoint**: `POST /api/wishlist/add`

```bash
curl -X POST http://localhost:8000/api/wishlist/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "Nike Men Revolution 6 Running Shoe",
    "price": "₹4,999",
    "image": "https://m.media-amazon.com/...",
    "source": "Amazon",
    "link": "https://www.amazon.in/dp/B09B9CPVF5",
    "asin": "B09B9CPVF5",
    "targetPrice": 3999
  }'
```

**Expected Response** (201 Created):
```json
{
  "message": "Added to wishlist",
  "status": "added",
  "item": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "user123",
    "title": "Nike Men Revolution 6 Running Shoe",
    "price": "₹4,999",
    "image": "https://...",
    "source": "Amazon",
    "link": "https://www.amazon.in/dp/B09B9CPVF5",
    "asin": "B09B9CPVF5",
    "targetPrice": 3999,
    "createdAt": "2024-12-11T10:35:00.000Z"
  }
}
```

**Status Code**: `201`

---

#### Test 3.2: Try Adding Duplicate (Should Fail)

Run Test 3.1 again with the same link:

```bash
curl -X POST http://localhost:8000/api/wishlist/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "Nike Men Revolution 6 Running Shoe",
    "price": "₹4,999",
    "source": "Amazon",
    "link": "https://www.amazon.in/dp/B09B9CPVF5"
  }'
```

**Expected Response** (409 Conflict):
```json
{
  "message": "Item already in wishlist",
  "status": "duplicate",
  "item": { ... }
}
```

**Status Code**: `409`

---

#### Test 3.3: Get User's Wishlist

**Endpoint**: `GET /api/wishlist/:userId`

```bash
curl "http://localhost:8000/api/wishlist/user123"
```

**Expected Response**:
```json
{
  "userId": "user123",
  "count": 1,
  "items": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "userId": "user123",
      "title": "Nike Men Revolution 6 Running Shoe",
      "price": "₹4,999",
      "image": "https://...",
      "source": "Amazon",
      "link": "https://www.amazon.in/dp/B09B9CPVF5",
      "asin": "B09B9CPVF5",
      "targetPrice": 3999,
      "createdAt": "2024-12-11T10:35:00.000Z"
    }
  ]
}
```

**Status Code**: `200`

---

#### Test 3.4: Check if Product in Wishlist

**Endpoint**: `GET /api/wishlist/check/:userId?link=<product_link>`

```bash
curl "http://localhost:8000/api/wishlist/check/user123?link=https://www.amazon.in/dp/B09B9CPVF5"
```

**Expected Response** (when in wishlist):
```json
{
  "inWishlist": true,
  "item": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "user123",
    "title": "Nike Men Revolution 6 Running Shoe",
    ...
  }
}
```

**Test with non-existent product**:
```bash
curl "http://localhost:8000/api/wishlist/check/user123?link=https://www.amazon.in/dp/NONEXISTENT"
```

**Expected Response** (when not in wishlist):
```json
{
  "inWishlist": false,
  "item": null
}
```

**Status Code**: `200`

---

#### Test 3.5: Remove from Wishlist (by link)

**Endpoint**: `DELETE /api/wishlist/remove`

```bash
curl -X DELETE http://localhost:8000/api/wishlist/remove \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "link": "https://www.amazon.in/dp/B09B9CPVF5"
  }'
```

**Expected Response**:
```json
{
  "message": "Removed from wishlist",
  "status": "removed",
  "item": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "user123",
    ...
  }
}
```

**Status Code**: `200`

---

#### Test 3.6: Remove from Wishlist (by itemId)

First, add an item again and get its `_id`:

```bash
# Add item
curl -X POST http://localhost:8000/api/wishlist/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "Test Product",
    "price": "₹5,000",
    "source": "Amazon",
    "link": "https://www.amazon.in/dp/TESTID123"
  }'

# Remove by itemId (from response above)
curl -X DELETE http://localhost:8000/api/wishlist/remove \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "itemId": "507f1f77bcf86cd799439021"
  }'
```

**Expected Response**:
```json
{
  "message": "Removed from wishlist",
  "status": "removed",
  "item": { ... }
}
```

**Status Code**: `200`

---

#### Test 3.7: Try Removing Non-existent Item

```bash
curl -X DELETE http://localhost:8000/api/wishlist/remove \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "link": "https://www.amazon.in/dp/NONEXISTENT"
  }'
```

**Expected Response** (404 Not Found):
```json
{
  "message": "Item not found in wishlist",
  "status": "not_found"
}
```

**Status Code**: `404`

---

### Part 4: Error Handling

#### Test 4.1: Missing Required Parameters

**Missing 'q' in search**:
```bash
curl "http://localhost:8000/api/external-search?q="
```

**Expected Response** (400 Bad Request):
```json
{
  "error": "Query parameter 'q' is required"
}
```

---

#### Test 4.2: Missing Wishlist Fields

```bash
curl -X POST http://localhost:8000/api/wishlist/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "error": "Missing required fields: userId, title, link"
}
```

---

#### Test 4.3: Invalid MongoDB ObjectId

```bash
curl "http://localhost:8000/api/products-by-ids?ids=invalid-id"
```

**Expected Response**: Empty array or error (depends on validation)

---

### Part 5: Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "ValueScout Backend",
    "description": "API tests for Flask → Node.js migration"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/"
      }
    },
    {
      "name": "External Search",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/external-search?q=nike"
      }
    },
    {
      "name": "Add to Wishlist",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/wishlist/add",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"userId\": \"user123\", \"title\": \"Nike Shoes\", \"price\": \"₹5999\", \"source\": \"Amazon\", \"link\": \"https://amazon.in/dp/B07XYZ123\"}"
        }
      }
    },
    {
      "name": "Get Wishlist",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/wishlist/user123"
      }
    },
    {
      "name": "Remove from Wishlist",
      "request": {
        "method": "DELETE",
        "url": "{{base_url}}/api/wishlist/remove",
        "body": {
          "mode": "raw",
          "raw": "{\"userId\": \"user123\", \"link\": \"https://amazon.in/dp/B07XYZ123\"}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    }
  ]
}
```

---

## Test Execution Checklist

- [ ] Test 1.1: Server Status ✓
- [ ] Test 2.1: External Search ✓
- [ ] Test 2.2: Verify MongoDB Insert ✓
- [ ] Test 2.3: Local Product Search ✓
- [ ] Test 2.4: Fetch Products by IDs ✓
- [ ] Test 3.1: Add Item to Wishlist ✓
- [ ] Test 3.2: Try Adding Duplicate ✓
- [ ] Test 3.3: Get User's Wishlist ✓
- [ ] Test 3.4: Check if Product in Wishlist ✓
- [ ] Test 3.5: Remove from Wishlist (by link) ✓
- [ ] Test 3.6: Remove from Wishlist (by itemId) ✓
- [ ] Test 3.7: Try Removing Non-existent Item ✓
- [ ] Test 4.1: Missing Required Parameters ✓
- [ ] Test 4.2: Missing Wishlist Fields ✓
- [ ] Test 4.3: Invalid MongoDB ObjectId ✓

---

## Performance Notes

- **Search Response Time**: ~2-5 seconds (depends on SerpApi)
- **MongoDB Insert**: ~100-500ms (for 20-40 products)
- **Wishlist Operations**: ~10-50ms

---

## Common Issues & Solutions

### Issue: SerpApi Rate Limited
```
Error: SerpApi quota exceeded
```
**Solution**: Wait for quota reset or use a different API key

### Issue: Duplicate Key Error
```
Error: E11000 duplicate key error collection: value_scout.products index: link_1
```
**Solution**: This is normal when inserting the same product twice. The upsert logic handles this.

### Issue: MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB with `mongod`

### Issue: Backend Not Responding
```
curl: (7) Failed to connect
```
**Solution**: Ensure backend is running with `npm start`

---

## Next: Integration Tests

Once all unit tests pass, test the full flow:

1. **Home Page Search**
   - Enter search query on Home page
   - Should call `/api/external-search`
   - Results should appear on Compare page

2. **Add to Wishlist**
   - Click heart icon on product
   - Should call `/api/wishlist/add`
   - Should show confirmation

3. **View Wishlist**
   - Navigate to Wishlist page
   - Should call `/api/wishlist/:userId`
   - All saved items should display

4. **Remove from Wishlist**
   - Click X on wishlist item
   - Should call `/api/wishlist/remove`
   - Item should disappear

---

## Congratulations! 🎉

If all tests pass, the Flask → Node.js migration is complete!
