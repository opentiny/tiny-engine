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
import generateComment from '@opentiny/tiny-engine-vite-plugin-meta-comments'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [generateComment(), vue(), vueJsx()],
  publicDir: false,
  resolve: {},
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, './index.ts'),
      name: 'plugin-version-control',
      fileName: (_format, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      output: {
        banner: 'import "./style.css"'
      },
      external: ['vue', /@opentiny\/tiny-engine.*/, /@opentiny\/vue.*/]
    }
  },
  // Vitest 配置
  test: {
    globals: true, // 让 describe/it/expect 全局可用
    environment: 'jsdom', // 模拟浏览器环境
    // setupFiles: './tests/setup.ts', // 可选：初始化文件
    coverage: {
      reporter: ['text', 'json', 'html'] // 覆盖率报告
    }
  }
})
