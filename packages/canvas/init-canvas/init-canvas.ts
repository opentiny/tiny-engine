import canvasScript from './canvas?url&build=canvas'
import canvasHtml from './canvas.html?raw'

export function initCanvas(importMap = {}, importStyleUrls = []) {
  return {
    html: canvasHtml
      .replace('<!--%IMPORT_MAP%-->', `<script type="importmap">${JSON.stringify(importMap, null, 2)}</script>`)
      .replace(
        '<!--%IMPORT_STYLE%-->',
        importStyleUrls.map((styleUrl) => `<link rel="stylesheet" crossorigin="" href="${styleUrl}">`).join('\n')
      )
      .replace('<!--%MAIN_SCRIPT%-->', () => {
        if (import.meta.env.MODE === 'development') {
          return `<script type="module" src="${canvasScript}"></script>`
        }

        return `<script type="module">${canvasScript}</script>`
      })
  }
}
