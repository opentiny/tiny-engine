import path from 'node:path'
import fs from 'node:fs'
import fg from 'fast-glob'
import { normalizePath } from 'vite'
import { readJsonSync } from 'fs-extra'
import { babelReplaceImportPathWithCertainFileName } from './replaceImportPath.mjs'

function transform(content, filename) {
  if (filename.endsWith('.js')) {
    const result = babelReplaceImportPathWithCertainFileName(content, filename, console)
    return result.code || content
  }
  return content
}

function onlyFiles(globString) {
  // viteStaticCopy 自带的glob匹配无法过滤目录， 手动过滤目录作为数组传入
  return fg.sync(globString + '/**/*', { onlyFiles: true }).map((p) => normalizePath(p))
}

function replaceTailSlash(pathStr) {
  // 替换尾部的 / 可以把目录当文件复制
  return pathStr.replace(/\/$/, '')
}

export function copyfileToDynamicSrcMapper({ src, dest, transform, rename, folder, ...rest }) {
  // viteStaticCopy 自带的glob匹配无法过滤目录， 手动过滤目录作为数组传入，但是不存在的包需要推迟glob的时机到安装文件后
  return {
    ...rest,
    get src() {
      // 注意对象不能被解构，否则getter无法动态计算
      return src || onlyFiles(folder)
    },
    dest,
    transform,
    rename
  }
}

// 生成复制单个文件所需要的信息
export function getCdnPathNpmInfoForSingleFile(
  url, // cdn托管的npm文件地址数组
  originCdnPrefix, // cdn的前缀
  base, // build构建的base（BASE_URL）参数
  dir, // 复制到目标的文件目录
  transformIContent = false, // 是否需要转换内容, 如果传入url实际为目录则不会转会
  tempDir = 'bundle-deps' // 新安装包的安装目录
) {
  const baseSlash = base.endsWith('/') ? '' : '/'
  const { packageName, versionDemand, filePathInPackage } = url.match(
    new RegExp(`^${originCdnPrefix}/?(?<packageName>.+?)@(?<versionDemand>[^/]+)(?<filePathInPackage>.*?)$`)
  ).groups
  let version = versionDemand
  let isFolder = filePathInPackage.endsWith('/')
  let src = replaceTailSlash(`node_modules/${packageName}${filePathInPackage}`)
  const sourceExist = fs.existsSync(path.resolve(src))
  let sourceExistExternal = false
  if (sourceExist) {
    const stat = fs.statSync(path.resolve(src))
    if (stat.isDirectory()) {
      isFolder = true
    }
    const content = readJsonSync(`node_modules/${packageName}/package.json`)
    version = content.version // 忽略请求的包版本，使用本地包版本号
  } else {
    src = tempDir + '/' + src
    sourceExistExternal = fs.existsSync(path.resolve(src)) // 安装过的不重新安装, 当且仅当所有包都安装过
    if (sourceExistExternal) {
      const packageJson = readJsonSync(`${tempDir}/node_modules/${packageName}/package.json`)
      version = packageJson.version // 如果重新安装这个版本号还需要刷新
    }
  }
  const updateVersion = (version) => {
    const destPackageDir = `${dir}/${packageName}@${version}`
    const destFullPath = `${destPackageDir}${filePathInPackage}`
    const destFullPathWithoutTailSlash = replaceTailSlash(destFullPath)
    const dest = path.dirname(destFullPathWithoutTailSlash)
    const rename = dest.startsWith(destPackageDir) ? null : path.basename(destFullPathWithoutTailSlash) // 版本号被截断，需要补充回去
    return {
      version,
      newUrl: `${base}${baseSlash}${destFullPath}`,
      dest,
      rename
    }
  }

  return {
    originUrl: url,
    // newUrl, // overwrite by updateVersion(version)
    src,
    // dest, // overwrite by updateVersion(version)
    packageName,
    // version, // overwrite by updateVersion(version)
    versionDemand,
    filePathInPackage,
    sourceExist,
    sourceExistExternal,
    ...updateVersion(version),
    updateVersion,
    transform: transformIContent && !isFolder ? transform : null
  }
}

export function getCdnPathNpmInfoForPackage(
  url, // cdn托管的npm文件地址数组
  originCdnPrefix, // cdn的前缀
  base, // build构建的base（BASE_URL）参数
  dir, // 复制到目标的文件目录
  transformIContent = false, // 是否需要转换内容
  tempDir = 'bundle-deps' // 新安装包的安装目录
) {
  const baseSlash = base.endsWith('/') ? '' : '/'
  const { packageName, versionDemand, filePathInPackage } = url.match(
    new RegExp(`^${originCdnPrefix}/?(?<packageName>.+?)@(?<versionDemand>[^/]+)(?<filePathInPackage>.*?)$`)
  ).groups
  let version = versionDemand
  let src = `node_modules/${packageName}`
  const sourceExist = fs.existsSync(path.resolve(src))
  let sourceExistExternal = false
  if (sourceExist) {
    const content = readJsonSync(`${src}/package.json`)
    version = content.version // 忽略请求的包版本，使用本地包版本号
  } else {
    src = tempDir + '/' + src
    sourceExistExternal = fs.existsSync(path.resolve(src)) // 安装过的不重新安装, 当且仅当所有包都安装过
    if (sourceExistExternal) {
      const packageJson = readJsonSync(`${src}/package.json`)
      version = packageJson.version // 如果重新安装这个版本号还需要刷新
    }
  }
  const updateVersion = (version) => {
    const packageDir = `${dir}/${packageName}@${version}`
    const packageDirBasename = path.basename(packageDir)
    return {
      version,
      newUrl: `${base}${baseSlash}${dir}/${packageName}@${version}${filePathInPackage}`,
      dest: path.dirname(packageDir),
      rename: (_filename, _fileExtension, fullPath) => `${packageDirBasename}${fullPath.replace(src, '')}`
    }
  }

  return {
    folder: src,
    originUrl: url,
    // newUrl, // overwrite by updateVersion(version)
    src: sourceExist || sourceExistExternal ? onlyFiles(src) : null,
    // dest, // overwrite by updateVersion(version)
    packageName,
    // version, // overwrite by updateVersion(version)
    versionDemand,
    filePathInPackage,
    sourceExist,
    sourceExistExternal,
    ...updateVersion(version),
    updateVersion,
    transform: transformIContent ? transform : null
  }
}

export function dedupeCopyFiles(files) {
  return files.reduce((acc, cur) => {
    //去重，分别处理字符串和数组
    if (
      (cur.folder && !acc.some((item) => !!item.folder && item.folder === cur.folder && item.dest === cur.dest)) || // 文件夹拷贝
      (typeof cur.src === 'string' && !acc.some((item) => item.src === cur.src && item.dest === cur.dest)) // 文件拷贝
    ) {
      acc.push(cur)
    }
    return acc
  }, [])
}

export function getPackageNeedToInstallAndFilesUsingSameVersion(files) {
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
  let newFiles = null
  if (packageNeedToInstall.length) {
    // 确保同个包多个版本只能从一个版本引用文件
    newFiles = files.map((file) => {
      const samePackageDifferentVersion = packageNeedToInstall.find(
        ({ packageName, version }) => packageName === file.packageName && version !== file.version
      )
      if (samePackageDifferentVersion) {
        return {
          ...file,
          ...file.updateVersion(samePackageDifferentVersion.version)
        }
      }
      return file
    })
  }
  return {
    packages: packageNeedToInstall,
    files: newFiles ?? files
  }
}
