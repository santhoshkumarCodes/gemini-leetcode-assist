import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: parseInt(env.PORT) || 3000,
    },
    build: {
      rollupOptions: {
        input: {
          main: "index.html",
          "content-script": path.resolve(
            __dirname,
            "src/scripts/content-script/content-script.tsx",
          ),
          background: path.resolve(__dirname, "src/scripts/background.ts"),
          "injected-script": path.resolve(
            __dirname,
            "src/scripts/injected/injected-script.js",
          ),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
  };
});
