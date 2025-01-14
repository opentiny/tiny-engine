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
 * 动态导入组件，缓存组件对象
 * @param {object} param0 组件的依赖： { package: 包名，script：js文件cdn, components：组件id和导出组件名的映射关系}
 * @returns
 */
export const dynamicImportComponents = async ({ package: pkg, script, components }) => {
  if (!script) return
  const href = window.parent.location.href || location.href; // 这里要取父窗口的地址，因为在iframe中href是about:srcdoc
  const scriptUrl = script.startsWith('.') ? new URL(script, href).href : script

  if (!window.TinyComponentLibs[pkg]) {
    const modules = await import(/* @vite-ignore */ scriptUrl)

    window.TinyComponentLibs[pkg] = modules
  }

  Object.entries(components).forEach(([componentId, exportName]) => {
    const modules = window.TinyComponentLibs[pkg]

    if (!window.TinyLowcodeComponent[componentId]) {
      window.TinyLowcodeComponent[componentId] = modules[exportName]
    }
  })
}

/**
 * 更新区块/组件依赖
 * @param {object} param0 依赖的CDN信息
 */
export const updateDependencies = ({ detail }) => {
  const { scripts = [], styles = [] } = detail || {}
  const { styles: canvasStyles } = window.thirdPartyDeps
  const newStyles = [...styles].filter((item) => !canvasStyles.has(item))

  newStyles.forEach((item) => canvasStyles.add(item))

  const promises = [...newStyles].map((src) => addStyle(src)).concat(scripts.map(dynamicImportComponents))

  Promise.allSettled(promises)
}
