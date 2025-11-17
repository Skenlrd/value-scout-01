# FRONTEND_WORKFLOW

React + TypeScript + Vite frontend that consumes backend APIs and renders the AI Style Builder experience.

## Overview
- Framework: React 18 + Vite
- Styling: Tailwind + component primitives under `src/components/ui`
- Dev server: `http://localhost:5173` (proxy `/api/*` → backend)

## Project Structure (key parts)
- `src/main.tsx` → app entry
- `src/App.tsx` → routes/layout
- `src/pages/` → `Home.tsx`, `Compare.tsx`, `Auth.tsx`, `NotFound.tsx`, `StyleBuilderSearchPage.tsx`
- `src/components/`
  - Product/UI: `ProductCard.tsx`, `ComparisonProductCard.tsx`, `DealCard.tsx`, `WishlistCard.tsx`
  - Navigation/Input: `Navbar.tsx`, `SearchBar.tsx`, `PasswordInput.tsx`
  - Primitives: `components/ui/*` (dialog, tabs, button, input, etc.)
- `src/hooks/` → `useAuth.ts`, `use-toast.ts`, `use-mobile.tsx`
- `src/lib/utils.ts` → helpers

## AI Style Builder Flow
1. User clicks AI button on a product card (Dialog opens)
2. Frontend calls backend: `GET /api/style-builder/:productId`
3. Receives `input_category`, `target_categories`, `recommendations[]`
4. Frontend fetches full product docs: `GET /api/products-by-ids?ids=...`
5. Filters to target categories and removes duplicates (by `productUrl`)
6. Renders tabs: `All` + one per present category

## API Endpoints Used
- `GET /api/style-builder/:productId`
- `GET /api/products-by-ids?ids=...`
- `GET /api/search?q=...`

## Dev Setup (PowerShell)
```powershell
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

## Tips
- Ensure backend (8000) and AI API (via backend) are reachable
- Check Network tab in DevTools for responses
- Vite proxy config lives in `frontend/vite.config.ts`
