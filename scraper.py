# scraper.py
import time
import sys
from pymongo import MongoClient
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['value_scout']
products_collection = db['products']

PRODUCT_LIMIT = 10 

def setup_driver():
    """Sets up the Selenium WebDriver automatically."""
    print("Setting up Selenium WebDriver for Brave...")
    options = Options()
    
    options.binary_location = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
    
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    service = Service()
    driver = webdriver.Chrome(service=service, options=options)
    
    print("✓ WebDriver is ready.")
    return driver

def scrape_myntra_selenium(scrape_url, category):
    driver = setup_driver()
    scraped_products = []
    
    try:
        print(f"Attempting to scrape: {scrape_url}")
        driver.get(scrape_url)
        
        wait = WebDriverWait(driver, 20)
        product_list_container = wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "results-base"))
        )
        print("✓ Product page loaded.")

        driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
        time.sleep(2) 

        html_content = driver.page_source
        soup = BeautifulSoup(html_content, 'html.parser')
        
        products = soup.find_all('li', class_='product-base')
        
        if not products:
            print("✗ No product cards found. Myntra's class names might have changed.")
            return []

        print(f"✓ Found {len(products)} product cards. Processing up to {PRODUCT_LIMIT}...")

        for product in products:
            if len(scraped_products) >= PRODUCT_LIMIT:
                print(f"Reached product limit of {PRODUCT_LIMIT}.")
                break
            
            # --- NEW ROBUST LINK FINDING ---
            # Find the product name, then find its parent link
            name_tag = product.find('h4', class_='product-product')
            if not name_tag:
                 print("Skipping card, cannot find product name tag.")
                 continue
                 
            product_link_tag = name_tag.find_parent('a')
            if not product_link_tag:
                print("Skipping card, cannot find parent link tag for name.")
                continue
                
            product_link_href = product_link_tag.get('href')
            if not product_link_href:
                print("Skipping card, link tag has no href.")
                continue
            # --- END NEW LINK FINDING ---

            brand = product.find('h3', class_='product-brand')
            price_element = product.find('span', class_='product-discountedPrice')
            if not price_element:
                price_element = product.find('div', class_='product-price')
            
            image = product.find('img')
            image_url = None
            if image:
                image_url = image.get('data-src')
                if not image_url:
                    image_url = image.get('src')
            
            if not all([brand, price_element, image_url]):
                print("Skipping a card, missing brand, price, or image.")
                continue

            brand_text = brand.get_text().strip()
            name_text = name_tag.get_text().strip()
            price_text = price_element.get_text().strip().replace('Rs. ', '₹')
            
            # Use the new href variable
            product_url = "https://www.myntra.com" + product_link_href
            product_id_slug = product_link_href.split('/')[-1]
            product_id = f"myntra_{product_id_slug}"
            
            scraped_products.append({
                "_id": product_id,
                "productName": f"{brand_text} - {name_text}",
                "price": price_text,
                "imageUrl": image_url,
                "productUrl": product_url,
                "source": "Myntra",
                "brand": brand_text,
                "category": category
            })
            
        return scraped_products

    except Exception as e:
        print(f"✗ An unexpected error occurred during scraping: {e}")
        return []
    finally:
        driver.quit()

def main():
    if len(sys.argv) != 3:
        print("Error: You must provide a URL slug and a category name.")
        print("Example: py scraper.py nike-sneakers shoes")
        print("Example: py scraper.py nike-tshirts tshirts")
        return

    url_slug = sys.argv[1]
    category = sys.argv[2]
    scrape_url = f"https://www.myntra.com/{url_slug}"

    print(f"--- Starting Selenium Scraper for category: {category} ---")
    
    products = scrape_myntra_selenium(scrape_url, category)
    
    if not products:
        print("Scraping failed or found no products. Exiting.")
        return

    for product in products:
        product['scrapedAt'] = datetime.now(timezone.utc)
        
        result = products_collection.update_one(
            {'_id': product['_id']},
            {
                '$set': product,
                '$unset': {'styleEmbedding': ''}
            },
            upsert=True
        )
    
    print(f"\n--- Scraping complete! Processed {len(products)} {category}. ---")

if __name__ == "__main__":
    main()