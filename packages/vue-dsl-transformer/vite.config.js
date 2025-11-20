import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3600,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  define: {
    'global': 'globalThis'
  }
})