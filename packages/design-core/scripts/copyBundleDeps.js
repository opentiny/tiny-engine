import fs from 'node:fs'
import path from 'node:path'
import shelljs from 'shelljs'
import { babelReplaceImportPathWithCertainFIleName } from './replaceImportPath.mjs'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export function readJsonFile(filename) {
  const filepath = path.resolve(filename)
  const content = fs.readFileSync(filepath, { encoding: 'utf-8' })
  const json = JSON.parse(content)
  return json
}
export function extraBundleCdnLink(filename, originCdnPrefix) {
  const result = []
  const bundle = readJsonFile(filename)
  bundle.data?.materials?.components?.forEach((component) => {
    if (component.npm) {
      const possibleUrl = [component.npm.script, component.npm.css]
      possibleUrl.forEach((url) => {
        if (url?.startsWith(originCdnPrefix)) {
          result.push(url)
        }
      })
    }
  })
  return result.reduce((acc, cur) => {
    if (!acc.includes(cur)) {
      acc.push(cur)
    }
    return acc
  }, [])
}

export function replaceBundleCdnLink(bundleContent, originUrl, newUrl) {
  bundleContent.data?.material?.forEach((component) => {
    if (component.npm) {
      const possibleUrl = [component.npm.script, component.npm.css]
      possibleUrl.forEach((url) => {
        if (url.equals(originUrl)) {
          url = newUrl
        }
      })
    }
  })
}

export function installPackageTemporary(packageNeedToInstall, tempDir, logger = console) {
  return [
    {
      name: 'vite-plugin-install-package-temporary',
      buildStart() {
        if (packageNeedToInstall.some((pkg) => !pkg.exist)) {
          let code = shelljs.mkdir('-p', tempDir).code
          code ||
            fs.writeFileSync(
              path.resolve(tempDir, 'package.json'),
              JSON.stringify(
                {
                  name: 'bundle-deps',
                  dependencies: packageNeedToInstall.reduce((acc, cur) => {
                    acc[cur.packageName] = cur.version
                    return acc
                  }, {})
                },
                null,
                2
              ),
              { encoding: 'utf-8' }
            )
          code = code || shelljs.cd(tempDir).code || shelljs.exec(`npm install`).code || shelljs.cd('../').code

          if (code !== 0) {
            logger.warn(`[vite-plugin-install-package-temporary]: bundle dependencies package install failed`)
          } else {
            logger.info(
              `[vite-plugin-install-package-temporary]: bundle dependencies package install success, total ${packageNeedToInstall.length} package(s)`
            )
          }
        } else {
          logger.info(`[vite-plugin-install-package-temporary]: bundle dependencies packages exist, skip install `)
        }
      }
    }
  ]
}

export function CopyBundleDeps(
  bundleFile,
  targetBundleFile,
  originCdnPrefix,
  base,
  dir,
  bundleTempDir = 'bundle-deps'
) {
  const files = extraBundleCdnLink(bundleFile, originCdnPrefix).map((url) => {
    const relativeUrl = url.replace(new RegExp('^' + originCdnPrefix + '/?'), '')
    const packageName = relativeUrl.match(/^(.+?)@/)[1]
    let version = relativeUrl.match(new RegExp('^' + packageName + '@([^/]+)'))[1]
    const baseSlash = base.endsWith('/') ? '' : '/'
    const filePathInPackage = `${relativeUrl.replace(new RegExp('^' + packageName + '@' + version), '')}`
    let src = `node_modules/${packageName}${filePathInPackage}`
    const sourceExist = fs.existsSync(path.resolve(src))
    let sourceExistExternal = false
    if (sourceExist) {
      const content = readJsonFile(`node_modules/${packageName}/package.json`)
      version = content.version
    } else {
      src = bundleTempDir + '/' + src
      sourceExistExternal = fs.existsSync(path.resolve(src)) // 安装过的不重新安装
    }
    const newRelativeUrl = `${packageName}@${version}${filePathInPackage}`
    return {
      originUrl: url,
      newUrl: `${base}${baseSlash}${dir}/${newRelativeUrl}`,
      src,
      dest: `${dir}/${newRelativeUrl}`.replace(/\/([^/]*?)$/, ''),
      packageName,
      version,
      sourceExist,
      sourceExistExternal,
      transform: url.endsWith('.js')
        ? (content, filename) => {
            const result = babelReplaceImportPathWithCertainFIleName(content, filename, console)
            return result.code || content
          }
        : null
    }
  })

  const packageNeedToInstall = files
    .filter((item) => !item.sourceExist)
    .map(({ packageName, version, sourceExistExternal: exist }) => ({ packageName, version, exist }))
    .reduce((acc, cur) => {
      if (!acc.some(({ packageName }) => cur.packageName === packageName)) {
        acc.push(cur)
      }
      return acc
    }, [])

  if (packageNeedToInstall.length) {
    files.forEach((file) => {
      const samePackage = packageNeedToInstall.find(({ packageName }) => packageName === file.packageName)
      if (samePackage) {
        file.version = samePackage.version
      }
    })
  }

  const plugin = () => {
    return [
      ...installPackageTemporary(packageNeedToInstall, bundleTempDir),
      ...viteStaticCopy({
        targets: [
          ...files.map(({ src, dest, transform }) => ({
            src,
            dest,
            transform
          })),
          {
            src: bundleFile,
            dest: targetBundleFile.replace(/\/([^/]*?)$/, ''),
            transform: (content) => {
              files.forEach(({ originUrl, newUrl }) => {
                replaceBundleCdnLink(content, originUrl, newUrl)
              })
              return content
            },
            overwrite: true // 覆盖public的
          }
        ]
      })
    ]
  }
  return {
    plugin
  }
}
