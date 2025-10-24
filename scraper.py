# scraper.py
from pymongo import MongoClient
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import time

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['value_scout']
products_collection = db['products']

# User-Agent to avoid blocking
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def categorize_product(name):
    """Determine category from product name"""
    name_lower = name.lower()
    if any(word in name_lower for word in ['shoe', 'sneaker', 'boot', 'jordan', 'air force', 'dunk']):
        return 'shoes'
    elif any(word in name_lower for word in ['jean', 'pant', 'trouser', 'jogger']):
        return 'pants'
    elif any(word in name_lower for word in ['tshirt', 't-shirt', 'tee', 'polo']):
        return 'tshirt'
    elif any(word in name_lower for word in ['shirt', 'hoodie', 'sweatshirt']):
        return 'shirt'
    elif any(word in name_lower for word in ['jacket', 'coat', 'bomber']):
        return 'jacket'
    elif any(word in name_lower for word in ['sock']):
        return 'socks'
    return 'other'

def extract_brand(name):
    """Extract brand from product name"""
    brands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans', 'Jordan']
    for brand in brands:
        if brand.lower() in name.lower():
            return brand
    return 'Unknown'

def scrape_myntra():
    """Scrape Nike and Adidas products from Myntra"""
    print("\n🛍️  Scraping Myntra...")
    
    # NOTE: These are placeholder URLs and selectors
    # Real implementation would need actual product listing URLs
    search_urls = [
        "https://www.myntra.com/nike?rawQuery=nike",
        "https://www.myntra.com/adidas?rawQuery=adidas"
    ]
    
    products = []
    
    # MOCK DATA - Replace with actual scraping when running
    mock_products = [
        {
            "_id": "myntra_nike_001",
            "productName": "Nike Air Force 1 '07",
            "brand": "Nike",
            "category": "shoes",
            "price": "₹8,995",
            "imageUrl": "https://images.unsplash.com/photo-1549298916-b41d501d3772",
            "productUrl": "https://www.myntra.com/casual-shoes/nike/nike-men-white-air-force-1-07-sneakers/1234567",
            "source": "Myntra"
        },
        {
            "_id": "myntra_adidas_001",
            "productName": "Adidas Originals Superstar",
            "brand": "Adidas",
            "category": "shoes",
            "price": "₹7,999",
            "imageUrl": "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb",
            "productUrl": "https://www.myntra.com/casual-shoes/adidas/adidas-originals-men-white-superstar-sneakers/2345678",
            "source": "Myntra"
        },
        {
            "_id": "myntra_nike_002",
            "productName": "Nike Dri-FIT T-shirt",
            "brand": "Nike",
            "category": "tshirt",
            "price": "₹1,495",
            "imageUrl": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
            "productUrl": "https://www.myntra.com/tshirts/nike/nike-men-black-dri-fit-tshirt/3456789",
            "source": "Myntra"
        }
    ]
    
    # TODO: Implement actual scraping
    # for url in search_urls:
    #     try:
    #         response = requests.get(url, headers=HEADERS, timeout=10)
    #         soup = BeautifulSoup(response.content, 'html.parser')
    #         
    #         # Example selectors (these will need to be updated based on actual site structure)
    #         product_cards = soup.select('.product-base')
    #         
    #         for card in product_cards[:20]:  # Limit to 20 products per search
    #             try:
    #                 name = card.select_one('.product-product').text.strip()
    #                 price = card.select_one('.product-discountedPrice').text.strip()
    #                 image = card.select_one('img')['src']
    #                 link = "https://www.myntra.com" + card.select_one('a')['href']
    #                 
    #                 product_id = link.split('/')[-1]
    #                 
    #                 products.append({
    #                     "_id": f"myntra_{product_id}",
    #                     "productName": name,
    #                     "brand": extract_brand(name),
    #                     "category": categorize_product(name),
    #                     "price": price,
    #                     "imageUrl": image,
    #                     "productUrl": link,
    #                     "source": "Myntra"
    #                 })
    #             except Exception as e:
    #                 continue
    #         
    #         time.sleep(2)  # Be respectful
    #     except Exception as e:
    #         print(f"Error scraping Myntra: {e}")
    
    return mock_products

