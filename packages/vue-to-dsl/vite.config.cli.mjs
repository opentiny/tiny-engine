import { defineConfig } from 'vite'
import path from 'node:path'

// 专用于打包 CLI 入口 cli.ts，输出为 dist/cli.js（CJS）
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'cli.ts'),
      name: 'tiny-vue-to-dsl-cli',
      formats: ['cjs'],
      fileName: () => 'cli.cjs'
    },
    rollupOptions: {
      external: [
        'fs',
        'fs/promises',
        'path',
        'url',
        'os',
        'jszip',
        'vue',
        '@vue/compiler-sfc',
        '@vue/compiler-dom',
        '@babel/parser',
        '@babel/traverse',
        '@babel/types'
      ]
    },
    sourcemap: false,
    emptyOutDir: false
  }
})
