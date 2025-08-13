import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'TinyEngineVueToDsl',
      fileName: (format) => `tiny-engine-vue-to-dsl.${format === 'es' ? 'js' : format}`
    },
    rollupOptions: {
      external: ['vue', '@vue/compiler-sfc', '@vue/compiler-dom', '@babel/parser', '@babel/traverse', '@babel/types'],
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
