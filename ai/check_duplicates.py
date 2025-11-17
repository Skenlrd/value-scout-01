from pymongo import MongoClient
from collections import Counter

client = MongoClient("mongodb://127.0.0.1:27017")
db = client["value_scout"]
col = db["products"]

urls = [d.get("productUrl") for d in col.find({}, {"productUrl": 1}) if d.get("productUrl")]
images = [d.get("imageUrl") for d in col.find({}, {"imageUrl": 1}) if d.get("imageUrl")]

url_counts = Counter(urls)
img_counts = Counter(images)

dup_url = [(u, c) for u, c in url_counts.items() if c > 1]
dup_img = [(u, c) for u, c in img_counts.items() if c > 3]

print(f"Total products: {col.count_documents({})}")
print(f"Duplicate productUrl entries: {len(dup_url)}")
if dup_url[:5]:
    print("Examples (first 5):")
    for u, c in dup_url[:5]:
        print(f"  {c}x -> {u}")

print(f"Heavily duplicated imageUrl entries (>3): {len(dup_img)}")
if dup_img[:5]:
    print("Examples (first 5):")
    for u, c in dup_img[:5]:
        print(f"  {c}x -> {u}")
