export default () => {
  // 避免在构建的时候，被 process. env 替换
  const processStr = ['process', 'env']

  const res = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
  },
  define: {
    "process.env": {...${processStr.join('.')}}
  },
  build: {
    outDir: "dist",
  },
  envDir: "env",
});
`

  return res
}
