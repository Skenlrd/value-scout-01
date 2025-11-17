from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client["value_scout"]
col = db["products"]

print("Scanning duplicates by productUrl ...")

dups = {}
for doc in col.find({}, {"_id":1, "productUrl":1, "scrapedAt":1}).sort("scrapedAt", -1):
    url = doc.get("productUrl")
    if not url:
        continue
    if url not in dups:
        dups[url] = doc["_id"]
    else:
        col.delete_one({"_id": doc["_id"]})

print("De-duplication complete.")
print(f"Total remaining products: {col.count_documents({})}")
