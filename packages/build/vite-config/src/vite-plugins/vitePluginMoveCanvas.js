import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
export function vitePluginMoveCanvas(options = {}) {
  let resolvedConfig
  return {
    name: 'vite-plugin-move-canvas',
    configResolved(config) {
      resolvedConfig = config
    },
    writeBundle() {
      const { publicPath = 'assets', assetsPath = '../packages/canvas/dist/assets' } = options
      const assetsDir = path.join(resolvedConfig.root, assetsPath)
      const distPath = path.join(resolvedConfig.root, resolvedConfig.build.outDir, resolvedConfig.base, publicPath)
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true })
      }
      fg([`${assetsDir}/*`]).then((files) => {
        files.forEach((file) => {
          const contentBuffer = fs.readFileSync(file)
          const fileName = path.basename(file)
          fs.writeFileSync(`${distPath}/${fileName}`, contentBuffer)
        })
      })
    }
  }
}
