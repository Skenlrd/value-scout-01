#!/usr/bin/env python3
"""
Offline embedding processor.

- Connects to value_scout.products
- Finds products where styleEmbedding does not exist
- Downloads product image, computes image + text embeddings using SentenceTransformer('clip-ViT-B-32')
- Stores combined embedding as a plain Python list under styleEmbedding
"""

import io
import time
import traceback

import numpy as np
import pymongo
import requests
from PIL import Image
from sentence_transformers import SentenceTransformer

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "value_scout"
COLLECTION_NAME = "products"

MODEL_NAME = "clip-ViT-B-32"  # open-source CLIP variant supported by sentence-transformers

def get_db_collection():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    return db[COLLECTION_NAME]

def load_model():
    print("Loading model:", MODEL_NAME)
    model = SentenceTransformer(MODEL_NAME)
    return model

def download_image(url, timeout=10):
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    return Image.open(io.BytesIO(resp.content)).convert("RGB")

def compute_and_store_embeddings(products_collection, model):
    cursor = products_collection.find({"styleEmbedding": {"$exists": False}}, no_cursor_timeout=False)
    count = 0
    for product in cursor:
        try:
            print(f"Processing product {_id_short(product.get('_id'))} - {product.get('productName')}")
            image_url = product.get("imageUrl")
            product_name = product.get("productName", "")

            # Download image
            image = None
            if image_url:
                try:
                    image = download_image(image_url)
                except Exception as e:
                    print(f"Warning: failed to download image for {_id_short(product.get('_id'))}: {e}")
                    image = None

            # Compute embeddings
            image_embedding = None
            text_embedding = None

            if image is not None:
                try:
                    image_embedding = model.encode(image, convert_to_numpy=True)
                except Exception as e:
                    print(f"Warning: image embedding failed: {e}")
                    image_embedding = None

            try:
                text_embedding = model.encode(product_name, convert_to_numpy=True)
            except Exception as e:
                print(f"Warning: text embedding failed: {e}")
                text_embedding = None

            if image_embedding is None and text_embedding is None:
                print(f"Skipping {_id_short(product.get('_id'))}: no embeddings available.")
                continue

            # Combine embeddings with weights: image 0.7, text 0.3
            if image_embedding is None:
                combined = text_embedding
            elif text_embedding is None:
                combined = image_embedding
            else:
                combined = (image_embedding * 0.7) + (text_embedding * 0.3)

            # Normalize to unit vector (optional but helpful for cosine similarity)
            norm = np.linalg.norm(combined)
            if norm > 0:
                combined = combined / norm

            # Convert to plain Python list
            combined_list = combined.astype(float).tolist()

            # Update document
            products_collection.update_one(
                {"_id": product["_id"]},
                {"$set": {"styleEmbedding": combined_list, "embeddingComputedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")}},
            )
            count += 1
            print(f"Updated embedding for {_id_short(product.get('_id'))}")
        except Exception:
            print(f"Error processing product {_id_short(product.get('_id'))}:")
            traceback.print_exc()
    print(f"Finished embedding processing. Updated {count} products.")

def _id_short(_id):
    return str(_id)

def main():
    products_collection = get_db_collection()
    model = load_model()
    compute_and_store_embeddings(products_collection, model)

if __name__ == "__main__":
    main()
