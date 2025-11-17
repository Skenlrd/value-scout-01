"""Reclassify product categories in MongoDB to correct shoe mislabels.
Run after improving scraper logic to fix existing documents where footwear was tagged as shirt/pants/etc.
"""
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["value_scout"]
coll = db["products"]

# Broad footwear indicators
SHOE_KEYWORDS = [
    "shoe", "shoes", "sneaker", "sneakers", "trainer", "trainers", "basketball", "running",
    "football", "golf", "boot", "boots", "court", "jordan"
]

query = {
    "$and": [
        {"category": {"$ne": "shoes"}},
        {"$or": [
            {"productName": {"$regex": "|".join(SHOE_KEYWORDS), "$options": "i"}},
            {"productUrl": {"$regex": "|".join(SHOE_KEYWORDS), "$options": "i"}},
        ]}
    ]
}

candidates = list(coll.find(query, {"_id": 1, "productName": 1, "category": 1}))
print(f"Found {len(candidates)} potential misclassified footwear items.")

updated = 0
for doc in candidates:
    res = coll.update_one({"_id": doc["_id"]}, {"$set": {"category": "shoes"}})
    if res.modified_count:
        updated += 1

print(f"Updated {updated} documents to category 'shoes'.")
print("Done.")
