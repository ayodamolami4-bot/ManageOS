import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Proxy API calls in local development and automated browser testing so
// HttpOnly session and CSRF cookies work with one browser origin.
// Production must supply its own HTTPS API/reverse-proxy configuration.
const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:5000",
    changeOrigin: false,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
});