def scrape_superkicks():
    """Scrape Nike and Adidas sneakers from Superkicks"""
    print("\n👟 Scraping Superkicks...")
    
    # MOCK DATA
    mock_products = [
        {
            "_id": "superkicks_001",
            "productName": "Nike Air Jordan 1 Retro High",
            "brand": "Nike",
            "category": "shoes",
            "price": "₹12,995",
            "imageUrl": "https://images.unsplash.com/photo-1556906781-9a412961c28c",
            "productUrl": "https://www.superkicks.in/product/nike-air-jordan-1-retro-high",
            "source": "Superkicks"
        },
        {
            "_id": "superkicks_002",
            "productName": "Adidas Yeezy Boost 350 V2",
            "brand": "Adidas",
            "category": "shoes",
            "price": "₹19,999",
            "imageUrl": "https://images.unsplash.com/photo-1600269452121-4f2416e55c28",
            "productUrl": "https://www.superkicks.in/product/adidas-yeezy-boost-350",
            "source": "Superkicks"
        }
    ]
    
    # TODO: Implement actual scraping
    # base_url = "https://www.superkicks.in"
    # search_urls = [
    #     f"{base_url}/collections/nike",
    #     f"{base_url}/collections/adidas"
    # ]
    
    return mock_products

def scrape_vegnonveg():
    """Scrape Nike and Adidas products from VegNonVeg"""
    print("\n🔥 Scraping VegNonVeg...")
    
    # MOCK DATA
    mock_products = [
        {
            "_id": "vegnonveg_001",
            "productName": "Nike SB Dunk Low Pro",
            "brand": "Nike",
            "category": "shoes",
            "price": "₹9,995",
            "imageUrl": "https://images.unsplash.com/photo-1608231387042-66d1773070a5",
            "productUrl": "https://www.vegnonveg.com/product/nike-sb-dunk-low-pro",
            "source": "VegNonVeg"
        },
        {
            "_id": "vegnonveg_002",
            "productName": "Adidas Samba Classic",
            "brand": "Adidas",
            "category": "shoes",
            "price": "₹8,499",
            "imageUrl": "https://images.unsplash.com/photo-1552346154-21d32810aba3",
            "productUrl": "https://www.vegnonveg.com/product/adidas-samba-classic",
            "source": "VegNonVeg"
        }
    ]
    
    # TODO: Implement actual scraping
    # base_url = "https://www.vegnonveg.com"
    
    return mock_products

def save_products(products):
    """Save products to MongoDB"""
    count = 0
    for product in products:
        product['scrapedAt'] = datetime.utcnow()
        
        result = products_collection.update_one(
            {'_id': product['_id']},
            {
                '$set': product,
                '$unset': {'styleEmbedding': ''}  # Remove old embedding for reprocessing
            },
            upsert=True
        )
        
        if result.upserted_id:
            print(f"  ✓ Inserted: {product['productName']} ({product['source']})")
        else:
            print(f"  ✓ Updated: {product['productName']} ({product['source']})")
        count += 1
    
    return count

def main():
    print("=" * 60)
    print("🚀 ValueScout Product Scraper")
    print("=" * 60)
    
    all_products = []
    
    # Scrape all sources
    all_products.extend(scrape_myntra())
    all_products.extend(scrape_superkicks())
    all_products.extend(scrape_vegnonveg())
    
    # Save to database
    print(f"\n💾 Saving {len(all_products)} products to MongoDB...")
    count = save_products(all_products)
    
    print("\n" + "=" * 60)
    print(f"✅ Scraping complete! Processed {count} products.")
    print("=" * 60)
    print("\n💡 Next step: Run 'python process_embeddings.py' to generate AI embeddings")

if __name__ == "__main__":
    main()
