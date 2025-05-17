import path from 'node:path'

export const htmlUpgradeHttpsPlugin = (mode) => {
  const upgradeHttpsMetaTags = []
  const includeHtmls = ['index.html', 'preview.html', 'previewApp.html']

  if (mode === 'alpha' || mode === 'prod') {
    upgradeHttpsMetaTags.push({
      tag: 'meta',
      injectTo: 'head-prepend',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: 'upgrade-insecure-requests'
      }
    })
  }

  return {
    name: 'vite-plugin-html-upgrade-https',
    transformIndexHtml: {
      order: 'pre',
      handler(html, { filename }) {
        return {
          html,
          tags: includeHtmls.includes(path.basename(filename)) ? upgradeHttpsMetaTags : []
        }
      }
    }
  }
}
