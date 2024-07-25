export function genImportMapPlugin(importMap, importMapStyles) {
  return {
    name: 'vite-plugin-gen-import-map',
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
              children: JSON.stringify(importMap, null, 2),
              injectTo: 'head-prepend'
            },
            ...(importMapStyles || []).map((url) => ({
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
