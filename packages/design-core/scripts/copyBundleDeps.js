import fs from 'node:fs'
import path from 'node:path'
import shelljs from 'shelljs'
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
        if (url?.startsWith(originCdnPrefix) && !result.includes(url)) {
          result.push(url)
        }
      })
    }
  })
  return result
}

export function replaceBundleCdnLink(bundle, fileMap) {
  bundle.data?.materials?.components?.forEach((component) => {
    if (component.npm) {
      const possibleUrl = ['script', 'css']
      possibleUrl.forEach((key) => {
        const matchRule = fileMap.find((rule) => component.npm[key] === rule.originUrl)
        if (matchRule) {
          component.npm[key] = matchRule.newUrl
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
                name: 'bundle-deps',
                dependencies: Object.fromEntries(packageNeedToInstall.map((cur) => [cur.packageName, cur.version]))
              },
              null,
              2
            ),
            { encoding: 'utf-8' }
          )
        }
        code = code || shelljs.cd(tempDir).code || shelljs.exec(`npm install`).code || shelljs.cd('../').code

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

export function configServerAddProxy(path, target) {
  return [
    {
      name: 'vite-plugin-config-server-add-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.includes(path)) {
            req.url = req.url.replace(path, target)
          }
          next()
        })
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
  const baseSlash = base.endsWith('/') ? '' : '/'
  const files = extraBundleCdnLink(bundleFile, originCdnPrefix).map((url) => {
    const { packageName, versionDemand, filePathInPackage } = url.match(
      new RegExp(`^${originCdnPrefix}/?(?<packageName>.+?)@(?<versionDemand>[^/]+)(?<filePathInPackage>.*?)$`)
    ).groups
    let version = versionDemand
    let src = `node_modules/${packageName}${filePathInPackage}`
    const sourceExist = fs.existsSync(path.resolve(src))
    let sourceExistExternal = false
    if (sourceExist) {
      const content = readJsonFile(`node_modules/${packageName}/package.json`)
      version = content.version // 忽略请求的包版本，使用本地包版本号
    } else {
      src = bundleTempDir + '/' + src
      sourceExistExternal = fs.existsSync(path.resolve(src)) // 安装过的不重新安装
    }
    return {
      originUrl: url,
      newUrl: `${base}${baseSlash}${dir}/${packageName}@${version}${filePathInPackage}`,
      src,
      dest: path.dirname(`${dir}/${packageName}@${version}${filePathInPackage}`),
      packageName,
      version,
      filePathInPackage,
      sourceExist,
      sourceExistExternal,
      transform: null // 物料的依赖目前暂定是需要mjs，暂不考虑相对链接问题
    }
  })

  const packageNeedToInstall = files
    .filter((item) => !item.sourceExist)
    .map(({ packageName, version, sourceExistExternal: exist }) => ({ packageName, version, exist }))
    .reduce((acc, cur) => {
      // 同个包避免多个版本只保留一个版本
      if (!acc.some(({ packageName }) => cur.packageName === packageName)) {
        acc.push(cur)
      }
      return acc
    }, [])

  if (packageNeedToInstall.length) {
    // 确保同个包多个版本只能从一个版本引用文件
    files.forEach((file) => {
      const samePackageDifferentVersion = packageNeedToInstall.find(
        ({ packageName, version }) => packageName === file.packageName && version !== file.version
      )
      if (samePackageDifferentVersion) {
        file.version = samePackageDifferentVersion.version
        file.newUrl = `${base}${baseSlash}${dir}/${file.packageName}@${file.version}${file.filePathInPackage}`
        file.dest = path.dirname(`${dir}/${file.packageName}@${file.version}${file.filePathInPackage}`)
      }
    })
  }

  const plugin = (isDev) => {
    return [
      ...(isDev ? configServerAddProxy(targetBundleFile, targetBundleFile.replace(/\.([^.]+?$)/, '-local.$1')) : []),
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
            dest: path.dirname(targetBundleFile),
            transform: (content) => {
              const json = JSON.parse(content)
              replaceBundleCdnLink(json, files)
              return JSON.stringify(json, null, 2)
            },
            rename: (filename, fileExtension) =>
              isDev ? `${filename}-local.${fileExtension}` : path.basename(targetBundleFile),
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
