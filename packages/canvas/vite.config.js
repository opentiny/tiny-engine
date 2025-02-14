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
import { vitePluginBuildEntry } from './scripts/vite-plugin-separate-build'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',

  plugins: [
    vue(),
    vueJsx(),
    generateComments(),
    vitePluginBuildEntry({
      canvas: path.resolve(__dirname, './scripts/canvas-vite.config.js')
    })
  ],
  publicDir: false,
  build: {
    cssCodeSplit: true,
    lib: {
      entry: {
        index: path.resolve(__dirname, './index.js'),
        render: path.resolve(__dirname, './render/index.ts')
      },
      formats: ['es']
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        banner: (chunk) => {
          if (['index', 'render'].includes(chunk.name)) {
            return `import "./${chunk.name}.css"`
          }
          return ''
        }
      },
      external: ['vue', '@vueuse/core', 'vue-i18n', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/]
    },
    minify: true
  }
})
