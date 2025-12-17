import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    assetsDir: '',
    outDir: 'dist',
    lib: {
      entry: {
        index: resolve(__dirname, 'index.ts')
      },
      formats: ['es'],
      name: 'runtime-renderer',
      fileName: (_, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      output: {
        banner: (chunk) => {
          return ['index'].includes(chunk.name) && chunk.isEntry ? `import "./style.css"` : ''
        }
      },
      external: ['vue', '@vueuse/core', 'vue-i18n', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/]
    }
  }
})
