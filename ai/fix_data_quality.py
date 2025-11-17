from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client["value_scout"]
products = db["products"]

# Delete products with missing images (can't be used anyway)
deleted_no_img = products.delete_many({"imageUrl": ""})
print(f"Deleted {deleted_no_img.deleted_count} products with missing images")

# Fix wrong prices (anything over 50k is likely wrong, set to 0 for manual review)
fixed_price = products.update_many(
    {"price": {"$gt": 50000}},
    {"$set": {"price": 0}}
)
print(f"Fixed {fixed_price.modified_count} products with wrong pricing (set to 0)")

# Summary
total = products.count_documents({})
no_price = products.count_documents({"price": 0})
print(f"\nSummary:")
print(f"Total products: {total}")
print(f"Products needing price review: {no_price}")
