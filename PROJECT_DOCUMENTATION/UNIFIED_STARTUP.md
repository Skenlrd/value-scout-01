# VALUE-SCOUT-01 — Unified Startup Guide

## 🚀 Quick Start (All Services Together)

```bash
npm run start:all
```

This single command starts **all three services** in parallel:
- **[AI]** Flask service on `http://localhost:5050`
- **[BACKEND]** Node API on `http://localhost:8000`
- **[UI]** React frontend on `http://localhost:5173`

All services connect to MongoDB at `mongodb://127.0.0.1:27017/value_scout`

---

## 📋 Prerequisites

Before running, ensure:

1. **MongoDB is running** on `localhost:27017`
   ```bash
   # Windows (if installed locally)
   mongod
   
   # Or Docker:
   docker run -d -p 27017:27017 --name mongo mongodb/mongodb-community-server:latest
   ```

2. **Python 3.8+** is installed and in PATH
3. **Node.js 16+** is installed

---

## 🔧 Installation (First Time Only)

```bash
# Install all dependencies
npm run install:all

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

---

## 🎯 Individual Service Commands

If you need to run services separately:

```bash
# Run only the AI service
npm run start:ai

# Run only the backend
npm run start:backend

# Run only the frontend
npm run start:frontend
```

---

## 📁 Service Details

### AI Service (`/ai`)
- **Language**: Python (Flask)
- **Port**: 5050
- **Startup**: `python ai_api.py`
- **Environment** (`.env`):
  ```
  MONGO_URI=mongodb://127.0.0.1:27017
  DB_NAME=value_scout
  COLLECTION_NAME=products
  FLASK_PORT=5050
  FLASK_ENV=development
  ```
- **Health Check**: `GET http://localhost:5050/health`
- **Main Route**: `GET /api/style-builder/<product_id>`

### Backend Service (`/backend`)
- **Language**: Node.js (Express)
- **Port**: 8000
- **Startup**: `node main_api_server.js`
- **Environment** (`.env`):
  ```
  PORT=8000
  MONGO_URI=mongodb://127.0.0.1:27017/value_scout
  AI_API_URL=http://127.0.0.1:5050
  ```
- **Routes**:
  - `GET /` — Health check
  - `GET /api/style-builder/:productId` — Proxy to AI
  - `GET /api/products-by-ids?ids=id1,id2,id3` — Batch product fetch
- **Features**:
  - Automatic MongoDB connection
  - AI service health check on startup
  - CORS enabled
  - Axios for proxying

### Frontend Service (`/frontend`)
- **Language**: React + TypeScript + Vite
- **Port**: 5173 (default, may vary)
- **Startup**: `npm run dev`
- **Build**: `npm run build`
- **Features**:
  - Vite dev proxy routes `/api/*` → `http://localhost:8000/api/*`
  - Global Navbar and layout
  - AI Style Builder modal
  - Compare Deals page
  - Search functionality

---

## ✅ Expected Startup Output

When running `npm run start:all`, you should see:

```
[AI]     🚀 Starting AI API on port 5050...
[BACKEND]  🔧 Backend Initializing...
[UI]     ➜  Local:   http://localhost:5173/

[AI]     ✅ MongoDB connection successful.
[BACKEND]  ✅ MongoDB connected successfully
[BACKEND]  🤖 Checking AI service...
[BACKEND]  ✅ AI service is healthy
[BACKEND]  🚀 Backend Server running on port 8000

[UI]     ready in 450ms.
```

---

## 🛑 Stopping All Services

Press `Ctrl+C` in the terminal. The `concurrently` tool will gracefully shut down all services.

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 5050
netstat -ano | findstr ":5050"

# Kill process (get PID from above, then):
taskkill /PID <PID> /F
```

### MongoDB Connection Refused
```bash
# Verify MongoDB is running:
netstat -ano | findstr ":27017"

# Start MongoDB:
mongod  # or Docker: docker run -d -p 27017:27017 mongodb/mongodb-community-server:latest
```

### AI Service Not Responding
The backend will log a warning but continue. Restart the AI service:
```bash
npm run start:ai
```

### Frontend Can't Reach Backend
Check that the Vite proxy is configured in `/frontend/vite.config.ts`:
```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    },
  },
}
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│         React Frontend (5173)               │
│  (Vite dev server with API proxy)           │
└──────────┬──────────────────────────────────┘
           │
           ├─ /api/* → Proxy to Backend ──┐
           │                               │
┌──────────▼──────────────────────────┐   │
│   Node.js Backend (8000)            │◄──┘
│  (Express + MongoDB driver)         │
└──────────┬──────────────────────────┘
           │
           ├─ Proxies /api/style-builder/* to AI ──┐
           │                                       │
           │ (Direct MongoDB connection)           │
           │                                       │
┌──────────▼──────────────────────────┐           │
│   Flask AI Service (5050)           │◄──────────┘
│  (Style recommendations engine)     │
└──────────┬──────────────────────────┘
           │
           └─ (Direct MongoDB connection)
           │
┌──────────▼──────────────────────────┐
│     MongoDB (27017)                 │
│  (Stores products & embeddings)     │
└─────────────────────────────────────┘
```

---

## 🔄 Development Workflow

1. **Start all services**: `npm run start:all`
2. **Edit code** in any service (auto-reload will trigger)
   - Frontend: Vite HMR auto-refreshes
   - Backend: (Currently no hot-reload; restart to apply changes)
   - AI: (Currently no hot-reload; restart to apply changes)
3. **Test changes** in browser at `http://localhost:5173`
4. **Check logs** in the terminal output (prefixed by service name)
5. **Debug API calls** via browser DevTools Network tab

---

## 📦 Scripts Reference

```json
{
  "scripts": {
    "start:all": "concurrently --names \"[AI],   [BACKEND], [UI]\" ... all three services",
    "start:ai": "cd ai && python ai_api.py",
    "start:backend": "cd backend && node main_api_server.js",
    "start:frontend": "cd frontend && npm run dev",
    "install:all": "cd backend && npm install && cd ../frontend && npm install && cd ..",
    "dev": "npm run start:all"
  }
}
```

---

## 🎓 Next Steps

- **Enable hot-reload for backend**: Use `npm run dev` in backend (requires `nodemon`)
- **Add API mocking**: For frontend development without services
- **Set up CI/CD**: GitHub Actions or similar
- **Production deployment**: Containerize with Docker

---

**Questions?** Check individual `.env` files and service logs.
