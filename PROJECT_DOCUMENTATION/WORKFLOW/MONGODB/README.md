# MongoDB Workflow

Central datastore for products and AI embeddings.

## Connection
- Local URI: `mongodb://127.0.0.1:27017`
- Database: `value_scout`
- Collection: `products`

## Document Schema (flexible)
```json
{
  "_id": "myntra_<hash>|superkicks_<hash>|vegnonveg_<hash>",
  "productName": "Nike Men Fly.By Mid 3 Basketball",
  "brand": "Nike",
  "category": "shoes|tshirt|shirt|pants|shorts|hoodie|jacket|dress",
  "price": 3996,
  "imageUrl": "https://...",
  "productUrl": "https://...",
  "source": "myntra_<brand>|superkicks|vegnonveg",
  "scrapedAt": "ISODate",
  "styleEmbedding": [0.123, -0.456, ...] // 384D vector, optional
}
```

## Indexing (recommended)
- `category` (filter by target categories quickly)
- `productUrl` (guard against duplicates)
- Optional compound: `{ source: 1, productName: 1 }`

Example (mongo shell):
```javascript
db.products.createIndex({ category: 1 })
db.products.createIndex({ productUrl: 1 }, { unique: true })
```

## Typical Operations
- Insert/update via scraper upserts
- Add `styleEmbedding` via embedding generator script
- Query by ID list for frontend detail hydration

## Common Queries
```javascript
// Search by keyword
const q = "nike";
db.products.find({
  $or: [
    { productName: { $regex: q, $options: "i" } },
    { brand: { $regex: q, $options: "i" } },
    { category: { $regex: q, $options: "i" } },
    { source: { $regex: q, $options: "i" } }
  ]
}).limit(50)

// Fetch by IDs
const ids = ["myntra_...", "superkicks_..."];
db.products.find({ _id: { $in: ids } })
```

## Maintenance Tips
- Ensure Mongo is running before scraper/embedding/API
- If re-scraping resets documents, embeddings will be cleared for those items
- Backup with `mongodump` for snapshotting

## Troubleshooting
- Connection refused → ensure `mongod` is running and firewall allows local connection
- Duplicate key on `productUrl` → scraper attempted to insert same product; expected protection
