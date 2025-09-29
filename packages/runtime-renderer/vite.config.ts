import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'TinyEngineRuntimeRenderer',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', '@opentiny/vue'],
      output: {
        globals: {
          vue: 'Vue',
          '@opentiny/vue': 'TinyVue'
        }
      }
    }
  }
})
