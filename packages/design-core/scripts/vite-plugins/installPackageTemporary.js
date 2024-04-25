import fs from 'node:fs'
import path from 'node:path'
import shelljs from 'shelljs'

export function installPackageTemporary(packageNeedToInstall, tempDir, logger = console) {
  return [
    {
      name: 'vite-plugin-install-package-temporary',
      buildStart() {
        if (packageNeedToInstall.every((pkg) => pkg.exist)) {
          logger.info(`[vite-plugin-install-package-temporary]: bundle dependencies packages exist, skip install `)
          return
        }

        let code = shelljs.mkdir('-p', tempDir).code
        if (code === 0) {
          //code 为 0 表示成功
          fs.writeFileSync(
            path.resolve(tempDir, 'package.json'),
            JSON.stringify(
              {
                name: 'bundle-deps', // tempDir to 烤串
                dependencies: Object.fromEntries(packageNeedToInstall.map((cur) => [cur.packageName, cur.version]))
              },
              null,
              2
            ),
            { encoding: 'utf-8' }
          )
        }
        code =
          code ||
          shelljs.cd(tempDir).code ||
          shelljs.exec(`npm install --force`).code ||
          shelljs.cd(path.relative(tempDir, '.')).code

        if (code === 0) {
          logger.info(
            `[vite-plugin-install-package-temporary]: bundle dependencies package install success, total ${packageNeedToInstall.length} package(s)`
          )
        } else {
          logger.warn(`[vite-plugin-install-package-temporary]: bundle dependencies package install failed`)
        }
      }
    }
  ]
}
