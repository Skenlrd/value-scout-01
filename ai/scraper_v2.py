from playwright.sync_api import sync_playwright
from pymongo import MongoClient
import datetime
import time
import random

# -----------------------------
# DB SETUP
# -----------------------------
client = MongoClient("mongodb://127.0.0.1:27017")
db = client["value_scout"]
products = db["products"]

def save(product):
    """Save product to MongoDB"""
    products.update_one(
        {"_id": product["_id"]},
        {"$set": product, "$unset": {"styleEmbedding": ""}},
        upsert=True
    )
    print(f"  ✓ Saved: {product['productName'][:50]}")

def get_browser(p):
    return p.chromium.launch(
        headless=False,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--no-sandbox",
        ]
    )

def get_context(browser):
    return browser.new_context(
        viewport={"width": 1280, "height": 900},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    )

# =============================================================
# 1) SCRAPE NIKE SHOES FROM MYNTRA
# =============================================================
def scrape_nike_shoes(pages=10):
    print("\n🔵 Scraping Nike Shoes from Myntra")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        for i in range(1, pages+1):
            url = f"https://www.myntra.com/nike-shoes?p={i}"
            print(f"\n➡ Page {i}: {url}")

            try:
                page.goto(url, timeout=90000, wait_until="domcontentloaded")
                page.wait_for_selector("li.product-base", timeout=20000)
            except Exception as e:
                print(f"  ❌ Error: {e}")
                continue

            items = page.query_selector_all("li.product-base")
            print(f"  ✔ Found {len(items)} items")

            for item in items:
                try:
                    brand = item.query_selector("h3.product-brand")
                    name = item.query_selector("h4.product-product")
                    
                    if not brand or not name:
                        continue
                        
                    brand_text = brand.inner_text().strip()
                    name_text = name.inner_text().strip()

                    img_elem = item.query_selector("img")
                    img = img_elem.get_attribute("src") if img_elem else ""
                    if img and img.startswith("//"):
                        img = "https:" + img

                    link_elem = item.query_selector("a")
                    link = link_elem.get_attribute("href") if link_elem else ""
                    if link and not link.startswith("http"):
                        link = "https://www.myntra.com" + link

                    price_el = item.query_selector(".product-discountedPrice")
                    price = price_el.inner_text().strip() if price_el else "N/A"

                    if link:  # Only save if we have a valid link
                        doc = {
                            "_id": f"myntra_nike_{hash(link)}",
                            "productName": f"{brand_text} {name_text}",
                            "brand": brand_text,
                            "category": "shoes",
                            "price": price,
                            "imageUrl": img,
                            "productUrl": link,
                            "source": "Myntra",
                            "scrapedAt": datetime.datetime.utcnow(),
                        }
                        save(doc)

                except Exception as e:
                    print(f"  ⚠ Skip item: {e}")

            time.sleep(random.uniform(2, 3))

        browser.close()

# =============================================================
# 2) SCRAPE H&M CLOTHING FROM MYNTRA
# =============================================================
def scrape_hm_clothing(category, pages=20):
    """Scrape H&M clothing from Myntra"""
    print(f"\n🟣 Scraping H&M {category} from Myntra")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        for i in range(1, pages + 1):
            url = f"https://www.myntra.com/{category}?f=Brand%3AH%26M&p={i}"
            print(f"\n➡ Page {i}: {url}")

            try:
                page.goto(url, timeout=90000)
                page.wait_for_selector("li.product-base", timeout=20000)
            except Exception as e:
                print(f"  ❌ Error: {e}")
                continue

            items = page.query_selector_all("li.product-base")
            print(f"  ✔ Found {len(items)} items")

            for item in items:
                try:
                    brand = item.query_selector("h3.product-brand")
                    name = item.query_selector("h4.product-product")
                    
                    if not brand or not name:
                        continue
                        
                    brand_text = brand.inner_text().strip()
                    name_text = name.inner_text().strip()

                    img_elem = item.query_selector("img")
                    img = img_elem.get_attribute("src") if img_elem else ""
                    if img and img.startswith("//"):
                        img = "https:" + img

                    link_elem = item.query_selector("a")
                    link = link_elem.get_attribute("href") if link_elem else ""
                    if link and not link.startswith("http"):
                        link = "https://www.myntra.com" + link

                    price_el = item.query_selector(".product-discountedPrice")
                    price = price_el.inner_text().strip() if price_el else "N/A"

                    if link:
                        doc = {
                            "_id": f"myntra_hm_{category}_{hash(link)}",
                            "productName": f"{brand_text} {name_text}",
                            "brand": brand_text,
                            "category": category,
                            "price": price,
                            "imageUrl": img,
                            "productUrl": link,
                            "source": "Myntra",
                            "scrapedAt": datetime.datetime.utcnow(),
                        }
                        save(doc)

                except Exception as e:
                    print(f"  ⚠ Skip item: {e}")

            time.sleep(random.uniform(2, 3))

        browser.close()

