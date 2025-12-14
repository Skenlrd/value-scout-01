from playwright.sync_api import sync_playwright
from pymongo import MongoClient
from datetime import datetime
import time
import random
import hashlib
import json
import os

# MongoDB
client = MongoClient("mongodb://127.0.0.1:27017")
db = client["value_scout"]
products = db["products"]

# Checkpoint
CHECKPOINT_FILE = "scraper_checkpoint.json"

# Brand whitelist (lowercase)
ALLOWED_BRANDS = {"h&m", "hm", "nike", "snitch", "mango", "superkicks", "vegnonveg"}


def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {"scraped_ids": set(data.get("scraped_ids", []))}
    return {"scraped_ids": set()}


def save_checkpoint(cp):
    tmp = {"scraped_ids": list(cp["scraped_ids"]) }
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(tmp, f)


def allowed_brand(name: str) -> bool:
    if not name:
        return False
    b = name.strip().lower()
    return any(x in b for x in ALLOWED_BRANDS)


def gen_id(source: str, unique: str) -> str:
    return f"{source}_" + hashlib.md5(unique.encode(), usedforsecurity=False).hexdigest()


def rand_sleep(a=0.8, b=1.8):
    time.sleep(random.uniform(a, b))


def save_product(doc, cp):
    pid = doc["_id"]
    if pid in cp["scraped_ids"]:
        return False

    # Remove any old embedding on insert/update
    products.update_one({"_id": pid}, {"$set": doc, "$unset": {"styleEmbedding": ""}}, upsert=True)
    cp["scraped_ids"].add(pid)
    if len(cp["scraped_ids"]) % 50 == 0:
        save_checkpoint(cp)
        print(f"💾 Checkpoint saved ({len(cp['scraped_ids'])})")
    return True


# ---------- Playwright helpers ----------
def get_browser(p):
    return p.chromium.launch(
        headless=False,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--no-sandbox",
        ],
    )


def get_context(browser):
    return browser.new_context(
        viewport={"width": 1280, "height": 900},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    )


