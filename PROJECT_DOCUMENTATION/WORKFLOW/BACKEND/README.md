# Backend Workflow

Express.js backend that proxies AI requests, exposes search and batch product endpoints, and connects to MongoDB.

## Quick Start (PowerShell)
```powershell
# From repo root
cd backend
npm install
$env:PORT=8000; $env:MONGO_URI="mongodb://127.0.0.1:27017/value_scout"; $env:AI_API_URL="http://127.0.0.1:5000"
npm run dev
```

## Environment Variables
- `PORT`: default `8000`
- `MONGO_URI`: e.g. `mongodb://127.0.0.1:27017/value_scout`
- `AI_API_URL`: e.g. `http://127.0.0.1:5000`
- `COLLECTION_NAME` (optional): defaults to `products`

## Package Scripts (`backend/package.json`)
- `start`: `node main_api_server.js`
- `dev`: `nodemon main_api_server.js` (hot reload)
- `start:ai`: starts Flask AI from `../ai/ai_api.py`
- `start:backend`: start this server only
- `start:frontend`: start Vite frontend dev server
- `start:all`: run AI, backend, and frontend concurrently

## File-by-File

### `main_api_server.js` (Primary server)
- Loads env vars, sets up Express, CORS, and JSON body parsing
- Connects to MongoDB via `mongoose.connect(MONGO_URI)`
- Obtains raw DB handle: `mongoose.connection.db`
- Defines flexible `Product` model (`strict:false`) for convenience
- Endpoints:
  - `GET /`: health/status JSON
  - `GET /api/style-builder/:productId`:
    - Proxies to `${AI_API_URL}/api/style-builder/<productId>`
    - Logs request, forwards response or error status
  - `GET /api/search?q=<query>`:
    - Performs case-insensitive regex search across `productName`, `brand`, `category`, `source`
    - Limits to 100 results
  - `GET /api/products-by-ids?ids=id1,id2,...`:
    - Accepts IDs (ObjectId or string) and returns matching documents
- Startup:
  - Binds to `PORT`, logs URL, sets global error handlers

### `minimal_server.js` (Minimal starter)
- ESM-based minimal Express server with `dotenv` loaded
- Logs environment, exposes only `GET /` for quick verification

### `simple_server.js` (Quick example)
- Dynamic import of Express
- Starts tiny server on port 8000 returning "Server is running"

### `package.json`
- Declares runtime and dev dependencies (`express`, `mongoose`, `axios`, `dotenv`, `cors`, `concurrently`, `nodemon`)
- Provides `start:all` convenience script to run full stack

## Request Flow
1. Frontend calls `GET /api/style-builder/:productId`
2. Backend proxies to Flask: `GET ${AI_API_URL}/api/style-builder/:productId`
3. Receives JSON (ids + scores + categories)
4. Optionally fetches full product docs (`/api/products-by-ids`)
5. Responds to frontend

## Common Issues
- AI API unavailable → ensure AI service is running on `AI_API_URL`
- Mongo not initialized → wait for connection log or verify URI
- CORS errors in browser → ensure `cors()` middleware enabled

## Handy Commands (PowerShell)
```powershell
# Start only this server
cd backend
npm run dev

# Start entire stack from backend dir
npm run start:all
```
