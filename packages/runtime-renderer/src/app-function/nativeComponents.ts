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
  package?: string | null
  components: Record<string, string | ComponentConfig>
  npmrc?: any
}

// 定义动态导入参数接口
interface DynamicImportParams {
  package: string
  script?: string
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

/**
 * 动态导入获取组件库模块
 * @param {DynamicImportParams} param 模块参数，包含pkg模块名称和script模块的cdn地址
 * @returns {Promise<any>} 返回组件库模块
 */
const dynamicImportComponentLib = async ({ package: pkg, script }: DynamicImportParams): Promise<any> => {
  if (window.TinyComponentLibs[pkg]) {
    return window.TinyComponentLibs[pkg]
  }

  if (!script) {
    return {}
  }

  const href = window.location.href
  const scriptUrl = script.startsWith('.') ? new URL(script, href).href : script

  try {
    if (!window.TinyComponentLibs[pkg]) {
      const modules = await import(/* @vite-ignore */ scriptUrl)

      window.TinyComponentLibs[pkg] = modules
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`加载组件库失败: ${pkg}`, error)
  }

  return window.TinyComponentLibs[pkg]
}

/**
 * 获取组件库的package依赖
 * @param {DynamicImportParams[]} packageDependencys 组件库的package依赖数组
 * @returns {Promise<any>} 返回组件库的package依赖对象
 */
export const loadPackageDependencys = async (packageDependencys: DynamicImportParams[]): Promise<any> => {
  for (const packageDependency of packageDependencys) {
    const { package: pkg, script } = packageDependency
    if (pkg === '@opentiny/vue') continue
    await dynamicImportComponentLib({ package: pkg, script })
  }
}

export const getComponentLibs = async (pkg: string, npmrc?: string) => {
  if (window.TinyComponentLibs[pkg]) {
    return window.TinyComponentLibs[pkg]
  } else {
    // 如果组件包含npmrc字段，则尝试从npmrc中引入模块
    if (npmrc && npmrc !== 'null' && npmrc !== '') {
      try {
        const modules = await import(/* @vite-ignore */ npmrc)
        window.TinyComponentLibs[pkg] = modules
        return modules
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`从 npmrc 加载组件库失败: ${pkg}`, error)
      }
    }
    throw new Error(`${pkg} 组件库未找到`)
  }
}

/**
 * 获取组件对象并缓存，组件渲染时使用
 * @param {ComponentDependency} param 组件的依赖配置对象
 * @returns {Promise<void>} 无返回值的Promise
 */
export const getComponents = async ({ package: pkg, components, npmrc }: ComponentDependency): Promise<void> => {
  if (!pkg || pkg === '@opentiny/vue') return

  const modules = await getComponentLibs(pkg, npmrc)

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
