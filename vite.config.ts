import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: [
      "same-runtime/dist/jsx-dev-runtime",
      "same-runtime/dist/jsx-runtime",
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5003', // Updated to current server port
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5003', // Proxy uploads to server
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
