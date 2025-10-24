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
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'q parameter required' });
    }
    
    const products = await Product.find({
      $or: [
        { productName: { $regex: q, $options: 'i' } },
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
