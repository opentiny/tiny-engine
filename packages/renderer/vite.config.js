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
import generateComments from '@opentiny/tiny-engine-vite-plugin-meta-comments'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), generateComments()],
  publicDir: false,
  build: {
    cssCodeSplit: true,
    lib: {
      entry: path.resolve(__dirname, './src/index.js'),
      name: 'renderer',
      fileName: () => 'index.js',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        banner: 'import "./index.css"'
      },
      external: ['vue', '@vueuse/core', 'vue-i18n', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/]
    },
    minify: true
  }
})
