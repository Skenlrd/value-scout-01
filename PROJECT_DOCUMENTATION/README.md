# ValueScout Project
# ValueScout — End-to-End Workflow

ValueScout is a full-stack system for product discovery and AI-powered outfit recommendations.

## Architecture Overview
- AI (Flask, Python): CLIP embeddings + cosine similarity for cross-category style recommendations.
- Backend (Express, Node): Proxies AI calls, exposes search and batch product APIs.
- Frontend (React + Vite): UI with AI Style Builder modal and category tabs.
- Database (MongoDB): Stores products and `styleEmbedding` vectors.

## System Flow
1. Scrape products into MongoDB (Playwright) → `value_scout.products`.
2. Generate embeddings (70% image + 30% text) for products.
3. AI API serves recommendations based on cosine similarity and outfit rules.
4. Backend proxies AI and hydrates full product details for the UI.
5. Frontend renders results with tabs by category.

## Runbook (Windows PowerShell)
```powershell
# 0) Start MongoDB (locally or via Docker)
#    Ensure Mongo is reachable on mongodb://127.0.0.1:27017

# 1) Install dependencies (backend + frontend)
npm run install:all

# 2) Start all services (AI, Backend, Frontend)
npm run start:all

# Individual services
npm run start:ai
npm run start:backend
npm run start:frontend
```

## Key Endpoints
- Backend
  - `GET /api/style-builder/:productId` → proxies to AI
  - `GET /api/products-by-ids?ids=...` → batch fetch
  - `GET /api/search?q=...` → keyword search
- AI
  - `GET /api/health` → status + embedding coverage
  - `GET /api/style-builder/:product_id` → recommendations

## Data Maintenance
- Scraper (`ai/scraper.py`) validates images, prices, and normalizes URLs; prioritized category detection prevents mislabels (shoes first).
- Embeddings (`ai/process_embeddings.py`) compute CLIP vectors and store in `styleEmbedding`.
- Updating a product clears its old embedding to force refresh on next run.

## Docs
- Detailed single-file workflow (AI + Backend + Frontend + MongoDB): `PROJECT_DOCUMENTATION/aI_WORKFLOW/README.md`
- Setup and service orchestration: `PROJECT_DOCUMENTATION/UNIFIED_STARTUP.md`

## Troubleshooting
- AI health: `http://localhost:5000/api/health`
- Backend up: `http://localhost:8000/`
- Frontend dev: `http://localhost:5173/`
- If Playwright errors: install Chromium via `ai/pw_dl.py`.