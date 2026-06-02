import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const apiTarget = process.env.API_URL ?? "http://localhost:5001";


export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "sonner"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          // Never split React — duplicate copies break hooks (useState is null).
          if (/\/node_modules\/react(-dom)?\//.test(id)) return undefined;
          if (id.includes("framer-motion")) return "framer-motion";
          if (id.includes("@radix-ui")) return "radix-ui";
          if (id.includes("lucide-react")) return "lucide";
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: true,
    port: Number(process.env.VITE_PORT ?? 5000),
    strictPort: true,
    hmr: false,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: Number(process.env.PORT ?? 4173),
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
