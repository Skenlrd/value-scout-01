#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flask import Flask, jsonify, abort
from flask_cors import CORS
import pymongo
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# ---------------------------- CONFIG ----------------------------

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "value_scout")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "products")
FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
FLASK_ENV = os.getenv("FLASK_ENV", "development")

app = Flask(__name__)
CORS(app)

# ---------------------------- DB CONNECTION ----------------------

try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    print("[AI] MongoDB connection successful")
    db = client[DB_NAME]
    products = db[COLLECTION_NAME]
except Exception as e:
    print(f"[AI] ERROR connecting to MongoDB: {e}")
    products = None

# ---------------------------- OUTFIT RULES -----------------------

OUTFIT_RULES = {
    "shoes": ["pants", "tshirt", "jacket"],
    "tshirt": ["pants", "shoes"],
    "pants": ["tshirt", "shoes"],
    "jacket": ["tshirt", "pants"],
    "sneakers": ["pants", "tshirt"],
    "default": ["tshirt", "pants", "shoes", "jacket"]
}

def get_target_categories(category):
    category = (category or "").lower()
    return OUTFIT_RULES.get(category, OUTFIT_RULES["default"])

# ---------------------------- ROUTES -----------------------------

@app.route("/health", methods=["GET"])
def health():
    """Simple health endpoint."""
    try:
        client.admin.command("ping")
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"status": "mongo-error", "error": str(e)}), 500


@app.route("/api/style-builder/<product_id>", methods=["GET"])
def style_builder(product_id):
    """Merged version of your simple code + enterprise logic."""
    
    try:
        print(f"[AI] Style builder request for product_id: {product_id}")

        if products is None:
            abort(500, "Database not initialized")

        # Allow both ObjectId and string IDs
        try:
            if ObjectId.is_valid(product_id):
                query = {"_id": ObjectId(product_id)}
            else:
                query = {"_id": product_id}
        except Exception as e:
            print(f"[AI] Error parsing product_id: {e}")
            query = {"_id": product_id}

        # 1. Get base product
        base = products.find_one(query)
        if not base:
            print(f"[AI] Product not found: {product_id}")
            abort(404, description="Product not found")

        if "styleEmbedding" not in base:
            print(f"[AI] No embedding for product: {product_id}")
            abort(400, description="No embedding for this product")

        # Turn into numpy vector
        try:
            input_embed = np.array(base["styleEmbedding"], dtype=float).reshape(1, -1)
        except Exception as e:
            print(f"[AI] Invalid embedding format: {e}")
            abort(500, "Invalid embedding format")

        # 2. Determine target categories
        target_categories = get_target_categories(base.get("category", ""))
        print(f"[AI] Target categories: {target_categories}")

        # 3. Fetch candidate items
        cursor = products.find(
            {
                "category": {"$in": target_categories},
                "styleEmbedding": {"$exists": True}
            },
            {"_id": 1, "styleEmbedding": 1}
        )

        candidate_ids = []
        candidate_embeds = []

        for doc in cursor:
            emb = doc.get("styleEmbedding")
            if not emb:
                continue
            try:
                candidate_ids.append(str(doc["_id"]))
                candidate_embeds.append(np.array(emb, dtype=float))
            except Exception:
                continue

        print(f"[AI] Found {len(candidate_embeds)} candidate products")

        if not candidate_embeds:
            return jsonify({"recommendations": []})

        # 4. Compute cosine similarity
        matrix = np.vstack(candidate_embeds)
        sims = cosine_similarity(input_embed, matrix)[0]

        # 5. Build sorted result
        pairs = [{"id": cid, "score": float(score)} for cid, score in zip(candidate_ids, sims)]

        # Remove itself
        pairs = [p for p in pairs if p["id"] != str(base["_id"])]

        # Sort desc
        pairs.sort(key=lambda x: x["score"], reverse=True)

        print(f"[AI] Returning {len(pairs[:5])} recommendations")

        # Return top 5
        return jsonify({"recommendations": pairs[:5]})
    
    except Exception as e:
        print(f"[AI] EXCEPTION in style_builder: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------------------- GLOBAL ERROR HANDLER ----------------------------

@app.errorhandler(Exception)
def error_handler(e):
    code = getattr(e, "code", 500)
    return jsonify({"error": str(e)}), code


# ---------------------------- START SERVER ----------------------------

if __name__ == "__main__":
    print(f"[AI] Starting AI API on port {FLASK_PORT}...")
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=(FLASK_ENV == "development"), use_reloader=False)
