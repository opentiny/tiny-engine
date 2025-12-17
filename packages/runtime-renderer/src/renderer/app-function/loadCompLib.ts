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
  package: string
  script?: string
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
  try {
    // 尝试直接导入模块
    const modules = await import(/* @vite-ignore */ pkg)
    window.TinyComponentLibs[pkg] = modules
  } catch (_err) {
    if (script) {
      try {
        // 拉取远程脚本
        const modules = await import(/* @vite-ignore */ script)
        window.TinyComponentLibs[pkg] = modules
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`组件库安装失败: ${pkg}`, error)
      }
    }
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
  const modules = await dynamicImportComponentLib({ package: pkg, script })
  for (const i in components) {
    const item = components[i] as any
    if (!window.TinyLowcodeComponent[item.componentName || item.exportName]) {
      window.TinyLowcodeComponent[item.componentName] =
        item?.destructuring && item?.exportName ? modules[item.exportName] : modules?.default
    }
  }
}
