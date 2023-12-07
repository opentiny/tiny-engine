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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  publicDir: false,
  resolve: {},
  define: {
    'process.env': {}
  },
  build: {
    cssCodeSplit: false,
    lib: {
      entry: {
        index: path.resolve(__dirname, './index.js')
      },
      name: 'common',
      fileName: (format, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      output: {
        banner: (chunk) => {
          if (chunk.name === 'index') {
            return 'import "./style.css"'
          }

          return ''
        }
      },
      external: ['vue', 'monaco-editor', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/, /^prettier.*/]
    }
  }
})
