#!/usr/bin/env python3
"""
Offline scraper placeholder.

- Connects to MongoDB value_scout.products
- Provides placeholder scrape_* functions
- Inserts/updates a set of mock products and ensures styleEmbedding is removed ($unset)
"""

import datetime
import pymongo
import requests
from bs4 import BeautifulSoup  # placeholder for future scraping

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "value_scout"
COLLECTION_NAME = "products"

def get_db_collection():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    return db[COLLECTION_NAME]

def scrape_myntra():
    # placeholder scraping logic for Myntra
    # return list of dict product documents if implemented
    return []

def scrape_superkicks():
    # placeholder scraping logic for Superkicks
    return []

def scrape_vegnonveg():
    # placeholder scraping logic for VegNonVeg
    return []

def make_mock_products():
    now = datetime.datetime.utcnow().isoformat() + "Z"
    return [
        {
            "_id": "myntra_001",
            "productName": "Nike Air Zoom Pegasus - Men's Running Shoes",
            "brand": "Nike",
            "category": "shoes",
            "price": 9999,
            "imageUrl": "https://example.com/images/nike_pegasus.jpg",
            "productUrl": "https://www.myntra.com/nike/pegasus",
            "source": "Myntra",
            "scrapedAt": now,
        },
        {
            "_id": "superkicks_001",
            "productName": "Adidas UltraBoost Running Shoes",
            "brand": "Adidas",
            "category": "shoes",
            "price": 11999,
            "imageUrl": "https://example.com/images/adidas_ultraboost.jpg",
            "productUrl": "https://www.superkicks.com/adidas/ultraboost",
            "source": "Superkicks",
            "scrapedAt": now,
        },
        {
            "_id": "vegnonveg_001",
            "productName": "VegNonVeg Classic Tee",
            "brand": "VegNonVeg",
            "category": "tshirt",
            "price": 699,
            "imageUrl": "https://example.com/images/vnv_tee.jpg",
            "productUrl": "https://www.vegnonveg.com/classic-tee",
            "source": "VegNonVeg",
            "scrapedAt": now,
        },
        {
            "_id": "myntra_002",
            "productName": "Adidas Essentials Track Pants",
            "brand": "Adidas",
            "category": "pants",
            "price": 2499,
            "imageUrl": "https://example.com/images/adidas_pants.jpg",
            "productUrl": "https://www.myntra.com/adidas/track-pants",
            "source": "Myntra",
            "scrapedAt": now,
        },
        {
            "_id": "superkicks_002",
            "productName": "Puma Casual Sneakers",
            "brand": "Puma",
            "category": "shoes",
            "price": 4999,
            "imageUrl": "https://example.com/images/puma_sneakers.jpg",
            "productUrl": "https://www.superkicks.com/puma/casual-sneakers",
            "source": "Superkicks",
            "scrapedAt": now,
        },
        {
            "_id": "vegnonveg_002",
            "productName": "VegNonVeg Bomber Jacket",
            "brand": "VegNonVeg",
            "category": "jacket",
            "price": 3999,
            "imageUrl": "https://example.com/images/vnv_jacket.jpg",
            "productUrl": "https://www.vegnonveg.com/bomber-jacket",
            "source": "VegNonVeg",
            "scrapedAt": now,
        },
    ]

def upsert_products(products_collection, products):
    for p in products:
        # Remove any existing styleEmbedding so downstream processor will recompute embeddings
        update_doc = {
            "$set": {
                "productName": p.get("productName"),
                "brand": p.get("brand"),
                "category": p.get("category"),
                "price": p.get("price"),
                "imageUrl": p.get("imageUrl"),
                "productUrl": p.get("productUrl"),
                "source": p.get("source"),
                "scrapedAt": p.get("scrapedAt"),
            },
            "$unset": {"styleEmbedding": ""},  # crucial: drop existing embedding
        }
        result = products_collection.update_one({"_id": p["_id"]}, update_doc, upsert=True)
        print(f"Upserted {_id_summary(p['_id'])}, matched={{result.matched_count}}, modified={{result.modified_count}}")

def _id_summary(_id):
    return f"{_id}"

def main():
    products_collection = get_db_collection()

    # collect mocked products
    mock_products = make_mock_products()

    # placeholders for actual scrape functions - left intentionally but unused for offline run
    # myntra_products = scrape_myntra()
    # superkicks_products = scrape_superkicks()
    # vegnonveg_products = scrape_vegnonveg()

    # For offline usage, use the mock list
    upsert_products(products_collection, mock_products)
    print("Finished upserting mock products.")

if __name__ == "__main__":
    main()
