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
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import nodePolyfill from 'rollup-plugin-polyfill-node'
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueJsx(),
    {
      name: 'vite-plugin-style-inline-loader',
      apply: 'build',
      enforce: 'post',
      generateBundle(_, bundle) {
        const jsFiles = Object.keys(bundle).filter((fileName) => fileName.endsWith('.js'))
        jsFiles.forEach((jsFileName) => {
          const importedCssFile = [...bundle[jsFileName].viteMetadata.importedCss]
          const importCSSContent = importedCssFile.map((cssFileName) => bundle[cssFileName].source).join()
          let IIFEcss = ''
          if (importCSSContent) {
            IIFEcss = `(function() {try {var elementStyle = document.createElement('style');elementStyle.innerText = ${JSON.stringify(
              importCSSContent
            )};document.head.appendChild(elementStyle);} catch(error) {console.error(error, 'unable to concat style inside the bundled file')}})()`
          }
          bundle[jsFileName].code += IIFEcss
          importedCssFile.forEach((cssFileName) => {
            delete bundle[cssFileName]
          })
        })
      }
    }
  ],
  publicDir: false,
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      plugins: [nodePolyfill({ include: null })],
      external: [
        'vue',
        'vue-i18n',
        // 以下内容由于区块和物料公用需要external
        '@opentiny/vue',
        '@opentiny/vue-icon'
      ]
    },
    minify: true
  }
})
