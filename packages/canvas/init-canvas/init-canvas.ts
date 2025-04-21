import canvasScript from './canvas?url&build=canvas'
import canvasHtml from './canvas.html?raw'

export function initCanvas(importMap = {}, importStyleUrls = []) {
  const res = {
    html: canvasHtml
      .replace('<!--%IMPORT_MAP%-->', `<script type="importmap">${JSON.stringify(importMap, null, 2)}</script>`)
      .replace(
        '<!--%IMPORT_STYLE%-->',
        importStyleUrls.map((styleUrl) => `<link rel="stylesheet" crossorigin="" href="${styleUrl}">`).join('\n')
      )
      .replace(
        '<!--%MAIN_SCRIPT%-->',
        import.meta.env.MODE === 'development'
          ? `<script type="module" src="${canvasScript}"></script>`
          : // 将 $ 替换为 $$，然后在上一层的 $$ 再转义回来 $，避免被转义
            `<script type="module">${canvasScript.replace(/\$/g, '$$$$')}</script>`
      )
  }

  return res
}
