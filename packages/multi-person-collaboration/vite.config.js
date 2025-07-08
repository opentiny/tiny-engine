/**
 * Copyright (c) 2025 - present TinyEngine Authors.
 * Copyright (c) 2025 - present Huawei Cloud Computing Technologies Co., Ltd.
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
import path from 'path'
import { globSync } from 'glob'
import { fileURLToPath } from 'node:url'

// 动态收集核心模块和 Vue UI 组件作为额外入口
const coreEntries = globSync('./src/core/**/*.js').map((file) => {
  return [
    file.slice(0, file.length - path.extname(file).length), // 去掉后缀
    fileURLToPath(new URL(file, import.meta.url))
  ]
})

const uiEntries = globSync('./src/ui/**/*.vue').map((file) => {
  return [file.slice(0, file.length - path.extname(file).length), fileURLToPath(new URL(file, import.meta.url))]
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  publicDir: false,
  base: './',
  resolve: {},
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
        ...Object.fromEntries(coreEntries),
        ...Object.fromEntries(uiEntries)
      },
      name: 'multi-person-collaboration',
      fileName: (format, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', 'yjs', 'y-websocket', /^@babel.*/]
    }
  }
})
