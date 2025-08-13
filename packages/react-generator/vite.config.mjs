import { defineConfig } from 'vite'
import path from 'path'
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