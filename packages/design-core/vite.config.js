import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import nodeGlobalsPolyfillPluginCjs from '@esbuild-plugins/node-globals-polyfill'
import nodeModulesPolyfillPluginCjs from '@esbuild-plugins/node-modules-polyfill'
import nodePolyfill from 'rollup-plugin-polyfill-node'
import { fileURLToPath } from 'node:url'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const nodeGlobalsPolyfillPlugin = nodeGlobalsPolyfillPluginCjs.default
const nodeModulesPolyfillPlugin = nodeModulesPolyfillPluginCjs.default

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const addViteIgnorePlugin = () => {
  return {
    name: 'add-vite-ignore',
    transform(code, id) {
      const regexp = /new URL\("data:text\/javascript;base64,/g
      // 往 new URL 后面添加 /* @vite-ignore */，避免 vite 打包时，输出超长的 base64 字符串
      if (id.endsWith('.js') && regexp.test(code)) {
        const modified = code.replace(regexp, 'new URL(/* @vite-ignore */"data:text/javascript;base64,')
        return {
          code: modified,
          map: null
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    // 复制 import-map.json到产物，提供给构建插件读取
    viteStaticCopy({
      targets: [
        {
          src: './node_modules/@opentiny/tiny-engine-common/dist/import-map.json',
          dest: '.'
        }
      ]
    })
  ],
  publicDir: false,
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        nodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        }),
        nodeModulesPolyfillPlugin()
      ]
    }
  },
  base: './',
  define: {
    'import.meta': 'import.meta',
    'import.meta.env.MODE': 'import.meta.env.MODE',
    'import.meta.env.PROD': 'import.meta.env.PROD',
    'import.meta.env.BASE_URL': 'import.meta.env.BASE_URL',
    'import.meta.env.VITE_ORIGIN': 'import.meta.env.VITE_ORIGIN',
    'import.meta.env.VITE_CDN_DOMAIN': 'import.meta.env.VITE_CDN_DOMAIN',
    'import.meta.env.VITE_API_MOCK': 'import.meta.env.VITE_API_MOCK',
    'import.meta.env.VITE_CDN_TYPE': 'import.meta.env.VITE_CDN_TYPE',
    'import.meta.env.VITE_LOCAL_IMPORT_PATH': 'import.meta.env.VITE_LOCAL_IMPORT_PATH',
    'import.meta.env.VITE_LOCAL_IMPORT_MAPS': 'import.meta.env.VITE_LOCAL_IMPORT_MAPS'
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      exclude: ['node_modules/*monaco-editor*/**', 'node_modules/lodash-es/**', 'node_modules/@types/lodash-es/**']
    },
    minify: true,
    sourcemap: true,
    lib: {
      entry: {
        index: path.resolve(__dirname, 'index.js')
      },
      name: 'tiny-engine',
      fileName: (_, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      plugins: [nodePolyfill({ include: null }), addViteIgnorePlugin()],
      output: {
        banner: (chunk) => {
          if (chunk.name === 'index') {
            return 'import "./style.css"'
          }
        }
      },
      external: ['vue', 'monaco-editor', 'prettier', /@opentiny\/vue.*/, /@opentiny\/tiny-engine.*/]
    }
  }
})
