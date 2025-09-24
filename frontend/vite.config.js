import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración de Vite
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Redirige llamadas a /auth, /inventory, /purchases hacia el backend
      "/auth": "http://127.0.0.1:8000",
      "/inventory": "http://127.0.0.1:8000",
      "/purchases": "http://127.0.0.1:8000",
    },
  },
  build: {
    outDir: "dist", // Carpeta de producción que FastAPI servirá
  },
});
