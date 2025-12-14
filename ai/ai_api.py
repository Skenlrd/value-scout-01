"""
AI Style Builder API
Provides outfit recommendations using cosine similarity on CLIP embeddings
"""

from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["value_scout"]
products_collection = db["products"]

# Outfit Category Rules
# Maps a product category to compatible categories for outfit building
OUTFIT_RULES = {
    "shoes": ["tshirt", "shirt", "pants", "jeans", "shorts", "hoodie", "jacket"],
    "tshirt": ["pants", "jeans", "shorts", "shoes"],
    "shirt": ["pants", "jeans", "shorts", "shoes"],
    "hoodie": ["pants", "jeans", "shorts", "shoes"],
    "jacket": ["pants", "jeans", "shorts", "shoes", "tshirt", "shirt"],
    "pants": ["tshirt", "shirt", "hoodie", "jacket", "shoes"],
    "jeans": ["tshirt", "shirt", "hoodie", "jacket", "shoes"],
    "shorts": ["tshirt", "shirt", "hoodie", "jacket", "shoes"],
}

@app.route('/api/style-builder/<product_id>', methods=['GET'])
def get_style_recommendations(product_id):
    """
    Get AI-powered outfit recommendations for a product
    Returns top 5 matching items based on style similarity
    """
    try:
        # STEP 1: Load input product
        input_product = products_collection.find_one({"_id": product_id})
        
        if not input_product:
            return jsonify({
                "error": "Product not found",
                "product_id": product_id
            }), 404
        
        # Check if product has embedding
        if "styleEmbedding" not in input_product:
            return jsonify({
                "error": "Product has no style embedding",
                "product_id": product_id,
                "message": "Run process_embeddings.py first"
            }), 400
        
        # STEP 2: Get input embedding
        input_embedding = np.array(input_product["styleEmbedding"]).reshape(1, -1)
        input_category = input_product.get("category", "clothing")
        
        # STEP 3: Determine target categories
        target_categories = OUTFIT_RULES.get(input_category, [])
        
        if not target_categories:
            return jsonify({
                "error": "No outfit rules for this category",
                "category": input_category,
                "available_categories": list(OUTFIT_RULES.keys())
            }), 400
        
        # STEP 4: Query candidate products
        cursor = products_collection.find(
            {
                "category": {"$in": target_categories},
                "styleEmbedding": {"$exists": True},
                "_id": {"$ne": product_id}  # Exclude input product
            },
            {
                "_id": 1,
                "styleEmbedding": 1
            }
        )
        
        # STEP 5: Build candidate lists
        candidate_ids = []
        candidate_embeddings = []
        
        for candidate in cursor:
            candidate_ids.append(candidate["_id"])
            candidate_embeddings.append(candidate["styleEmbedding"])
        
        if len(candidate_ids) == 0:
            return jsonify({
                "error": "No matching products found",
                "input_category": input_category,
                "target_categories": target_categories,
                "message": "Try scraping more products or generating more embeddings"
            }), 404
        
        # STEP 6: Convert to numpy array
        candidate_embeddings = np.array(candidate_embeddings)
        
        # STEP 7: Calculate cosine similarity
        similarities = cosine_similarity(input_embedding, candidate_embeddings)[0]
        
        # STEP 8: Sort by similarity (descending)
        sorted_indices = np.argsort(similarities)[::-1]
        
        # STEP 9: Get top 5 results
        top_5_results = []
        for idx in sorted_indices[:5]:
            top_5_results.append({
                "id": candidate_ids[idx],
                "score": float(similarities[idx])  # Convert numpy float to Python float
            })
        
        # STEP 10: Return results
        return jsonify({
            "input_product_id": product_id,
            "input_category": input_category,
            "target_categories": target_categories,
            "total_candidates": len(candidate_ids),
            "recommendations": top_5_results
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB connection
        products_count = products_collection.count_documents({})
        embeddings_count = products_collection.count_documents({"styleEmbedding": {"$exists": True}})
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "total_products": products_count,
            "products_with_embeddings": embeddings_count,
            "embedding_coverage": f"{(embeddings_count/products_count*100):.1f}%" if products_count > 0 else "0%"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@app.route('/', methods=['GET'])
def root():
    """API documentation"""
    return jsonify({
        "name": "Style Builder API",
        "version": "1.0",
        "endpoints": {
            "GET /api/style-builder/<product_id>": "Get outfit recommendations for a product",
            "GET /api/health": "Check API health and database stats",
            "GET /": "This documentation"
        },
        "outfit_rules": OUTFIT_RULES
    }), 200

if __name__ == '__main__':
    print("\n" + "="*60)
    print("Style Builder API")
    print("="*60)
    print("Server starting on http://localhost:5000")
    print("\nEndpoints:")
    print("  GET /api/style-builder/<product_id>")
    print("  GET /api/health")
    print("="*60 + "\n")
    
    host = os.getenv("AI_API_HOST", "127.0.0.1")
    port = int(os.getenv("AI_API_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"

    app.run(host=host, port=port, debug=debug)
