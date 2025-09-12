import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    server: {
      port: parseInt(env.PORT) || 3000,
    },
    build: {
      rollupOptions: {
        input: {
          main: "index.html",
          "content-script": path.resolve(
            __dirname,
            "src/scripts/content-script/content-script.ts",
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
