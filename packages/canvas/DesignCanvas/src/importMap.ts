import { useEnv, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { importMapConfig } from '@opentiny/tiny-engine-common/js/importMap/index'

const getImportUrl = (pkgName: string) => {
  // 自定义的 importMap
  const customImportMap = getMergeMeta('engine.config')?.importMap
  const { VITE_CDN_TYPE, VITE_CDN_DOMAIN } = useEnv()
  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' ? '/files' : ''

  if (customImportMap?.imports?.[pkgName]) {
    return customImportMap.imports[pkgName]
      .replace('${VITE_CDN_DOMAIN}', VITE_CDN_DOMAIN)
      .replace('${versionDelimiter}', versionDelimiter)
      .replace('${fileDelimiter}', fileDelimiter)
  }

  if (importMapConfig.imports[pkgName]) {
    return importMapConfig.imports[pkgName]
      .replace('${VITE_CDN_DOMAIN}', VITE_CDN_DOMAIN)
      .replace('${versionDelimiter}', versionDelimiter)
      .replace('${fileDelimiter}', fileDelimiter)
  }
}

export function getImportMapData(canvasDeps = { scripts: [], styles: [] }) {
  // 以下内容由于区块WebComponent加载需要补充
  const blockRequire = {
    imports: {
      // TODO: 删除
      '@opentiny/vue': getImportUrl('@opentiny/vue'),
      '@opentiny/vue-icon': getImportUrl('@opentiny/vue-icon'),
      // 'element-plus': getImportUrl('element-plus'),
      '@opentiny/tiny-engine-builtin-component': getImportUrl('@opentiny/tiny-engine-builtin-component')
    },
    importStyles: []
  }

  // 以下内容由于物料协议不支持声明子依赖而@opentiny/vue需要依赖所以需要补充
  // TODO: 删除
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
