import sys
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
MONGODB_URI = os.getenv(
    "MONGODB_URI", "mongodb://localhost:27017/"
)  # Use environment variable or default
DB_NAME = "value_scout"
COLLECTION_NAME = "products"
SITE_NAME = "myntra"
PRODUCT_LIMIT = 10  # Limit the number of products to scrape per run

# MongoDB Connection
try:
    client = MongoClient(MONGODB_URI, server_api=ServerApi("1"))
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    # Send a ping to confirm a successful connection
    client.admin.command("ping")
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    sys.exit(1)


def scrape_myntra(url_slug, category_name):
    """
    Scrapes product data from a Myntra category page.
    """
    url = f"https://www.myntra.com/{url_slug}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return

    soup = BeautifulSoup(response.content, "html.parser")
    products = soup.find_all("li", class_="product-base")

    if not products:
        print(f"No products found on {url}. Check selector or page structure.")
        return

    print(f"Found {len(products)} products. Processing first {PRODUCT_LIMIT}...")

    for product in products[:PRODUCT_LIMIT]:
        product_link_tag = product.find("a")
        product_link = (
            product_link_tag["href"] if product_link_tag else None
        )

        product_brand_tag = product.find("h3", class_="product-brand")
        product_brand = (
            product_brand_tag.get_text(strip=True) if product_brand_tag else "N/A"
        )

        product_name_tag = product.find("h4", class_="product-product")
        product_name = (
            product_name_tag.get_text(strip=True) if product_name_tag else "N/A"
        )

        product_price_tag = product.find("span", class_="product-discountedPrice")
        if not product_price_tag:
            product_price_tag = product.find(
                "div", class_="product-price"
            )  # Fallback
        
        product_price = "N/A"
        if product_price_tag:
            price_text = product_price_tag.get_text(strip=True)
            # Clean price text (e.g., "Rs. 1234")
            product_price = price_text.replace("Rs.", "").strip()


        image_tag = product.find("img", class_="img-responsive")
        image_url = image_tag["src"] if image_tag and "src" in image_tag.attrs else None
        
        # --- FIX IS HERE ---
        product_id = None  # Start with None instead of "buy"
        if product_link:
            try:
                # Extract the last part of the URL path
                product_id = product_link.split("/")[-1]
                
                # Ensure product_id is not empty or a default value
                if not product_id or product_id == "buy":
                    print(f"Parsed invalid product_id '{product_id}' from link: {product_link}")
                    product_id = None
            except Exception as e:
                print(f"Error parsing product link {product_link}: {e}")
                product_id = None
        
        # If we couldn't get a unique ID, skip this product
        if not product_id:
            print(f"Could not find a unique product ID. Skipping product: {product_name} ({product_brand})")
            continue  # Skip to the next product
        
        # --- END OF FIX ---

        product_data = {
            "name": product_name,
            "brand": product_brand,
            "price": product_price,
            "product_link": product_link,
            "image_url": image_url,
            "category": category_name,  # Add category
            "site": SITE_NAME,
            "scraped_at": datetime.utcnow(),
        }

        try:
            # Use update_one with upsert=True to insert or update the product
            # The _id will now be unique (e.g., "myntra_12345")
            collection.update_one(
                {"_id": f"{SITE_NAME}_{product_id}"},
                {"$set": product_data},
                upsert=True,
            )
            print(f"Upserted product: {SITE_NAME}_{product_id}")
        except Exception as e:
            print(f"Error upserting product {SITE_NAME}_{product_id} to MongoDB: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scraper.py <url_slug> <category_name>")
        print("Example: python scraper.py nike-tshirts tshirts")
        sys.exit(1)

    url_slug_to_scrape = sys.argv[1]
    category_name_to_assign = sys.argv[2]
    scrape_myntra(url_slug_to_scrape, category_name_to_assign)

    print("Scraping complete.")