import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  publicDir: false,
  resolve: {},
  build: {
    lib: {
      entry: path.resolve(__dirname, './index.js'),
      name: 'toolbar-codesandbox',
      fileName: () => 'index.js',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/]
    }
  }
})
