// main_api_server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/value_scout', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define Product Schema
const productSchema = new mongoose.Schema({
  _id: String,
  productName: String,
  price: String,
  imageUrl: String,
  productUrl: String,
  source: String,
  category: String,
  scrapedAt: Date,
  styleEmbedding: [Number]
}, { collection: 'products', strict: false });

const Product = mongoose.model('Product', productSchema);

// Get products by IDs
app.get('/api/products-by-ids', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter required' });
    }
    
    const idArray = ids.split(',').map(id => id.trim());
    const products = await Product.find({ '_id': { $in: idArray } });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products
// NOTE: For better performance, create a text index in MongoDB:
// db.products.createIndex({ productName: "text", brand: "text", category: "text" })
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'q parameter required' });
    }
    
    // Try text search first (requires text index)
    try {
      const products = await Product.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(20);
      
      if (products.length > 0) {
        return res.json(products);
      }
    } catch (textSearchError) {
      // Fallback to regex if text index doesn't exist
      console.log('Text index not available, using regex search');
    }
    
    // Fallback: regex search
    const products = await Product.find({
      $or: [
        { productName: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Main API running on http://localhost:${PORT}`);
});
