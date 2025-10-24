# scraper.py
from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['value_scout']
products_collection = db['products']

def scrape_myntra():
    """Mock scraper - returns sample products"""
    return [
        {
            "_id": "myntra_123456",
            "productName": "Nike Air Jordan 11",
            "price": "₹19,999",
            "imageUrl": "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
            "productUrl": "https://myntra.com/nike-air-jordan",
            "source": "Myntra",
            "category": "shoes"
        },
        {
            "_id": "myntra_789012",
            "productName": "Levi's Slim Fit Jeans",
            "price": "₹2,499",
            "imageUrl": "https://images.unsplash.com/photo-1542272604-787c3835535d",
            "productUrl": "https://myntra.com/levis-jeans",
            "source": "Myntra",
            "category": "pants"
        },
        {
            "_id": "myntra_345678",
            "productName": "Adidas Cotton T-Shirt",
            "price": "₹899",
            "imageUrl": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
            "productUrl": "https://myntra.com/adidas-tshirt",
            "source": "Myntra",
            "category": "tshirt"
        }
    ]

def main():
    print("Starting scraper...")
    products = scrape_myntra()
    
    for product in products:
        # Add scraped timestamp
        product['scrapedAt'] = datetime.utcnow()
        
        # Upsert and remove old embedding
        result = products_collection.update_one(
            {'_id': product['_id']},
            {
                '$set': product,
                '$unset': {'styleEmbedding': ''}  # Mark for reprocessing
            },
            upsert=True
        )
        
        if result.upserted_id:
            print(f"✓ Inserted: {product['productName']}")
        else:
            print(f"✓ Updated: {product['productName']}")
    
    print(f"\nScraping complete! Processed {len(products)} products.")

if __name__ == "__main__":
    main()
