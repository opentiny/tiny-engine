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
import { glob } from 'glob'
import { fileURLToPath } from 'node:url'

const jsEntries = glob.sync('./js/**/*.js').map((file) => {
  return [file.slice(0, file.length - path.extname(file).length), fileURLToPath(new URL(file, import.meta.url))]
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  publicDir: false,
  resolve: {},
  base: './',
  define: {
    'import.meta': 'import.meta',
    'import.meta.env.MODE': 'import.meta.env.MODE',
    'import.meta.env.PROD': 'import.meta.env.PROD',
    'import.meta.env.BASE_URL': 'import.meta.env.BASE_URL'
  },
  build: {
    cssCodeSplit: false,
    lib: {
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
        adapter: path.resolve(__dirname, './adapter.js'),
        utils: path.resolve(__dirname, './utils.js'),
        ...Object.fromEntries(jsEntries)
      },
      name: 'controller',
      fileName: (formats, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', 'vue-i18n', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/, /^prettier.*/, /^@babel.*/]
    }
  }
})
