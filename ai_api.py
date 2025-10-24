# ai_api.py
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['value_scout']
products_collection = db['products']

# Outfit matching rules
OUTFIT_RULES = {
    "shoes": ["pants", "socks", "tshirt"],
    "pants": ["shoes", "tshirt", "shirt"],
    "tshirt": ["pants", "shoes", "jacket"],
    "shirt": ["pants", "shoes"],
    "jacket": ["tshirt", "pants", "shoes"],
    "socks": ["shoes", "pants"]
}

@app.route('/api/style-builder/<product_id>', methods=['GET'])
def get_recommendations(product_id):
    try:
        # Find the input product
        input_product = products_collection.find_one({'_id': product_id})
        
        if not input_product:
            return jsonify({'error': 'Product not found'}), 404
        
        if 'styleEmbedding' not in input_product:
            return jsonify({'error': 'Product has no embedding'}), 400
        
        # Get input embedding
        input_embedding = np.array(input_product['styleEmbedding']).reshape(1, -1)
        
        # Get target categories
        category = input_product.get('category', '')
        target_categories = OUTFIT_RULES.get(category, [])
        
        if not target_categories:
            return jsonify({'recommendations': []})
        
        # Query candidates
        candidates = list(products_collection.find(
            {
                'category': {'$in': target_categories},
                'styleEmbedding': {'$exists': True},
                '_id': {'$ne': product_id}  # Exclude the input product
            },
            {'_id': 1, 'styleEmbedding': 1}
        ))
        
        if not candidates:
            return jsonify({'recommendations': []})
        
        # Calculate similarities
        candidate_ids = [c['_id'] for c in candidates]
        candidate_embeddings = np.array([c['styleEmbedding'] for c in candidates])
        
        similarities = cosine_similarity(input_embedding, candidate_embeddings)[0]
        
        # Get top 5
        top_indices = np.argsort(similarities)[-5:][::-1]
        
        recommendations = [
            {
                'id': candidate_ids[idx],
                'score': float(similarities[idx])
            }
            for idx in top_indices
        ]
        
        return jsonify({'recommendations': recommendations})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting AI API on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
