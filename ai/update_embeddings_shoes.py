"""Update embeddings for products in category 'shoes'.
By default only processes products missing styleEmbedding.
Use --force to recompute and overwrite existing embeddings.
"""
import argparse
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from PIL import Image
import requests
from io import BytesIO
import numpy as np

parser = argparse.ArgumentParser(description="Refresh embeddings for shoes")
parser.add_argument("--force", action="store_true", help="Recompute even if styleEmbedding exists")
args = parser.parse_args()

client = MongoClient("mongodb://localhost:27017/")
db = client["value_scout"]
coll = db["products"]

print("Loading CLIP model (clip-ViT-B-32)...")
model = SentenceTransformer("clip-ViT-B-32")
print("Model loaded.\n")

# Build query
query = {"category": "shoes"}
if not args.force:
    query["styleEmbedding"] = {"$exists": False}

cursor = coll.find(query, {"_id": 1, "productName": 1, "imageUrl": 1})
items = list(cursor)
print(f"Found {len(items)} shoe products to process (force={args.force}).")

processed = 0
updated = 0
skipped = 0

for doc in items:
    processed += 1
    pid = doc["_id"]
    name = doc.get("productName", "Unnamed Product")
    img_url = doc.get("imageUrl", "")
    print(f"[{processed}/{len(items)}] {name[:60]} ...", flush=True)

    if not img_url:
        skipped += 1
        continue

    # Normalize protocol-relative
    if img_url.startswith("//"):
        img_url = "https:" + img_url

    try:
        resp = requests.get(img_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        img = Image.open(BytesIO(resp.content))
        if img.mode != "RGB":
            img = img.convert("RGB")
    except Exception as e:
        print(f"   Image download failed: {e}")
        skipped += 1
        continue

    try:
        img_emb = model.encode(img, convert_to_numpy=True)
        txt_emb = model.encode(name, convert_to_numpy=True)
        combined = (img_emb * 0.7) + (txt_emb * 0.3)
        coll.update_one({"_id": pid}, {"$set": {"styleEmbedding": combined.tolist()}})
        updated += 1
    except Exception as e:
        print(f"   Embedding generation failed: {e}")
        skipped += 1
        continue

print("\nSummary:")
print(f"Processed: {processed}")
print(f"Updated embeddings: {updated}")
print(f"Skipped (errors/no image): {skipped}")
print("Done.")
