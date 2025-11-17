# ValueScout Workflow — Detailed (AI, Backend, Frontend, MongoDB)

This single document explains how ValueScout works end-to-end and gives a detailed, file-by-file explanation for the AI and Backend sections.

## High-Level Flow
1. Scrape products (Playwright) → MongoDB (`value_scout.products`).
2. Generate CLIP style embeddings (70% image, 30% text) for products.
3. AI API (Flask) computes similarity-based, cross-category outfit recommendations.
4. Backend (Express) proxies AI requests, serves search, and hydrates product details.
5. Frontend (React/Vite) calls backend endpoints and renders an AI-powered modal with tabs by category.

---

## AI Section (Folder: `ai/`)

### Goals
- Maintain clean, validated product data.
- Compute robust multimodal embeddings.
- Serve recommendations with predictable latency using cosine similarity.

### Files and Responsibilities

#### `ai_api.py`
- Flask service that returns outfit recommendations for a given `product_id`.
- Endpoints:
  - `GET /api/style-builder/<product_id>`: Returns top 5 compatible products from target categories based on cosine similarity.
  - `GET /api/health`: Mongo stats and embedding coverage.
  - `GET /`: Self-doc + `OUTFIT_RULES` JSON.
- Core logic:
  1) Load base product, ensure `styleEmbedding` exists.
  2) Determine target categories via `OUTFIT_RULES`.
  3) Query candidates with `styleEmbedding` from target categories.
  4) Compute cosine similarity (sklearn), sort desc, slice top 5.
- Config:
  - Mongo: `mongodb://localhost:27017/`, DB: `value_scout`, Coll: `products`.
  - Port: 5000.
- Try it (PowerShell):
```powershell
.\.venv\Scripts\python.exe .\ai\ai_api.py
Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json -Depth 4
Invoke-RestMethod http://localhost:5000/api/style-builder/<PRODUCT_ID>
```

#### `process_embeddings.py`
- Generates `styleEmbedding` for items missing it.
- Model: `SentenceTransformer("clip-ViT-B-32")`, 384D vectors.
- Fusion: `0.7 * image + 0.3 * text`.
- Steps per product: download image → image/text encode → combine → save to Mongo.
- Resilient: logs failures; continues via cursor.
- Run:
```powershell
.\.venv\Scripts\python.exe .\ai\process_embeddings.py
```

#### `scraper.py`
- Playwright-based scrapers for Myntra brands (H&M, Nike, Snitch, Mango) and footwear sites (SuperKicks, VegNonVeg).
- Checkpoint file `scraper_checkpoint.json` avoids duplicate work.
- Validation:
  - Requires non-placeholder images.
  - Price via regex; ignores > ₹50,000.
  - Absolute URL normalization; brand whitelist.
- Category detection (priority to avoid mislabels): shoes → tshirt → shirt (guard against "short") → pants → shorts → hoodie → jacket → dress.
- Upsert reset: clears `styleEmbedding` when product is updated to force re-embed.
- Full-run helper `run_all_scrapers()` clears DB and runs all sources with targets.

#### `install_playwright_browsers.py` and `pw_dl.py`
- Utilities to install Playwright Chromium (via internal driver API or CLI module).

#### `requirements.txt`
- Dependencies for the AI + scraping stack (Flask, flask-cors, pymongo, sentence-transformers, torch, scikit-learn, pillow, requests, playwright, etc.).

---

## Backend Section (Folder: `backend/`)

### Goals
- Provide a stable API surface for the frontend.
- Proxy to AI API and enrich responses with full product documents.
- Expose search and batch fetch utilities.

### Files and Responsibilities

#### `main_api_server.js`
- Primary Express server.
- Environment:
  - `PORT` (default 8000), `MONGO_URI` (e.g. `mongodb://127.0.0.1:27017/value_scout`), `AI_API_URL` (e.g. `http://127.0.0.1:5000`), optional `COLLECTION_NAME` (default `products`).
- Mongo connection via `mongoose.connect(...)`; raw DB: `mongoose.connection.db`.
- Endpoints:
  - `GET /` → health/status JSON.
  - `GET /api/style-builder/:productId` → proxies to `${AI_API_URL}/api/style-builder/:productId`.
  - `GET /api/search?q=` → regex search over `productName`, `brand`, `category`, `source` (limit 100).
  - `GET /api/products-by-ids?ids=a,b,c` → returns documents by ID(s) (supports string IDs).
- Startup logs URL and sets global error handlers.

#### `minimal_server.js`
- Minimal ESM-based server for quick smoke tests (just `GET /`).

#### `simple_server.js`
- Small dynamic-import demo using Express (just `GET /`).

#### `backend/package.json`
- Scripts:
  - `start` → `node main_api_server.js`
  - `dev` → `nodemon main_api_server.js`
  - `start:ai` / `start:backend` / `start:frontend` / `start:all` helpers (used from repo root as well).

---

## Frontend Section (Folder: `frontend/`)
- React + TypeScript + Vite app.
- Consumes backend endpoints:
  - `GET /api/style-builder/:productId`
  - `GET /api/products-by-ids?ids=...`
  - `GET /api/search?q=...`
- Style Builder modal:
  - Fetch recommendations → fetch full product docs → filter to target categories → dedupe by `productUrl` → render tabs by category.
- Dev server: `http://localhost:5173` (Vite). Proxy routes `/api/*` to the backend.

---

## MongoDB Section
- URI: `mongodb://127.0.0.1:27017` → DB `value_scout` → collection `products`.
- Flexible schema; recommended indexes: `category`, `productUrl` (unique), optional compound.
- Typical ops: upserts via scraper, embedding writes, batch fetch by ID list.

---

## How to Run Everything (Root scripts)

Root `package.json` provides convenience scripts:

```powershell
# Install backend and frontend deps
npm run install:all

# Start AI, Backend, and Frontend together
npm run start:all

# Or run individually
npm run start:ai
npm run start:backend
npm run start:frontend
```

Prereqs: MongoDB running locally; Python venv with dependencies installed for AI (`ai/requirements.txt`).

---

## End-to-End Request Path
1) Frontend calls `GET /api/style-builder/:productId`.
2) Backend proxies to AI API and returns IDs/scores + categories.
3) Frontend calls `GET /api/products-by-ids` to hydrate product details.
4) UI displays tabbed recommendations by category.

---

## Notes & Tips
- If the scraper updates a product, its previous `styleEmbedding` is cleared—re-run embeddings.
- If Playwright errors, install the Chromium driver using `ai/pw_dl.py`.
- Keep Mongo running; verify via AI `/api/health` endpoint.