# =============================================================
# Myntra brand scraper (men & women, all clothing)
# =============================================================
def scrape_myntra_brand(brand: str, target: int):
    print("\n" + "=" * 60)
    print(f"🔍 Myntra: {brand} (target {target}+)")
    print("=" * 60)

    cp = load_checkpoint()
    total = 0
    
    # Scrape men and women general listings
    queries = [
        f"{brand}-men",
        f"{brand}-women"
    ]

    with sync_playwright() as p:
        browser = get_browser(p)
        ctx = get_context(browser)
        page = ctx.new_page()

        for q in queries:
            page_num = 1
            empty_pages = 0
            seen_in_cat = set()

            while page_num <= 100 and total < target:
                url = f"https://www.myntra.com/{q}?p={page_num}"
                print(f"➡ {q} | page {page_num}")
                try:
                    page.goto(url, timeout=90000, wait_until="domcontentloaded")
                    page.wait_for_selector("li.product-base", timeout=20000)
                except Exception as e:
                    print(f"  ❌ Load error: {e}")
                    empty_pages += 1
                    if empty_pages >= 3:
                        print(f"  🛑 Stopping - 3 consecutive empty pages")
                        break
                    page_num += 1
                    continue

                cards = page.query_selector_all("li.product-base")
                if not cards or len(cards) == 0:
                    empty_pages += 1
                    print(f"  ⚠️ Empty page ({empty_pages}/3)")
                    if empty_pages >= 3:
                        print(f"  🛑 Stopping - 3 consecutive empty pages")
                        break
                    page_num += 1
                    continue
                
                # Reset empty counter if we found products
                empty_pages = 0

                added = 0
                for it in cards:
                    try:
                        b_el = it.query_selector("h3.product-brand")
                        n_el = it.query_selector("h4.product-product")
                        if not b_el or not n_el:
                            continue
                        btxt = (b_el.inner_text() or "").strip()
                        ntxt = (n_el.inner_text() or "").strip()
                        if not allowed_brand(btxt):
                            continue

                        a_el = it.query_selector("a")
                        href = a_el.get_attribute("href") if a_el else ""
                        if href and not href.startswith("http"):
                            if not href.startswith("/"):
                                href = "/" + href
                            href = "https://www.myntra.com" + href
                        if not href or href in seen_in_cat:
                            continue
                        seen_in_cat.add(href)

                        img_el = it.query_selector("img")
                        img = img_el.get_attribute("src") if img_el else ""
                        if img and img.startswith("//"):
                            img = "https:" + img
                        # Skip products with no image
                        if not img or "placeholder" in img.lower():
                            continue

                        price_el = it.query_selector(".product-discountedPrice, .product-price")
                        price_txt = price_el.inner_text().strip() if price_el else "0"
                        # Extract price more carefully - only get the first continuous digit group
                        import re
                        price_match = re.search(r'₹?\s*(\d{1,6})', price_txt)
                        price = int(price_match.group(1)) if price_match else 0
                        # Sanity check: skip if price is unrealistic
                        if price > 50000:
                            continue

                        # Auto-detect category from URL/name (improved ordering & keywords to reduce mislabels)
                        url_lower = href.lower()
                        name_lower = ntxt.lower()
                        category = "clothing"

                        # Shoes first: broaden keyword set (avoid misclassifying performance footwear as shirts)
                        shoe_kw = ["shoe", "shoes", "sneaker", "sneakers", "boot", "trainer", "basketball", "running", "football", "golf", "court", "jordan"]
                        if any(k in url_lower or k in name_lower for k in shoe_kw):
                            category = "shoes"
                        elif any(x in url_lower or x in name_lower for x in ["tshirt", "t-shirt"]):
                            category = "tshirt"
                        elif any(x in url_lower or x in name_lower for x in ["shirt", "shirts", "top", "blouse"]):
                            # ensure we don't wrongly match 'short' as 'shirt'
                            if "short" not in name_lower:
                                category = "shirt"
                        elif any(x in url_lower or x in name_lower for x in ["jeans", "trouser", "pant"]):
                            category = "pants"
                        elif any(x in url_lower or x in name_lower for x in ["short", "shorts"]):
                            category = "shorts"
                        elif any(x in url_lower or x in name_lower for x in ["hoodie", "sweatshirt"]):
                            category = "hoodie"
                        elif any(x in url_lower or x in name_lower for x in ["jacket", "coat"]):
                            category = "jacket"
                        elif any(x in url_lower or x in name_lower for x in ["dress", "skirt"]):
                            category = "dress"

                        doc = {
                            "_id": gen_id("myntra", href),
                            "productName": f"{btxt} {ntxt}",
                            "brand": btxt,
                            "category": category,
                            "price": price,
                            "imageUrl": img,
                            "productUrl": href,
                            "source": f"myntra_{brand.lower()}",
                            "scrapedAt": datetime.utcnow(),
                        }
                        if save_product(doc, cp):
                            total += 1
                            added += 1
                    except Exception as e:
                        print(f"  ⚠️ Parse error: {e}")
                        continue

                print(f"  ✅ +{added} (total: {total})")
                if added == 0:
                    empty_pages += 1
                    if empty_pages >= 3:
                        print(f"  🛑 Stopping - no new products found")
                        break
                page_num += 1
                rand_sleep()

        ctx.close()
        browser.close()

    print(f"✅ Myntra {brand}: {total}")
    return total


def scrape_myntra_hm():
    return scrape_myntra_brand("H&M", target=1500)


def scrape_myntra_nike():
    return scrape_myntra_brand("Nike", target=500)


def scrape_myntra_snitch():
    return scrape_myntra_brand("Snitch", target=500)


def scrape_myntra_mango():
    return scrape_myntra_brand("Mango", target=500)


