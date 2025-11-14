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
    products.update_one(
        {"_id": product["_id"]},
        {"$set": product, "$unset": {"styleEmbedding": ""}},
        upsert=True
    )

# -----------------------------
# COMMON BROWSER SETTINGS
# -----------------------------
def get_browser(p):
    return p.chromium.launch(
        headless=False,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--disable-infobars",
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
# 1) SCRAPE MYNTRA (PLAYWRIGHT — FULLY UPGRADED)
# =============================================================
def scrape_myntra(category="shoes", pages=5):
    print(f"\n🔵 Scraping Myntra — {category}")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        for i in range(1, pages+1):
            url = f"https://www.myntra.com/{category}?p={i}"
            print(f"\n➡ Visiting: {url}")

            try:
                page.goto(url, timeout=90000, wait_until="domcontentloaded")
                page.wait_for_selector("li.product-base", timeout=20000)
            except Exception as e:
                print(f"  ❌ Blocked: {e}")
                continue

            items = page.query_selector_all("li.product-base")
            print(f"  ✔ Found {len(items)} items")

            for item in items:
                try:
                    brand = item.query_selector("h3.product-brand").inner_text()
                    name = item.query_selector("h4.product-product").inner_text()

                    img = item.query_selector("img").get_attribute("src")
                    if img.startswith("//"):
                        img = "https:" + img

                    link = item.query_selector("a").get_attribute("href")
                    link = "https://www.myntra.com" + link

                    price_el = item.query_selector(".product-discountedPrice")
                    price = price_el.inner_text() if price_el else "N/A"

                    doc = {
                        "_id": f"myntra_{hash(link)}",
                        "productName": f"{brand} {name}",
                        "brand": brand,
                        "category": category,
                        "price": price,
                        "imageUrl": img,
                        "productUrl": link,
                        "source": "Myntra",
                        "scrapedAt": datetime.datetime.utcnow(),
                    }
                    save(doc)

                except Exception as e:
                    print("  ❌ Skip item:", e)

            time.sleep(random.uniform(1.5, 2.2))

        browser.close()

# =============================================================
# 2) SCRAPE SUPERKICKS (PLAYWRIGHT UPGRADE)
# =============================================================
def scrape_superkicks():
    print("\n🟢 Scraping Superkicks…")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        url = "https://superkicks.in/collections/shoes"
        page.goto(url, timeout=90000)

        try:
            page.wait_for_selector("div.product-item", timeout=20000)
        except:
            print("  ❌ Blocked or no products")
            return

        items = page.query_selector_all("div.product-item")
        print(f"  ✔ Found {len(items)} items")

        for item in items:
            try:
                title = item.query_selector(".product-item__title").inner_text()
                link = "https://superkicks.in" + item.query_selector("a").get_attribute("href")

                price_el = item.query_selector(".price-item--regular")
                price = price_el.inner_text() if price_el else "N/A"

                img = item.query_selector("img").get_attribute("src")
                if img.startswith("//"):
                    img = "https:" + img

                doc = {
                    "_id": f"superkicks_{hash(link)}",
                    "productName": title,
                    "brand": title.split()[0],
                    "category": "shoes",
                    "price": price,
                    "imageUrl": img,
                    "productUrl": link,
                    "source": "Superkicks",
                    "scrapedAt": datetime.datetime.utcnow(),
                }
                save(doc)

            except Exception:
                continue

        browser.close()

# =============================================================
# 3) SCRAPE VEGNONVEG (PLAYWRIGHT UPGRADE)
# =============================================================
def scrape_vegnonveg():
    print("\n🟣 Scraping VegNonVeg…")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        url = "https://www.vegnonveg.com/collections/shoes"
        page.goto(url, timeout=90000)

        try:
            page.wait_for_selector("div.product-card__info", timeout=20000)
        except:
            print("  ❌ Blocked or no products")
            return

        items = page.query_selector_all("div.product-card__info")
        print(f"  ✔ Found {len(items)} items")

        for item in items:
            try:
                name = item.query_selector(".product-card__title").inner_text()
                link = "https://www.vegnonveg.com" + item.query_selector("a").get_attribute("href")

                img = item.query_selector("img").get_attribute("src")
                if img.startswith("//"):
                    img = "https:" + img

                price = item.query_selector(".price").inner_text()

                doc = {
                    "_id": f"vegnonveg_{hash(link)}",
                    "productName": name,
                    "brand": name.split()[0],
                    "category": "shoes",
                    "price": price,
                    "imageUrl": img,
                    "productUrl": link,
                    "source": "VegNonVeg",
                    "scrapedAt": datetime.datetime.utcnow(),
                }
                save(doc)

            except Exception:
                continue

        browser.close()


# =============================================================
# MAIN
# =============================================================
if __name__ == "__main__":
    CATEGORIES = ["shoes", "tshirts", "shirts", "pants", "jeans", "shorts", "jackets"]

    for cat in CATEGORIES:
        scrape_myntra(cat, pages=5)

    scrape_superkicks()
    scrape_vegnonveg()

    print("\n✅ DONE — ALL PRODUCTS SCRAPED!")
