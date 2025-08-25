import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  publicDir: false,
  resolve: {},
  base: './',
  define: {
    'import.meta': 'import.meta'
  },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'reactToDsl',
      fileName: () => 'index.js',
      formats: ['es']
    },
    rollupOptions: {
      external: [/^@babel.*/, 'react', 'react-dom', 'nanoid']
    }
  }
})