# =============================================================
# SuperKicks footwear (official site)
# =============================================================
def scrape_superkicks():
    print("\n" + "=" * 60)
    print("🔍 SuperKicks footwear")
    print("=" * 60)
    cp = load_checkpoint()
    total = 0

    with sync_playwright() as p:
        browser = get_browser(p)
        ctx = get_context(browser)
        page = ctx.new_page()

        base = "https://www.superkicks.in/collections/footwear"
        page_num = 1
        empty_pages = 0
        while page_num <= 60:
            url = f"{base}?page={page_num}"
            print(f"➡ page {page_num}")
            try:
                page.goto(url, timeout=90000, wait_until="domcontentloaded")
                # common Shopify grids
                items = page.query_selector_all(
                    ".product-item, .grid-product, .product-card, .grid__item, .card-wrapper"
                )
            except Exception as e:
                print(f"  ❌ Load error: {e}")
                empty_pages += 1
                if empty_pages >= 3:
                    break
                page_num += 1
                continue

            if not items:
                empty_pages += 1
                print(f"  ⚠️ Empty page ({empty_pages}/3)")
                if empty_pages >= 3:
                    break
                page_num += 1
                continue

            added = 0
            for it in items:
                try:
                    name_el = it.query_selector(
                        ".product-title, .product-name, h3 a, .grid-product__title, .card__heading"
                    )
                    price_el = it.query_selector(".price, .product-price, .money, .price-item")
                    a_el = it.query_selector("a[href*='/products/']")
                    img_el = it.query_selector("img")
                    if not (name_el and price_el and a_el and img_el):
                        continue

                    name = name_el.inner_text().strip()
                    href = a_el.get_attribute("href") or ""
                    if href and not href.startswith("http"):
                        if not href.startswith("/"):
                            href = "/" + href
                        href = "https://www.superkicks.in" + href
                    img = img_el.get_attribute("src") or img_el.get_attribute("data-src") or ""
                    if img.startswith("//"):
                        img = "https:" + img
                    if not img or "placeholder" in img.lower():
                        continue
                    import re
                    price_txt = price_el.inner_text() or "0"
                    price_match = re.search(r'₹?\s*(\d{1,6})', price_txt)
                    price = int(price_match.group(1)) if price_match else 0
                    if price > 50000:
                        continue

                    doc = {
                        "_id": gen_id("superkicks", href),
                        "productName": name,
                        "brand": "SuperKicks",
                        "category": "shoes",
                        "price": price,
                        "imageUrl": img,
                        "productUrl": href,
                        "source": "superkicks",
                        "scrapedAt": datetime.utcnow(),
                    }
                    if save_product(doc, cp):
                        total += 1
                        added += 1
                except Exception as e:
                    print(f"  ⚠️ Parse error: {e}")
                    continue

            print(f"  ✅ +{added} (site total: {total})")
            if added == 0:
                empty_pages += 1
                if empty_pages >= 3:
                    print(f"  🛑 Stopping - no new products found")
                    break
            else:
                empty_pages = 0
            page_num += 1
            rand_sleep()

        ctx.close()
        browser.close()

    print(f"✅ SuperKicks: {total}")
    return total


# =============================================================
# VegNonVeg footwear (official site)
# =============================================================
def scrape_vegnonveg():
    print("\n" + "=" * 60)
    print("🔍 VegNonVeg footwear")
    print("=" * 60)
    cp = load_checkpoint()
    total = 0

    with sync_playwright() as p:
        browser = get_browser(p)
        ctx = get_context(browser)
        page = ctx.new_page()

        base = "https://www.vegnonveg.com/footwear"
        page_num = 1
        empty_pages = 0
        while page_num <= 60:
            url = f"{base}?page={page_num}"
            print(f"➡ page {page_num}")
            try:
                page.goto(url, timeout=90000, wait_until="domcontentloaded")
                items = page.query_selector_all(
                    ".product-item, .product-card, .grid-item, .grid__item, .card-wrapper"
                )
            except Exception as e:
                print(f"  ❌ Load error: {e}")
                empty_pages += 1
                if empty_pages >= 3:
                    break
                page_num += 1
                continue

            if not items:
                empty_pages += 1
                print(f"  ⚠️ Empty page ({empty_pages}/3)")
                if empty_pages >= 3:
                    break
                page_num += 1
                continue

            added = 0
            for it in items:
                try:
                    name_el = it.query_selector(
                        ".product-name, .product-title, h3 a, .card__heading"
                    )
                    price_el = it.query_selector(".price, .product-price, .price-item, .money")
                    a_el = it.query_selector("a[href*='/product/'], a[href*='/footwear/'], a[href*='/products/']")
                    img_el = it.query_selector("img")
                    if not (name_el and price_el and a_el and img_el):
                        continue

                    name = name_el.inner_text().strip()
                    href = a_el.get_attribute("href") or ""
                    if href and not href.startswith("http"):
                        if not href.startswith("/"):
                            href = "/" + href
                        href = "https://www.vegnonveg.com" + href
                    img = img_el.get_attribute("src") or img_el.get_attribute("data-src") or ""
                    if img.startswith("//"):
                        img = "https:" + img
                    if not img or "placeholder" in img.lower():
                        continue
                    import re
                    price_txt = price_el.inner_text() or "0"
                    price_match = re.search(r'₹?\s*(\d{1,6})', price_txt)
                    price = int(price_match.group(1)) if price_match else 0
                    if price > 50000:
                        continue

                    doc = {
                        "_id": gen_id("vegnonveg", href),
                        "productName": name,
                        "brand": "VegNonVeg",
                        "category": "shoes",
                        "price": price,
                        "imageUrl": img,
                        "productUrl": href,
                        "source": "vegnonveg",
                        "scrapedAt": datetime.utcnow(),
                    }
                    if save_product(doc, cp):
                        total += 1
                        added += 1
                except Exception as e:
                    print(f"  ⚠️ Parse error: {e}")
                    continue

            print(f"  ✅ +{added} (site total: {total})")
            if added == 0:
                empty_pages += 1
                if empty_pages >= 3:
                    print(f"  🛑 Stopping - no new products found")
                    break
            else:
                empty_pages = 0
            page_num += 1
            rand_sleep()

        ctx.close()
        browser.close()

    print(f"✅ VegNonVeg: {total}")
    return total


