from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["value_scout"]
products = db["products"]

# Count before
count_before = products.count_documents({})
print(f"Products before deletion: {count_before}")

# Delete all
result = products.delete_many({})
print(f"Deleted {result.deleted_count} products")

# Verify
count_after = products.count_documents({})
print(f"Products after deletion: {count_after}")
print("✅ Database cleared!")
