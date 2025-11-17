# AI_WORKFLOW

This document explains the AI subsystem end-to-end and describes each file in `ai/` with responsibilities, inputs/outputs, and run steps.

## Overview
- Model: `clip-ViT-B-32` (SentenceTransformers)
- Vector: 384D; Fusion: 70% image + 30% text
- Similarity: Cosine similarity
- DB: MongoDB `value_scout.products`

## Data Flow
1) Scrape products → MongoDB (`ai/scraper.py`)
2) Generate embeddings → `styleEmbedding` (`ai/process_embeddings.py`)
3) Serve recommendations → Flask API (`ai/ai_api.py`)

---

## File-by-File Details

### `ai_api.py` — Flask Recommendation API
- Purpose: Return top-5 cross-category outfit recommendations for an input product.
- Endpoints:
  - `GET /api/style-builder/<product_id>`: Computes cosine similarity vs candidates in target categories.
  - `GET /api/health`: Returns DB counts and embedding coverage.
  - `GET /`: Self-doc + current `OUTFIT_RULES`.
- Key Logic:
  1. Fetch base product; assert `styleEmbedding` exists
  2. Resolve target categories via `OUTFIT_RULES`
  3. Query candidates in those categories where `styleEmbedding` exists
  4. Compute cosine similarity via `sklearn.metrics.pairwise.cosine_similarity`
  5. Sort desc; return top 5: `{ id, score }`
- Config:
  - Mongo URI: `mongodb://localhost:27017/`
  - Database: `value_scout`
  - Collection: `products`
  - Port: `5000`
- Run (PowerShell):
```powershell
.\.venv\Scripts\python.exe .\ai\ai_api.py
Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json -Depth 4
Invoke-RestMethod http://localhost:5000/api/style-builder/<PRODUCT_ID>
```

### `process_embeddings.py` — Embedding Generator
- Purpose: Add `styleEmbedding` for products missing it.
- Model: `SentenceTransformer("clip-ViT-B-32")`
- Steps:
  - Download image (protocol fix, headers, timeout) → PIL Image (RGB)
  - Encode image and name → two 384D vectors
  - Fusion: `0.7 * image + 0.3 * text`
  - Save `styleEmbedding` to MongoDB
- Resilience: Skips failures, logs progress, uses cursor for memory efficiency.
- Run:
```powershell
.\.venv\Scripts\python.exe .\ai\process_embeddings.py
```

### `scraper.py` — Product Scraper (Playwright)
- Sources:
  - Myntra brands: H&M, Nike, Snitch, Mango (`<brand>-men`, `<brand>-women`)
  - SuperKicks: Footwear collection pages
  - VegNonVeg: Footwear grid pages
- Checkpoint: `scraper_checkpoint.json` with `scraped_ids` to avoid duplicates across runs.
- Validation:
  - Non-placeholder image required
  - Price via regex; ignore > ₹50,000
  - Absolute URL normalization; brand allowlist
- Category Detection (priority):
  1. shoes (broad keywords: sneaker, basketball, running, etc.)
  2. tshirt
  3. shirt (avoid false match with "short")
  4. pants (jeans/trouser/pant)
  5. shorts (short/shorts)
  6. hoodie
  7. jacket
  8. dress
- Upsert behavior: Unsets existing `styleEmbedding` on update to force re-embed.
- Full runner: `run_all_scrapers()` clears collection, resets checkpoint, runs all sources.
- Run:
```powershell
.\.venv\Scripts\python.exe .\ai\scraper.py
```

### `install_playwright_browsers.py` and `pw_dl.py`
- Purpose: Install Playwright Chromium (internal driver API vs CLI module).
- Run examples:
```powershell
.\.venv\Scripts\python.exe .\ai\install_playwright_browsers.py
.\.venv\Scripts\python.exe .\ai\pw_dl.py
```

### `requirements.txt`
- Notables: `Flask`, `flask-cors`, `pymongo`, `sentence-transformers`, `torch`, `scikit-learn`, `pillow`, `requests`, `playwright`.

---

## Typical AI Ops
1. Scrape/refetch products with `scraper.py`
2. Generate embeddings with `process_embeddings.py`
3. Start API `ai_api.py` and verify `/api/health`

## Tips
- Ensure MongoDB is running on `127.0.0.1:27017`
- Re-run embeddings if images/names/categories change
- If Playwright fails, reinstall Chromium via `pw_dl.py`
