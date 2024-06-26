export default () => {
  // 避免在构建的时候，被 process. env 替换
  const processStr = ['process', 'env']

  const res = `
  import { defineConfig } from 'vite'
  import path from 'path'
  import vue from '@vitejs/plugin-vue'
  import vueJsx from '@vitejs/plugin-vue-jsx'
  
  export default defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [vue(), vueJsx()],
    define: {
      '${processStr.join('.')}': { ...${processStr.join('.')} }
    },
    build: {
      minify: true,
      commonjsOptions: {
        transformMixedEsModules: true
      },
      cssCodeSplit: false
    }
  })`

  return res
}
