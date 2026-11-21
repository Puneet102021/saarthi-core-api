import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/*
  In development the app talks to the API through Vite's proxy, so requests
  stay same-origin exactly as they are in production behind nginx.
  Point VITE_API_TARGET at a local API (http://localhost:4100) if you run one.
*/
const target = process.env.VITE_API_TARGET || "https://srv1925899.hstgr.cloud";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target, changeOrigin: true },
      "/auth": { target, changeOrigin: true }
    }
  }
});
