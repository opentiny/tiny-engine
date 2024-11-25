import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [dts({ rollupTypes: true }), vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'block-compiler',
      fileName: () => 'index.js',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', 'vue/compiler-sfc', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/]
    }
  }
})
