from playwright.sync_api import sync_playwright
from pymongo import MongoClient
import datetime
import time
import random

client = MongoClient("mongodb://127.0.0.1:27017")
db = client["value_scout"]
products = db["products"]

def save(product):
    products.update_one(
        {"_id": product["_id"]},
        {"$set": product, "$unset": {"styleEmbedding": ""}},
        upsert=True
    )

def get_browser(p):
    return p.chromium.launch(headless=False)

def get_context(browser):
    return browser.new_context(
        viewport={"width": 1280, "height": 900},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    )

# ----------------------------------------------------
# SCRAPE ONLY NIKE SHOES
# ----------------------------------------------------
def scrape_nike_shoes(pages=5):
    print("\n🔵 Scraping ONLY Nike Shoes")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        for i in range(1, pages + 1):
            url = f"https://www.myntra.com/nike-shoes?p={i}"
            print(f"\n➡ {url}")

            try:
                page.goto(url, timeout=60000)
                page.wait_for_selector("li.product-base", timeout=20000)
            except:
                print("❌ Blocked")
                continue

            items = page.query_selector_all("li.product-base")
            print("✔ Found:", len(items))

            for it in items:
                try:
                    brand = it.query_selector("h3.product-brand").inner_text()
                    if brand.lower() != "nike":
                        continue

                    name = it.query_selector("h4.product-product").inner_text()
                    link = "https://www.myntra.com" + it.query_selector("a").get_attribute("href")
                    img = it.query_selector("img").get_attribute("src")
                    if img.startswith("//"):
                        img = "https:" + img

                    price_el = it.query_selector(".product-discountedPrice")
                    price = price_el.inner_text() if price_el else "N/A"

                    doc = {
                        "_id": f"myntra_{hash(link)}",
                        "productName": f"{brand} {name}",
                        "brand": brand,
                        "category": "shoes",
                        "price": price,
                        "imageUrl": img,
                        "productUrl": link,
                        "source": "Myntra",
                        "scrapedAt": datetime.datetime.utcnow(),
                    }
                    save(doc)
                except:
                    continue

        browser.close()

# ----------------------------------------------------
# SCRAPE ONLY H&M CLOTHING
# ----------------------------------------------------
def scrape_hm(category, pages=5):
    print(f"\n🟣 Scraping ONLY H&M — {category}")

    with sync_playwright() as p:
        browser = get_browser(p)
        context = get_context(browser)
        page = context.new_page()

        for i in range(1, pages + 1):
            url = f"https://www.myntra.com/{category}?f=Brand%3AH%26M&p={i}"
            print(f"\n➡ {url}")

            try:
                page.goto(url, timeout=60000)
                page.wait_for_selector("li.product-base", timeout=20000)
            except:
                print("❌ Blocked")
                continue

            items = page.query_selector_all("li.product-base")
            print("✔ Found:", len(items))

            for it in items:
                try:
                    brand = it.query_selector("h3.product-brand").inner_text()
                    if brand.lower() != "h&m":
                        continue

                    name = it.query_selector("h4.product-product").inner_text()
                    link = "https://www.myntra.com" + it.query_selector("a").get_attribute("href")
                    img = it.query_selector("img").get_attribute("src")
                    if img.startswith("//"):
                        img = "https:" + img

                    price_el = it.query_selector(".product-discountedPrice")
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
                except:
                    continue

        browser.close()

# ----------------------------------------------------
# SUPERKICKS
# ----------------------------------------------------
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
            print("❌ Blocked")
            return

        items = page.query_selector_all("div.product-item")
        print("✔ Found:", len(items))

        for item in items:
            try:
                title = item.query_selector(".product-item__title").inner_text()
                link = "https://superkicks.in" + item.query_selector("a").get_attribute("href")
                img = item.query_selector("img").get_attribute("src")
                if img.startswith("//"): img = "https:" + img

                price_el = item.query_selector(".price-item--regular")
                price = price_el.inner_text() if price_el else "N/A"

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
            except:
                continue

        browser.close()

# ----------------------------------------------------
# VEGNONVEG
# ----------------------------------------------------
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
            print("❌ Blocked")
            return

        items = page.query_selector_all("div.product-card__info")
        print("✔ Found:", len(items))

        for item in items:
            try:
                name = item.query_selector(".product-card__title").inner_text()
                link = "https://www.vegnonveg.com" + item.query_selector("a").get_attribute("href")
                img = item.query_selector("img").get_attribute("src")
                if img.startswith("//"): img = "https:" + img

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
            except:
                continue

        browser.close()

# ----------------------------------------------------
# MAIN
# ----------------------------------------------------
if __name__ == "__main__":
    scrape_nike_shoes(pages=5)

    hm_categories = ["shirts", "pants", "jeans", "tshirts", "jackets", "shorts"]
    for cat in hm_categories:
        scrape_hm(cat, pages=5)

    scrape_superkicks()
    scrape_vegnonveg()

    print("\n✅ DONE — ONLY NIKE + ONLY H&M + SUPERKICKS + VEGNONVEG ADDED")
