#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI API Service (Flask) for ValueScout

Purpose:
- Provides AI-powered style recommendations based on product embeddings.
- Computes cosine similarity between a base product and other products.
- Returns top 5 stylistically similar products.

Endpoints:
  • GET /health
      - Simple check to ensure the API and MongoDB connection are active.
  • GET /api/style-builder/<product_id>
      - Fetch product by ID and return top 5 stylistically similar items.
"""

import os
from flask import Flask, jsonify, abort
from flask_cors import CORS
import pymongo
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables (if .env file is present)
load_dotenv()

# ---------------------------- CONFIGURATION ----------------------------

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "value_scout")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "products")
FLASK_PORT = int(os.getenv("FLASK_PORT", 5050))
FLASK_ENV = os.getenv("FLASK_ENV", "development")

app = Flask(__name__)
CORS(app)

# ---------------------------- DATABASE CONNECTION ----------------------

try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")  # health check
    print("[AI] [OK] MongoDB connection successful")
    db = client[DB_NAME]
    products_collection = db[COLLECTION_NAME]
except Exception as e:
    print(f"[AI] [ERROR] MongoDB connection failed: {e}")
    products_collection = None

# ---------------------------- OUTFIT RULES -----------------------------

OUTFIT_RULES = {
    "shoes": ["pants", "socks", "tshirt", "jacket"],
    "tshirt": ["pants", "jacket", "shoes"],
    "pants": ["tshirt", "jacket", "shoes"],
    "jacket": ["tshirt", "pants", "shoes"],
    "sneakers": ["pants", "tshirt"],
    "socks": ["shoes"],
    "default": ["shoes", "tshirt", "pants", "jacket"],
}


def get_candidate_categories(category: str):
    """Return a list of candidate categories based on outfit rules."""
    category = (category or "").lower()
    return OUTFIT_RULES.get(category, OUTFIT_RULES["default"])


# ---------------------------- ROUTES -----------------------------------

@app.route("/health", methods=["GET"])
def health_check():
    """Health endpoint to check API and DB status."""
    try:
        client.admin.command("ping")
        return jsonify({"status": "ok", "message": "AI API and MongoDB are healthy"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"MongoDB error: {e}"}), 500


@app.route("/api/style-builder/<product_id>", methods=["GET"])
def style_builder(product_id):
    """Compute stylistic similarity for a given product."""
    if products_collection is None:
        abort(500, description="Database not initialized")

    try:
        # Handle both ObjectId and string IDs
        query = {"_id": ObjectId(product_id)} if ObjectId.is_valid(product_id) else {"_id": product_id}
        input_product = products_collection.find_one(query)
    except Exception as e:
        abort(500, description=f"Error fetching product: {e}")

    if not input_product:
        abort(404, description="Product not found")

    if "styleEmbedding" not in input_product:
        abort(400, description="Base product has no styleEmbedding computed")

    try:
        input_embedding = np.array(input_product["styleEmbedding"], dtype=float).reshape(1, -1)
    except Exception:
        abort(500, description="Invalid styleEmbedding format for base product")

    category = input_product.get("category", "")
    target_categories = get_candidate_categories(category)

    cursor = products_collection.find(
        {"category": {"$in": target_categories}, "styleEmbedding": {"$exists": True}},
        {"_id": 1, "styleEmbedding": 1},
    )

    candidate_ids, candidate_embeddings = [], []

    for doc in cursor:
        emb = doc.get("styleEmbedding")
        if not emb:
            continue
        try:
            candidate_ids.append(str(doc["_id"]))
            candidate_embeddings.append(np.array(emb, dtype=float))
        except Exception:
            continue

    if not candidate_embeddings:
        return jsonify([])

    try:
        candidate_matrix = np.vstack(candidate_embeddings)
        sims = cosine_similarity(input_embedding, candidate_matrix)[0]
    except Exception as e:
        abort(500, description=f"Failed to compute similarity: {e}")

    id_score_pairs = [
        {"id": cid, "score": float(s)} for cid, s in zip(candidate_ids, sims) if cid != str(input_product["_id"])
    ]
    id_score_pairs.sort(key=lambda x: x["score"], reverse=True)

    return jsonify(id_score_pairs[:5])


# ---------------------------- ERROR HANDLER ----------------------------

@app.errorhandler(Exception)
def handle_exception(e):
    """Catch-all error handler for JSON responses."""
    code = getattr(e, "code", 500)
    return jsonify({"error": str(e)}), code


# ---------------------------- SERVER START -----------------------------

if __name__ == "__main__":
    print(f"[AI] Starting AI API on port {FLASK_PORT} (env: {FLASK_ENV})...")
    # Disable the reloader on Windows to avoid socket/thread issues
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=(FLASK_ENV == "development"), use_reloader=False)