# =============================================================
# 3) SCRAPE ZARA FROM MYNTRA
# =============================================================
def scrape_zara_clothing(category, pages=10):
    """Scrape Zara clothing from Myntra"""
    print(f"\n🟡 Scraping Zara {category} from Myntra")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        for i in range(1, pages + 1):
            url = f"https://www.myntra.com/{category}?f=Brand%3AZARA&p={i}"
            print(f"\n➡ Page {i}: {url}")

            try:
                page.goto(url, timeout=90000)
                page.wait_for_selector("li.product-base", timeout=20000)
            except Exception as e:
                print(f"  ❌ Error: {e}")
                continue

            items = page.query_selector_all("li.product-base")
            print(f"  ✔ Found {len(items)} items")

            for item in items:
                try:
                    brand = item.query_selector("h3.product-brand")
                    name = item.query_selector("h4.product-product")
                    
                    if not brand or not name:
                        continue
                        
                    brand_text = brand.inner_text().strip()
                    name_text = name.inner_text().strip()

                    img_elem = item.query_selector("img")
                    img = img_elem.get_attribute("src") if img_elem else ""
                    if img and img.startswith("//"):
                        img = "https:" + img

                    link_elem = item.query_selector("a")
                    link = link_elem.get_attribute("href") if link_elem else ""
                    if link and not link.startswith("http"):
                        link = "https://www.myntra.com" + link

                    price_el = item.query_selector(".product-discountedPrice")
                    price = price_el.inner_text().strip() if price_el else "N/A"

                    if link:
                        doc = {
                            "_id": f"myntra_zara_{category}_{hash(link)}",
                            "productName": f"{brand_text} {name_text}",
                            "brand": brand_text,
                            "category": category,
                            "price": price,
                            "imageUrl": img,
                            "productUrl": link,
                            "source": "Myntra",
                            "scrapedAt": datetime.datetime.utcnow(),
                        }
                        save(doc)

                except Exception as e:
                    print(f"  ⚠ Skip item: {e}")

            time.sleep(random.uniform(2, 3))

        browser.close()

# =============================================================
# 4) SCRAPE SNITCH FROM MYNTRA
# =============================================================
def scrape_snitch_clothing(category, pages=10):
    """Scrape Snitch clothing from Myntra"""
    print(f"\n🟢 Scraping Snitch {category} from Myntra")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        for i in range(1, pages + 1):
            url = f"https://www.myntra.com/{category}?f=Brand%3ASNITCH&p={i}"
            print(f"\n➡ Page {i}: {url}")

            try:
                page.goto(url, timeout=90000)
                page.wait_for_selector("li.product-base", timeout=20000)
            except Exception as e:
                print(f"  ❌ Error: {e}")
                continue

            items = page.query_selector_all("li.product-base")
            print(f"  ✔ Found {len(items)} items")

            for item in items:
                try:
                    brand = item.query_selector("h3.product-brand")
                    name = item.query_selector("h4.product-product")
                    
                    if not brand or not name:
                        continue
                        
                    brand_text = brand.inner_text().strip()
                    name_text = name.inner_text().strip()

                    img_elem = item.query_selector("img")
                    img = img_elem.get_attribute("src") if img_elem else ""
                    if img and img.startswith("//"):
                        img = "https:" + img

                    link_elem = item.query_selector("a")
                    link = link_elem.get_attribute("href") if link_elem else ""
                    if link and not link.startswith("http"):
                        link = "https://www.myntra.com" + link

                    price_el = item.query_selector(".product-discountedPrice")
                    price = price_el.inner_text().strip() if price_el else "N/A"

                    if link:
                        doc = {
                            "_id": f"myntra_snitch_{category}_{hash(link)}",
                            "productName": f"{brand_text} {name_text}",
                            "brand": brand_text,
                            "category": category,
                            "price": price,
                            "imageUrl": img,
                            "productUrl": link,
                            "source": "Myntra",
                            "scrapedAt": datetime.datetime.utcnow(),
                        }
                        save(doc)

                except Exception as e:
                    print(f"  ⚠ Skip item: {e}")

            time.sleep(random.uniform(2, 3))

        browser.close()

# =============================================================
# MAIN
# =============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("VALUE SCOUT SCRAPER - TARGETED BRANDS")
    print("Brands: Nike, H&M, Zara, Snitch, Superkicks, VegNonVeg")
    print("=" * 60)

    # Nike shoes (10 pages = ~500 products)
    scrape_nike_shoes(pages=10)

    # H&M clothing - FOCUS HERE FOR 3000+ products
    CLOTHING_CATEGORIES = ["tshirts", "shirts", "pants", "jeans", "shorts", "jackets", "sweaters", "hoodies"]
    
    for cat in CLOTHING_CATEGORIES:
        scrape_hm_clothing(cat, pages=20)  # 20 pages × 50 items × 8 categories = ~8000 H&M items

    # Zara clothing (variety)
    for cat in ["tshirts", "shirts", "pants", "jeans"]:
        scrape_zara_clothing(cat, pages=10)

    # Snitch clothing (variety)
    for cat in ["tshirts", "shirts", "pants", "jeans"]:
        scrape_snitch_clothing(cat, pages=10)

    # Get total count
    total = products.count_documents({})
    print("\n" + "=" * 60)
    print(f"✅ SCRAPING COMPLETE!")
    print(f"📊 Total products in database: {total}")
    print("=" * 60)
    print("\n🔄 Next step: Run process_embeddings.py to generate AI embeddings")
