import { importMapConfig } from '@opentiny/tiny-engine-common/js/importMap'
import config, { useEnv } from '../../../config.ts'

const {
  VITE_CDN_TYPE,
  VITE_CDN_DOMAIN,
  BASE_URL,
  VITE_LOCAL_IMPORT_MAPS,
  VITE_LOCAL_IMPORT_PATH = 'local-cdn-static'
} = useEnv()

const getImportUrl = (pkgName: string) => {
  // 自定义的 importMap
  const customImportMap = config?.importMap as any
  const sysImportMap = importMapConfig as any
  const isLocalBundle = VITE_LOCAL_IMPORT_MAPS === 'true'
  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' && !isLocalBundle ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' && !isLocalBundle ? '/files' : ''
  const cdnDomain = isLocalBundle ? BASE_URL + VITE_LOCAL_IMPORT_PATH : VITE_CDN_DOMAIN

  if (customImportMap?.imports?.[pkgName]) {
    return customImportMap.imports[pkgName]
      .replace('${VITE_CDN_DOMAIN}', cdnDomain)
      .replace('${versionDelimiter}', versionDelimiter)
      .replace('${fileDelimiter}', fileDelimiter)
  }

  if (sysImportMap?.imports?.[pkgName]) {
    return sysImportMap?.imports?.[pkgName]
      .replace('${VITE_CDN_DOMAIN}', cdnDomain)
      .replace('${versionDelimiter}', versionDelimiter)
      .replace('${fileDelimiter}', fileDelimiter)
  }
}

// 获取样式文件的URL，后续去除物料内置逻辑之后，需要用户自行引入，相关逻辑也需要同步删除
const getImportStyleUrl = (pkgName: string) => {
  const isLocalBundle = VITE_LOCAL_IMPORT_MAPS === 'true'
  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' && !isLocalBundle ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' && !isLocalBundle ? '/files' : ''
  const cdnDomain = isLocalBundle ? BASE_URL + VITE_LOCAL_IMPORT_PATH : VITE_CDN_DOMAIN
  const sysImportMap = importMapConfig as any

  if (sysImportMap.importStyles[pkgName]) {
    return sysImportMap.importStyles[pkgName]
      .replace('${VITE_CDN_DOMAIN}', cdnDomain)
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
  const tailwindURL = getImportUrl('@tailwindcss/browser')
  const importScripts = config?.enableTailwindCSS && tailwindURL ? [tailwindURL] : []

  return {
    importMap,
    importStyles,
    importScripts
  }
}

interface ITagProps {
  tag: string
  [key: string]: string
}

export const IMPORT_MAP_ELEMENT_ID = 'tiny-engine-runtime-import-map'

export function addTagTask(props: ITagProps) {
  return new Promise((resolve, reject) => {
    const { tag, onload, ...others } = props
    let el: any = document.head.querySelector(`${tag}#${props.id}`)
    const isCreate = !el
    if (!el) {
      el = document.createElement(tag) as any
    }
    for (const key in others) {
      el[key] = others[key] as string
    }
    if (isCreate) {
      document.head.appendChild(el)
    }
    const success = () => {
      resolve(true)
      // eslint-disable-next-line no-console
      console.error('添加并加载脚本:', props)
    }
    if (onload) {
      el.onload = success
      el.onerror = reject
    } else {
      setTimeout(() => success())
    }
  })
}

export async function initImportMap() {
  const { importMap, importStyles, importScripts } = getImportMapData()
  const tasks = []
  const task = addTagTask({
    id: IMPORT_MAP_ELEMENT_ID,
    tag: 'script',
    type: 'importmap',
    textContent: JSON.stringify(importMap, null, 2)
  })
  tasks.push(task)
  importStyles.forEach((url) => {
    const task = addTagTask({
      tag: 'link',
      href: url,
      type: config.enableTailwindCSS ? 'text/tailwindcss' : 'text/css'
    })
    tasks.push(task)
  })
  importScripts.forEach((url) => {
    const task = addTagTask({ tag: 'script', type: 'module', src: url })
    tasks.push(task)
  })
  await Promise.all(tasks)
}