# =============================================================
# Master runner
# =============================================================
def run_all_scrapers():
    print("\n" + "=" * 60)
    print("🚀 START SCRAPER PIPELINE (DB WILL BE CLEARED)")
    print("=" * 60)

    # wipe DB
    products.delete_many({})
    print("🗑️  products collection cleared")

    # reset checkpoint
    if os.path.exists(CHECKPOINT_FILE):
        os.remove(CHECKPOINT_FILE)
        print("🧹 checkpoint reset")

    res = {}
    res["H&M"] = scrape_myntra_hm()
    res["Nike"] = scrape_myntra_nike()
    res["Snitch"] = scrape_myntra_snitch()
    res["Mango"] = scrape_myntra_mango()
    res["SuperKicks"] = scrape_superkicks()
    res["VegNonVeg"] = scrape_vegnonveg()

    total_shoes = res["SuperKicks"] + res["VegNonVeg"]
    total_all = sum(res.values())

    print("\n" + "=" * 60)
    print("📊 RESULTS")
    print("=" * 60)
    print(f"H&M (Myntra):    {res['H&M']}")
    print(f"Nike (Myntra):   {res['Nike']}")
    print(f"Snitch (Myntra): {res['Snitch']}")
    print(f"Mango (Myntra):  {res['Mango']}")
    print(f"SuperKicks:      {res['SuperKicks']}")
    print(f"VegNonVeg:       {res['VegNonVeg']}")
    print("-" * 60)
    print(f"Total Shoes:     {total_shoes}")
    print(f"TOTAL ALL:       {total_all}")

    print("\n✅ VALIDATION")
    ok = True
    if res["H&M"] < 1500:
        print(f"  ⚠️ H&M below target (got {res['H&M']}, need 1500+)")
        ok = False
    else:
        print("  ✅ H&M target met")

    if res["Nike"] < 500:
        print(f"  ⚠️ Nike below target (got {res['Nike']}, need 500+)")
        ok = False
    else:
        print("  ✅ Nike target met")

    if res["Snitch"] < 500:
        print(f"  ⚠️ Snitch below target (got {res['Snitch']}, need 500+)")
        ok = False
    else:
        print("  ✅ Snitch target met")

    if res["Mango"] < 500:
        print(f"  ⚠️ Mango below target (got {res['Mango']}, need 500+)")
        ok = False
    else:
        print("  ✅ Mango target met")

    if total_shoes < 1000:
        print(f"  ⚠️ Shoes below target (got {total_shoes}, need 1000+)")
        ok = False
    else:
        print("  ✅ Shoes target met")

    if ok:
        print("\n🎉 ALL TARGETS MET!")
    else:
        print("\n⚠️ Some targets not met. Re-run specific scrapers as needed.")

    return res


if __name__ == "__main__":
    run_all_scrapers()
