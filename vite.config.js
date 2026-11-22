import { defineConfig } from "vite";

// base: "./" 让 dist/ 可以放在任意子路径（如 GitHub Pages）下直接打开
export default defineConfig({
  base: "./",
  build: { chunkSizeWarningLimit: 1200 },
});
