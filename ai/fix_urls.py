from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client["value_scout"]
products = db["products"]

all_prods = list(products.find({}, {"_id": 1, "productUrl": 1}))
fixed = 0

for p in all_prods:
    url = p["productUrl"]
    if ".com" in url and ".com/" not in url:
        # Fix missing slash
        new_url = url.replace(".comtshirts", ".com/tshirts")
        new_url = new_url.replace(".comshirts", ".com/shirts")
        new_url = new_url.replace(".comjeans", ".com/jeans")
        new_url = new_url.replace(".comtrousers", ".com/trousers")
        new_url = new_url.replace(".comsneakers", ".com/sneakers")
        new_url = new_url.replace(".comshoes", ".com/shoes")
        new_url = new_url.replace(".comhoodies", ".com/hoodies")
        new_url = new_url.replace(".comsweaters", ".com/sweaters")
        new_url = new_url.replace(".comjackets", ".com/jackets")
        new_url = new_url.replace(".comfootwear", ".com/footwear")
        new_url = new_url.replace(".comcollections", ".com/collections")
        new_url = new_url.replace(".comproduct", ".com/product")
        new_url = new_url.replace(".comproducts", ".com/products")
        
        products.update_one({"_id": p["_id"]}, {"$set": {"productUrl": new_url}})
        fixed += 1

print(f"Fixed {fixed} URLs")
