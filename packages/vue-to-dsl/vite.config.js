import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'TinyEngineVueToDsl',
      formats: ['es', 'cjs'],
      fileName: (format) => `tiny-engine-vue-to-dsl.${format === 'es' ? 'js' : format}`
    },
    rollupOptions: {
      external: [
        'vue',
        '@vue/compiler-sfc',
        '@vue/compiler-dom',
        '@babel/parser',
        '@babel/traverse',
        '@babel/types',
        'node:fs',
        'node:fs/promises',
        'node:path',
        'node:url'
      ],
      output: {
        globals: {
          vue: 'Vue',
          '@vue/compiler-sfc': 'VueCompilerSFC',
          '@vue/compiler-dom': 'VueCompilerDOM',
          '@babel/parser': 'BabelParser',
          '@babel/traverse': 'BabelTraverse',
          '@babel/types': 'BabelTypes'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
