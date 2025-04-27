import { useEnv, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { importMapConfig } from '@opentiny/tiny-engine-common/js/importMap'

const getImportUrl = (pkgName: string) => {
  // 自定义的 importMap
  const customImportMap = getMergeMeta('engine.config')?.importMap
  const { VITE_CDN_TYPE, VITE_CDN_DOMAIN, VITE_LOCAL_CDN_PATH } = useEnv()
  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' && !VITE_LOCAL_CDN_PATH ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' && !VITE_LOCAL_CDN_PATH ? '/files' : ''

  if (customImportMap?.imports?.[pkgName]) {
    return customImportMap.imports[pkgName]
      .replace('${VITE_CDN_DOMAIN}', VITE_LOCAL_CDN_PATH || VITE_CDN_DOMAIN)
      .replace('${versionDelimiter}', versionDelimiter)
      .replace('${fileDelimiter}', fileDelimiter)
  }

  if (importMapConfig.imports[pkgName]) {
    return importMapConfig.imports[pkgName]
      .replace('${VITE_CDN_DOMAIN}', VITE_LOCAL_CDN_PATH || VITE_CDN_DOMAIN)
      .replace('${versionDelimiter}', versionDelimiter)
      .replace('${fileDelimiter}', fileDelimiter)
  }
}

// 获取样式文件的URL，后续去除物料内置逻辑之后，需要用户自行引入，相关逻辑也需要同步删除
const getImportStyleUrl = (pkgName: string) => {
  const { VITE_CDN_TYPE, VITE_CDN_DOMAIN, VITE_LOCAL_CDN_PATH } = useEnv()
  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' && !VITE_LOCAL_CDN_PATH ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' && !VITE_LOCAL_CDN_PATH ? '/files' : ''

  if (importMapConfig.importStyles[pkgName]) {
    return importMapConfig.importStyles[pkgName]
      .replace('${VITE_CDN_DOMAIN}', VITE_LOCAL_CDN_PATH || VITE_CDN_DOMAIN)
      .replace('${versionDelimiter}', versionDelimiter)
      .replace('${fileDelimiter}', fileDelimiter)
  }
}

export function getImportMapData(canvasDeps = { scripts: [], styles: [] }) {
  // 以下内容由于区块WebComponent加载需要补充
  const blockRequire = {
    imports: {
      // TODO: 后续版本发通知，不再内置物料，需要用户自行引入
      '@opentiny/vue': getImportUrl('@opentiny/vue'),
      '@opentiny/vue-icon': getImportUrl('@opentiny/vue-icon'),
      '@opentiny/tiny-engine-builtin-component': getImportUrl('@opentiny/tiny-engine-builtin-component')
    },
    importStyles: [getImportStyleUrl('@opentiny/vue-theme')]
  }

  // 以下内容由于物料协议不支持声明子依赖而@opentiny/vue需要依赖所以需要补充
  // TODO: 后续版本发通知，不再内置物料，需要用户自行引入
  const tinyVueRequire = {
    imports: {
      '@opentiny/vue-common': getImportUrl('@opentiny/vue-common'),
      '@opentiny/vue-locale': getImportUrl('@opentiny/vue-locale'),
      echarts: getImportUrl('echarts')
    }
  }

  const materialsAndUtilsRequire = canvasDeps.scripts.reduce((imports, { package: pkg, script }) => {
    if (pkg && script) {
      imports[pkg] = script
    }

    return imports
  }, {})

  const importMap = {
    imports: {
      vue: getImportUrl('vue'),
      'vue-i18n': getImportUrl('vue-i18n'),
      ...blockRequire.imports,
      ...tinyVueRequire.imports,
      ...materialsAndUtilsRequire
    }
  }

  const importStyles = [...blockRequire.importStyles, ...canvasDeps.styles]

  return {
    importMap,
    importStyles
  }
}
