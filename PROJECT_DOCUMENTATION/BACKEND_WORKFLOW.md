# BACKEND_WORKFLOW

Express.js backend that proxies AI requests, exposes search and batch product endpoints, and connects to MongoDB.

## Overview
- Framework: Express.js
- DB: MongoDB (via Mongoose connection, raw `db` handle)
- AI proxy target: `${AI_API_URL}` (Flask)

## Environment
- `PORT` → default `8000`
- `MONGO_URI` → e.g. `mongodb://127.0.0.1:27017/value_scout`
- `AI_API_URL` → e.g. `http://127.0.0.1:5000`
- `COLLECTION_NAME` (optional) → defaults to `products`

## Start (PowerShell)
```powershell
cd backend
npm install
$env:PORT=8000; $env:MONGO_URI="mongodb://127.0.0.1:27017/value_scout"; $env:AI_API_URL="http://127.0.0.1:5000"
npm run dev
```

## File-by-File Details

### `main_api_server.js` (Primary server)
- Setup: loads env, `express.json()`, `cors()`
- Mongo: `mongoose.connect(MONGO_URI)`; on success, `db = mongoose.connection.db`
- Flexible model: `Product` with `{ strict: false }` for convenience
- Endpoints:
  - `GET /` → health/status JSON
  - `GET /api/style-builder/:productId` → proxies to `${AI_API_URL}/api/style-builder/:productId`
    - Logs call, forwards status and body, handles errors robustly
  - `GET /api/search?q=...` → regex search across `productName`, `brand`, `category`, `source` (limit 100)
  - `GET /api/products-by-ids?ids=id1,id2,...` → returns matching docs by IDs (supports string IDs)
- Startup: listens on `PORT`, logs URL, sets global error handlers for uncaught/unhandled

### `minimal_server.js` (Minimal ESM boilerplate)
- Loads env, starts simple Express server, `GET /` only — useful for quick smoke tests

### `simple_server.js` (Dynamic import demo)
- Dynamically imports Express and serves `GET /` on port 8000; for sandbox testing

### `backend/package.json`
- Scripts:
  - `start`: `node main_api_server.js`
  - `dev`: `nodemon main_api_server.js`
  - Helpers for running AI/backend/frontend together (also provided at repo root)
- Deps: `express`, `mongoose`, `dotenv`, `cors`, `axios`; devDeps: `concurrently`, `nodemon`

## Request Flow
1. `/api/style-builder/:productId` → backend logs, proxies to Flask AI
2. AI returns `{ input_category, target_categories, recommendations }`
3. Frontend calls `/api/products-by-ids?ids=...` to hydrate full product docs
4. Results rendered in frontend tabs by category

## Common Issues
- AI API down → Ensure Flask at `AI_API_URL` is running
- Mongo not ready → Wait for "MongoDB connected successfully" log
- CORS in browser → Ensure `cors()` middleware is active

## Handy Commands
```powershell
# Start only backend
cd backend
npm run dev

# Start full stack from repo root
cd ..
npm run start:all
```
