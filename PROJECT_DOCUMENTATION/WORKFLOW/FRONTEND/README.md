# Frontend Workflow

React + TypeScript + Vite app that consumes backend APIs and renders the AI Style Builder UI.

## Quick Start (PowerShell)
```powershell
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

## Structure
- `src/main.tsx`: App entry
- `src/App.tsx`: Routes and layout
- `src/pages/`: Page-level views
  - `Home.tsx`, `Compare.tsx`, `Auth.tsx`, `NotFound.tsx`, `StyleBuilderSearchPage.tsx`
- `src/components/`: UI components
  - `ProductCard.tsx`, `ComparisonProductCard.tsx`, `DealCard.tsx`, `Navbar.tsx`, `SearchBar.tsx`, `PasswordInput.tsx`, `WishlistCard.tsx`
  - `ui/*`: Headless, reusable primitives (accordion, dialog, tabs, etc.)
- `src/hooks/`: `useAuth`, `use-mobile`, `use-toast`
- `src/lib/utils.ts`: helpers
- `index.html`: Vite HTML shell

## Style Builder UI
- Product card uses an "AI" trigger button to open a dialog modal
- Modal fetches recommendations, then fetches full product docs by IDs
- Tabs derived from `target_categories` allow quick filtering by category
- De-duplication by `productUrl` to avoid repeats

## API Integration
- Proxy (dev): `/api/*` → `http://localhost:8000`
- Endpoints used:
  - `GET /api/style-builder/:productId`
  - `GET /api/products-by-ids?ids=...`
  - `GET /api/search?q=...`

## Development
- Linting/formatting via project configs
- Vite HMR for fast feedback
- Tailwind config in `tailwind.config.ts`

## Notes
- Ensure backend on 8000 and AI API reachable via backend
- Check browser console network tab for API responses
