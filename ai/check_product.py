from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["value_scout"]
products = db["products"]

product_id = "myntra_322182294519045115"

product = products.find_one({"_id": product_id})

if product:
    print(f"✅ Product FOUND: {product_id}")
    print(f"Name: {product.get('productName')}")
    print(f"Category: {product.get('category')}")
    print(f"Has embedding: {'styleEmbedding' in product}")
else:
    print(f"❌ Product NOT FOUND: {product_id}")
    print("\nSearching for similar IDs...")
    similar = list(products.find({"_id": {"$regex": "322182294519045115"}}).limit(5))
    if similar:
        print(f"Found {len(similar)} similar products:")
        for p in similar:
            print(f"  - {p['_id']}")
    else:
        print("No similar IDs found")
