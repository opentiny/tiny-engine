import canvasScript from './canvas?url&build=canvas'
import canvasHtml from './canvas.html?raw'

export function initCanvas(importmapData = {}) {
  return {
    html: canvasHtml
      .replace(`<!--%IMPORT_MAP%-->`, `<script type="importmap">${JSON.stringify(importmapData, null, 2)}</script>`)
      .replace(`<!--%MAIN_SCRIPT%-->`, `<script type="module" src="${canvasScript}"></script>`)
  }
}
