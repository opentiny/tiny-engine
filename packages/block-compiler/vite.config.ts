import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import path from 'node:path'
import nodeGlobalsPolyfillPluginCjs from '@esbuild-plugins/node-globals-polyfill'
import nodeModulesPolyfillPluginCjs from '@esbuild-plugins/node-modules-polyfill'

// @ts-ignore
const nodeGlobalsPolyfillPlugin = nodeGlobalsPolyfillPluginCjs.default
// @ts-ignore
const nodeModulesPolyfillPlugin = nodeModulesPolyfillPluginCjs.default

// https://vite.dev/config/
export default defineConfig({
  plugins: [dts({ rollupTypes: true, tsconfigPath: './tsconfig.json' }), vue()],
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
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'block-compiler',
      fileName: (_format, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['@babel/core', '@vue/babel-plugin-jsx', 'vue', 'vue/compiler-sfc']
    }
  }
})
