export const addScript = (src, doc = document) => {
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script')

    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', src)

    script.async = false

    script.onload = resolve
    script.onerror = reject

    doc.querySelector('head').appendChild(script)
  })
}

export const addStyle = (href, doc = document) => {
  return new Promise((resolve, reject) => {
    const link = doc.createElement('link')

    link.setAttribute('href', href)
    link.setAttribute('rel', 'stylesheet')

    link.onload = resolve
    link.onerror = reject

    doc.querySelector('head').appendChild(link)
  })
}

export const copyObject = (node) => {
  if (typeof node === 'object') {
    if (!node) {
      return node
    }

    if (Array.isArray(node)) {
      return node.map(copyObject)
    }

    const res = {}
    Object.keys(node).forEach((key) => {
      res[key] = copyObject(node[key])
    })

    const { componentName, id } = res

    if (componentName && id) {
      delete res.id
    }

    return res
  }

  return node
}

/**
 * 从页面importmap中获取模块的名称
 * @returns importmap中模块的名称集合
 */
const getImportMapKeys = () => {
  try {
    const importMapElement = document.querySelector('script[type="importmap"]')

    if (!importMapElement) {
      return []
    }

    const importMaps = importMapElement.textContent
    const importMapObject = JSON.parse(importMaps || '{}') || {}

    return Object.keys(importMapObject.imports)
  } catch (error) {
    return []
  }
}

/**
 * 动态导入获取组件库模块
 * @param {*} pkg 模块名称
 * @param {*} script 模块的cdn地址
 * @returns
 */
const dynamicImportComponentLib = async ({ pkg, script }) => {
  if (window.TinyComponentLibs[pkg]) {
    return window.TinyComponentLibs[pkg]
  }

  let modules = {}

  try {
    // 优先从importmap导入，兼容npm.script字段定义的cdn地址
    const importMapKeys = getImportMapKeys()

    if (importMapKeys.includes(pkg)) {
      modules = await import(/* @vite-ignore */ pkg)
    } else if (script) {
      modules = await import(/* @vite-ignore */ script)
    }
  } catch (error) {
    modules = {}
  }

  window.TinyComponentLibs[pkg] = modules

  return modules
}

/**
 * 获取组件对象并缓存，组件渲染时使用
 * @param {object} param0 组件的依赖： { package： 包名，script：js文件cdn, components：组件id和导出组件名的映射关系}
 * @returns
 */
export const getComponents = async ({ package: pkg, script, components }) => {
  if (!pkg) return

  const modules = await dynamicImportComponentLib({ pkg, script })

  Object.entries(components).forEach(([componentId, exportName]) => {
    if (!window.TinyLowcodeComponent[componentId]) {
      window.TinyLowcodeComponent[componentId] = modules[exportName]
    }
  })
}
