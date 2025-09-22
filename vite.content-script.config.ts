import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        "content-script": path.resolve(
          __dirname,
          "src/scripts/content-script/content-script.tsx",
        ),
      },
      output: {
        format: "iife",
        entryFileNames: "[name].js",
      },
    },
  },
});
