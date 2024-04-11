import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import path from "node:path";

const isLibraryBuild = process.env.BUILD_MODE === "library";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vue(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: isLibraryBuild
    ? {
        lib: {
          entry: path.resolve(__dirname, "src/lib.ts"),
          name: "engine-ai-plugins",
          fileName: () => "index.js",
          formats: ["es"],
        },
        rollupOptions: {
          // output: {
          //   banner: 'import "./style.css"',
          // },
          external: ["vue", /@opentiny\/tiny-engine.*/],
        },
      }
    : {},
});
