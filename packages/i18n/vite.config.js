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

import vue from '@vitejs/plugin-vue'
import path from 'path'

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将所有包含短横线的标签作为自定义元素处理
          isCustomElement: (tag) => tag.includes('-')
        }
      }
    })
  ],
  build: {
    minify: false,
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, './src/lib.js'),
      name: 'LowcodeDesignI18nHost',
      formats: ['es', 'umd'],
      fileName: (format) => `lowcode-design-i18n-host.${format}.js`
    },
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'vue-i18n', '@opentiny/tiny-engine-webcomponent-core'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          'vue-i18n': 'VueI18n',
          '@opentiny/tiny-engine-webcomponent-core': 'LowcodeDesignWebcomponentCore'
        }
      }
    }
  }
}
