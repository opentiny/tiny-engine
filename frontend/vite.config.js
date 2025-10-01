import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 使用 path.resolve
    }
  }
})
