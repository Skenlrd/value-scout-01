#!/usr/bin/env python3
"""
AI API service (Flask)

- GET /api/style-builder/<product_id>
  - Finds the product and its styleEmbedding
  - Uses OUTFIT_RULES to determine candidate categories
  - Computes cosine similarity vs candidate product embeddings
  - Returns top 5 product ids with scores
"""

from flask import Flask, jsonify, abort
from flask_cors import CORS
import pymongo
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "value_scout"
COLLECTION_NAME = "products"

app = Flask(__name__)
CORS(app)

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]
products_collection = db[COLLECTION_NAME]

# Outfit composition rules - expand as needed
OUTFIT_RULES = {
    "shoes": ["pants", "socks", "tshirt", "jacket"],
    "tshirt": ["pants", "jacket", "shoes"],
    "pants": ["tshirt", "jacket", "shoes"],
    "jacket": ["tshirt", "pants", "shoes"],
    "sneakers": ["pants", "tshirt"],
    "socks": ["shoes"],
    # default fallback categories (if a category not in rules)
    "default": ["shoes", "tshirt", "pants", "jacket"],
}

def get_candidate_categories(category):
    return OUTFIT_RULES.get(category, OUTFIT_RULES["default"])

@app.route("/api/style-builder/<product_id>", methods=["GET"])
def style_builder(product_id):
    # Find base product
    input_product = products_collection.find_one({"_id": product_id})
    if not input_product:
        abort(404, description="Product not found")

    if "styleEmbedding" not in input_product:
        abort(400, description="Base product has no styleEmbedding computed")

    try:
        input_embedding = np.array(input_product["styleEmbedding"], dtype=float).reshape(1, -1)
    except Exception:
        abort(500, description="Invalid embedding for base product")

    category = input_product.get("category", "")
    target_categories = get_candidate_categories(category)

    # Query candidate products with minimal projection for memory efficiency
    # Only select products in target_categories and that have styleEmbedding
    cursor = products_collection.find(
        {"category": {"$in": target_categories}, "styleEmbedding": {"$exists": True}},
        {"_id": 1, "styleEmbedding": 1},
    )

    candidate_ids = []
    candidate_embeddings = []
    for doc in cursor:
        emb = doc.get("styleEmbedding")
        if not emb:
            continue
        try:
            candidate_ids.append(doc["_id"])
            candidate_embeddings.append(np.array(emb, dtype=float))
        except Exception:
            continue

    if not candidate_embeddings:
        return jsonify([])

    # Stack embeddings and compute cosine similarity
    try:
        candidate_matrix = np.vstack(candidate_embeddings)
        # cosine_similarity returns shape (1, N)
        sims = cosine_similarity(input_embedding, candidate_matrix)[0]
    except Exception as e:
        abort(500, description=f"Failed to compute similarity: {e}")

    # Build list of (id, score) and sort by score desc
    id_score_pairs = [{"id": cid, "score": float(s)} for cid, s in zip(candidate_ids, sims)]
    id_score_pairs.sort(key=lambda x: x["score"], reverse=True)

    # Exclude the base product itself if present
    id_score_pairs = [p for p in id_score_pairs if p["id"] != product_id]

    # Return top 5
    top_k = id_score_pairs[:5]
    return jsonify(top_k)

if __name__ == "__main__":
    print("Starting AI API on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
