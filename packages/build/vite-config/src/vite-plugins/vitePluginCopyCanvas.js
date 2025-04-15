import path from 'node:path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export function vitePluginCopyCanvas(options = {}) {
  let { useSource, assetsDir } = options
  if (!assetsDir) {
    assetsDir = useSource
      ? path.resolve(process.cwd(), '..', 'packages/design-core/dist/assets/canvas.js')
      : path.resolve(process.cwd(), 'node_modules/@opentiny/tiny-engine/dist/assets/canvas.js')
  }
  return [
    ...viteStaticCopy({
      targets: [
        {
          src: assetsDir,
          dest: 'assets/'
        }
      ]
    })
  ]
}
