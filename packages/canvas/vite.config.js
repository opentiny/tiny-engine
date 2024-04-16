/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { terser } from 'rollup-plugin-terser'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('tiny-i18n-host')
        }
      }
    }),
    vueJsx(),
    { ...terser({ module: true }), enforce: 'post' },
    {
      apply: 'build',
      enforce: 'post',
      generateBundle(_, bundle) {
        const cssFileName = 'style.css'
        const jsFileName = 'index.js'
        const { [cssFileName]: cssBundle } = bundle
        let IIFEcss = ''

        if (cssBundle) {
          IIFEcss = `(function() {try {var elementStyle = document.createElement('style');elementStyle.innerText = ${JSON.stringify(
            cssBundle.source
          )};document.head.appendChild(elementStyle);} catch(error) {console.error(error, 'unable to concat style inside the bundled file')}})()`
          delete bundle[cssFileName]
        }

        bundle[jsFileName].code += IIFEcss
      }
    }
  ],
  publicDir: false,
  build: {
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, './src/index.js'),
      name: 'canvas',
      fileName: () => 'index.js',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', '@vueuse/core', 'vue-i18n', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/]
    },
    minify: true
  }
})
