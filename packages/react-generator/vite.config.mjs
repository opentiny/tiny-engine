import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname 在 ESM 中不可用，这里手动计算
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.js'),
      formats: ['cjs', 'es']
    },
    sourcemap: true,
    rollupOptions: {
      external: ['@babel/parser', '@babel/traverse']
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: './src/index.d.ts',
          dest: '.'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.ts']
  },
  test: {
    exclude: ['**/result/**'],
    watchExclude: ['**/result/**']
  }
})
