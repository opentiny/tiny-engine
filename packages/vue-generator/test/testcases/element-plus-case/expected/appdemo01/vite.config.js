import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [vue(), vueJsx()],
  define: {
    'process.env': { ...process.env }
  },
  build: {
    minify: true,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    cssCodeSplit: false
  }
})
