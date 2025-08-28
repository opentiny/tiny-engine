// 定义全局类型声明
declare global {
  interface Window {
    TinyComponentLibs: Record<string, any>
    TinyLowcodeComponent: Record<string, any>
  }
}

// 定义组件配置接口
interface ComponentConfig {
  destructuring?: boolean
  exportName?: string
}

// 定义组件依赖接口
interface ComponentDependency {
  package?: string
  script?: string
  components: Record<string, string | ComponentConfig>
}

// 定义动态导入参数接口
interface DynamicImportParams {
  pkg: string
  script?: string
}

export const addScript = (src: string, doc = document): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script')

    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', src)

    script.async = false

    script.onload = resolve
    script.onerror = reject

    doc.querySelector('head')!.appendChild(script)
  })
}

export const addStyle = (href: string, doc = document): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const link = doc.createElement('link')

    link.setAttribute('href', href)
    link.setAttribute('rel', 'stylesheet')

    link.onload = resolve
    link.onerror = reject

    doc.querySelector('head')!.appendChild(link)
  })
}

export const copyObject = (node: any): any => {
  if (typeof node === 'object') {
    if (!node) {
      return node
    }

    if (Array.isArray(node)) {
      return node.map(copyObject)
    }

    const res: Record<string, any> = {}
    Object.keys(node).forEach((key) => {
      res[key] = copyObject(node[key])
    })

    const { componentName, id } = res as { componentName?: string; id?: string }

    if (componentName && id) {
      delete res.id
    }

    return res
  }

  return node
}

/**
 * 动态导入获取组件库模块
 * @param {DynamicImportParams} param 模块参数，包含pkg模块名称和script模块的cdn地址
 * @returns {Promise<any>} 返回组件库模块
 */
const dynamicImportComponentLib = async ({ pkg, script }: DynamicImportParams): Promise<any> => {
  if (window.TinyComponentLibs[pkg]) {
    return window.TinyComponentLibs[pkg]
  }

  if (!script) {
    return {}
  }

  const href = window.parent.location.href || location.href // 这里要取父窗口的地址，因为在iframe中href是about:srcdoc
  const scriptUrl = script.startsWith('.') ? new URL(script, href).href : script

  if (!window.TinyComponentLibs[pkg]) {
    const modules = await import(/* @vite-ignore */ scriptUrl)

    window.TinyComponentLibs[pkg] = modules
  }

  return window.TinyComponentLibs[pkg]
}

/**
 * 获取组件对象并缓存，组件渲染时使用
 * @param {ComponentDependency} param 组件的依赖配置对象
 * @returns {Promise<void>} 无返回值的Promise
 */
export const getComponents = async ({ package: pkg, script, components }: ComponentDependency): Promise<void> => {
  if (!pkg) return

  const modules = await dynamicImportComponentLib({ pkg, script })

  Object.entries(components).forEach(([componentId, item]) => {
    if (!window.TinyLowcodeComponent[componentId]) {
      // 兼容老版本 - 当item是字符串时，直接作为模块导出名使用
      if (typeof item === 'string') {
        window.TinyLowcodeComponent[componentId] = modules[item]
      } else {
        // 当item是配置对象时，根据destructuring属性决定如何获取组件
        const config = item as ComponentConfig
        window.TinyLowcodeComponent[componentId] =
          config?.destructuring && config?.exportName ? modules[config.exportName] : modules?.default
      }
    }
  })
}
