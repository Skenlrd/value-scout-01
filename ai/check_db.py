from pymongo import MongoClient
import pprint

client = MongoClient("mongodb://localhost:27017")
db = client["value_scout"]
products = db["products"]

total = products.count_documents({})
no_embedding = products.count_documents({"styleEmbedding": {"$exists": False}})
with_embedding = products.count_documents({"styleEmbedding": {"$exists": True}})

print(f"Total products: {total}")
print(f"With embeddings: {with_embedding}")
print(f"Without embeddings: {no_embedding}")

print("\n--- Sample product WITHOUT embedding ---")
sample_no_emb = products.find_one({"styleEmbedding": {"$exists": False}})
if sample_no_emb:
    print(f"ID: {sample_no_emb.get('_id')}")
    print(f"Name: {sample_no_emb.get('productName')}")
    print(f"Image: {sample_no_emb.get('imageUrl')}")
    print(f"Has styleEmbedding: {'styleEmbedding' in sample_no_emb}")
else:
    print("None found")

print("\n--- Sample product WITH embedding ---")
sample_with_emb = products.find_one({"styleEmbedding": {"$exists": True}})
if sample_with_emb:
    print(f"ID: {sample_with_emb.get('_id')}")
    print(f"Name: {sample_with_emb.get('productName')}")
    print(f"Embedding length: {len(sample_with_emb.get('styleEmbedding', []))}")
else:
    print("None found")
