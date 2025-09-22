export default (schema, options) => {
  // 避免在构建的时候，被 process. env 替换
  const processStr = ['process', 'env']

  const res = `
  import { defineConfig } from 'vite'
  import path from 'path'
  import vue from '@vitejs/plugin-vue'
  import vueJsx from '@vitejs/plugin-vue-jsx'
  ${options.enableTailwindCSS ? 'import tailwindcss from "@tailwindcss/vite"' : ''}
  
  export default defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [vue(), vueJsx(), ${options.enableTailwindCSS ? 'tailwindcss()' : ''}],
    define: {
      '${processStr.join('.')}': { }
    },
    build: {
      minify: true,
      commonjsOptions: {
        transformMixedEsModules: true
      },
      cssCodeSplit: false
    },
    base: './'
  })`

  return res
}
