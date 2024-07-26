import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import nodeGlobalsPolyfillPluginCjs from '@esbuild-plugins/node-globals-polyfill'
import nodeModulesPolyfillPluginCjs from '@esbuild-plugins/node-modules-polyfill'
import nodePolyfill from 'rollup-plugin-polyfill-node'
import { fileURLToPath } from 'node:url'

const nodeGlobalsPolyfillPlugin = nodeGlobalsPolyfillPluginCjs.default
const nodeModulesPolyfillPlugin = nodeModulesPolyfillPluginCjs.default

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue(), vueJsx()],
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
    'import.meta.env.VITE_API_MOCK': 'import.meta.env.VITE_API_MOCK'
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
      plugins: [nodePolyfill({ include: null })],
      output: {
        banner: (chunk) => {
          if (chunk.name === 'index') {
            return 'import "./style.css"'
          }
        }
      },
      external: ['vue', 'monaco-editor', 'prettier', /@opentiny\/vue.*/, '@opentiny/tiny-engine-meta-register']
    }
  }
})
