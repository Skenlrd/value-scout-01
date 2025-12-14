import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Default to `localhost` (not `127.0.0.1`) to avoid OAuth origin/redirect mismatches
    // when Google Console only whitelists localhost during development.
    host: process.env.VITE_HOST || "localhost",
    port: 8080,
    // Proxy API calls to backend to avoid CORS and hardcoded ports in frontend
    proxy: {
      "/api": {
        target: process.env.BACKEND_PROXY_TARGET || "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
