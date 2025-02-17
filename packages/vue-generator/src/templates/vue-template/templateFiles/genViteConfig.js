export default (schema, icons = []) => {
  // 避免在构建的时候，被 process. env 替换
  const processStr = ['process', 'env']

  const createCollectionLoaders = (list) => {
    return list.map((name) => `${name}:FileSystemIconLoader("src/assets/icons/${name}")`).join(',')
  }

  const createCollectionNames = (list) => {
    return list.map((name) => `'${name}'`).join(',')
  }

  const res = `
  import { defineConfig } from 'vite'
  import path from 'path'
  import vue from '@vitejs/plugin-vue'
  import vueJsx from '@vitejs/plugin-vue-jsx'

  import Icons from "unplugin-icons/vite";
  import { FileSystemIconLoader } from "unplugin-icons/loaders";
  import IconsResolver from "unplugin-icons/resolver";
  import Components from "unplugin-vue-components/vite";

  export default defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      vue(),
      vueJsx(),
      Icons({
        autoInstall: true,
        compiler: "vue3",
        customCollections: {
          ${createCollectionLoaders(icons)}
        },
        iconCustomizer(collection, icon, props) {

        },
      }),
      Components({
        dts: true,
        resolvers: [
          IconsResolver({
            prefix: 'i',
            alias: {
            },
            customCollections: [${createCollectionNames(icons)}],
          }),
        ],
      }),
    ],
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
