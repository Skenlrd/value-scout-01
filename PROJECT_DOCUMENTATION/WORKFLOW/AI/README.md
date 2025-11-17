# AI Workflow

This guide explains how the AI subsystem works end-to-end, and documents each file in `ai/` with its responsibilities, inputs/outputs, and usage.

## Overview
- Model: `clip-ViT-B-32` via SentenceTransformers
- Similarity: cosine similarity over 384D embeddings
- Fusion: 70% image + 30% text
- Storage: MongoDB collection `value_scout.products`

## Data Flow
1. Scrape products into MongoDB using Playwright (`scraper.py`).
2. Generate `styleEmbedding` vectors for products missing embeddings (`process_embeddings.py`).
3. Serve outfit recommendations via Flask API (`ai_api.py`).

---

## File-by-File

### `ai_api.py`
- Purpose: Flask API that returns outfit recommendations for a product using cosine similarity.
- Endpoints:
  - `GET /api/style-builder/<product_id>`: Top-5 cross-category recommendations.
  - `GET /api/health`: Health and DB stats (counts + embedding coverage).
  - `GET /`: Brief API self-doc + current outfit rules.
- Outfit rules (`OUTFIT_RULES`):
  - Maps an input category to compatible categories, e.g. `"shoes" -> ["tshirt","shirt","pants","jeans","shorts","hoodie","jacket"]`.
- Algorithm Steps:
  1) Fetch base product and verify `styleEmbedding` exists
  2) Resolve target categories via `OUTFIT_RULES`
  3) Query candidates having `styleEmbedding` in target categories
  4) Compute cosine similarity (`sklearn.metrics.pairwise.cosine_similarity`)
  5) Sort desc and return top 5
- Configuration:
  - Mongo: `mongodb://localhost:27017/`, DB: `value_scout`, Collection: `products`
  - Port: `5000` (hardcoded in script’s `__main__`)
- Try it (PowerShell):
```powershell
# Start AI API
.\.venv\Scripts\python.exe .\ai\ai_api.py

# Health check
Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json -Depth 4

# Recommendations
Invoke-RestMethod http://localhost:5000/api/style-builder/<PRODUCT_ID>
```

### `process_embeddings.py`
- Purpose: Generate multimodal `styleEmbedding` for products missing it.
- Key functions:
  - `download_image(url)`: fetches and converts to RGB PIL image
  - `generate_style_embedding(name, image_url)`: 70% image + 30% text fusion
  - `process_all_embeddings()`: iterates Mongo cursor and saves embeddings
- Behavior:
  - Skips if no image URL or download fails
  - Logs progress and success/failure stats
- Model:
  - Loaded once: `SentenceTransformer("clip-ViT-B-32")`
- Try it:
```powershell
.\.venv\Scripts\python.exe .\ai\process_embeddings.py
```

### `scraper.py`
- Purpose: Scrape products from multiple sources and upsert into MongoDB.
- Sources:
  - Myntra (brands): H&M, Nike, Snitch, Mango (`<brand>-men`, `<brand>-women`)
  - SuperKicks (footwear)
  - VegNonVeg (footwear)
- Checkpointing:
  - `scraper_checkpoint.json` stores `scraped_ids` to prevent duplicates across runs
- Validation:
  - Image required (no placeholders)
  - Price parsed via regex; ignores > ₹50,000
  - URL normalization for absolute links
- Category detection (priority):
  1) shoes (broad keywords: sneaker, basketball, running, etc.)
  2) tshirt → 3) shirt (avoid matching "short") → 4) pants → 5) shorts → 6) hoodie → 7) jacket → 8) dress
- Save behavior:
  - Upsert document and unset any existing `styleEmbedding` (forces re-embed on next run)
- Full run helper:
  - `run_all_scrapers()` clears `products`, resets checkpoint, and runs all sources with targets
- Try it:
```powershell
# Run a single brand or the default script entry
.\.venv\Scripts\python.exe .\ai\scraper.py
```

### `install_playwright_browsers.py`
- Purpose: Programmatically install Playwright Chromium using internal driver APIs.
- Usage:
```powershell
.\.venv\Scripts\python.exe .\ai\install_playwright_browsers.py
```

### `pw_dl.py`
- Purpose: Install Playwright Chromium via CLI module invocation.
- Usage:
```powershell
.\.venv\Scripts\python.exe .\ai\pw_dl.py
```

### `requirements.txt`
- Purpose: Python dependencies for AI + scraping pipeline.
- Notables: `Flask`, `flask-cors`, `pymongo`, `sentence-transformers`, `torch`, `playwright`, `scikit-learn`, `pillow`, `requests`.

---

## Typical AI Workflow
1. Scrape or refresh data with `scraper.py` (resets embeddings for changed items)
2. Generate embeddings with `process_embeddings.py`
3. Start the AI API `ai_api.py`
4. Call from backend (`/api/style-builder/:productId`) or test via curl

## Operational Notes
- Ensure MongoDB is running on `localhost:27017`
- If Playwright errors, (re)install Chromium using `pw_dl.py`
- If products change (price/image/category), re-run embeddings for accuracy
