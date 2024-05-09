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

/**
 * 嵌入<script type="importmap">到html头部，并且使用ViteConfig.build.rollupOptions.external排除importmap声明的依赖构建
 * @param {*} importmap <script type="importmap">的结构
 * @param {Array<string>} importMapStyles css样式文件url
 * @returns
 */
const importmapPlugin = (importmap, importMapStyles = []) => {
  return {
    name: 'vite-plugin-importmap',
    config() {
      return {
        build: {
          rollupOptions: {
            external: Object.keys(importmap.imports)
          }
        }
      }
    },
    transformIndexHtml: {
      enforce: 'pre',
      transform(html) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: {
                type: 'importmap'
              },
              children: JSON.stringify(importmap, null, 2),
              injectTo: 'head-prepend'
            },
            ...importMapStyles.map((url) => ({
              tag: 'link',
              attrs: {
                rel: 'stylesheet',
                href: url
              },
              injectTo: 'head-prepend'
            }))
          ]
        }
      }
    }
  }
}

export { importmapPlugin }
