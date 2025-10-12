import { ref, computed, readonly } from 'vue'
import type { AppSchema, Util, BlockItem, BlockContent, I18nConfig, ComponentMap, PackageConfig } from '../types/schema'
import { initUtils } from '../app-function/utils'
import i18n from '@opentiny/tiny-engine-i18n-host'
import { addStyle, getComponents, loadPackageDependencys } from '../app-function/nativeComponents'

const appSchema = ref<AppSchema | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
window.TinyLowcodeComponent = {}
window.TinyComponentLibs = {}

export function useAppSchema() {
  const initializeComponentsMap = async (componentsMap: ComponentMap[], packages: PackageConfig[]) => {
    // 获取组件依赖
    const componentsDeps = componentsMap.map((component: ComponentMap) => ({
      package: component.package,
      components: {
        [component.componentName]: component.destructuring
          ? { destructuring: true, exportName: component.exportName || component.componentName }
          : component.componentName
      },
      npmrc: component.npmrc
    }))

    await loadPackageDependencys(packages)

    // 获取包依赖中的样式
    const styles = packages.map((pkg) => pkg.css).filter((css) => css) as string[]

    try {
      // 并行加载所有组件依赖和包资源，与 runner.ts 中的机制保持一致
      await Promise.all([...componentsDeps.map(getComponents), ...styles.map((src) => addStyle(src))])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('组件或资源加载失败:', error)
    }
  }

  // 初始化工具函数
  const initializeUtils = async (utils: Util[]) => {
    try {
      await initUtils(utils)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('工具函数初始化失败:', error)
    }
  }

  // 注入全局CSS
  const injectGlobalCSS = (css: string) => {
    if (!css) return

    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
  }

  const initializeI18n = (i18nConfig: I18nConfig) => {
    if (!i18nConfig) return
    Object.entries(i18nConfig).forEach(([loc, msgs]) => {
      i18n.global.mergeLocaleMessage(loc, msgs as any)
    })
  }

  // 初始化应用配置
  const initializeAppConfig = async (schema: AppSchema) => {
    if (!schema?.data) return

    // 初始化除tinyVue之外的nativeComponents
    initializeComponentsMap(schema.data.componentsMap, schema.data.packages)

    // 初始化国际化
    initializeI18n(schema.data.i18n)

    // 初始化工具函数
    await initializeUtils(schema.data.utils)

    // 注入全局CSS
    injectGlobalCSS(schema.data.css)
  }

  // 拉取完整应用schema
  const fetchAppSchema = async (appId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/app-center/v1/api/apps/schema/${appId}`)

      if (!response.ok) {
        throw new Error(`加载应用Schema失败: HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data?.data) {
        throw new Error('应用Schema数据无效')
      }

      appSchema.value = data
      // 解析并初始化应用级配置
      await initializeAppConfig(appSchema.value!)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载应用Schema失败'
      // eslint-disable-next-line no-console
      console.error('加载应用Schema失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 拉取区块schema
  const fetchBlocks = async () => {
    try {
      const response = await fetch('/material-center/api/blocks')

      if (!response.ok) {
        throw new Error(`加载区块Schema失败: HTTP ${response.status}: ${response.statusText}`)
      }

      const blockJSON = await response.json()

      if (!Array.isArray(blockJSON?.data)) {
        throw new Error('区块Schema数据无效')
      }

      const blocks: BlockItem[] = blockJSON.data || []

      // 转换为组件映射格式
      const blocksMap: Record<
        string,
        {
          schema: BlockContent
          meta: {
            id: number
            label: string
            framework: string
            version: string
          }
        }
      > = {}
      blocks.forEach((block) => {
        if (block.content) {
          blocksMap[block.label] = {
            schema: block.content,
            meta: {
              id: block.id,
              label: block.label,
              framework: block.framework,
              version: block.version
            }
          }
        }
      })

      window.blocks = blocksMap
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('加载区块Schema失败:', error)
    }
  }

  // 获取页面列表
  const pages = computed(() => {
    if (!appSchema.value?.data?.componentsTree) return []
    return appSchema.value.data.componentsTree
  })
  // 根据ID获取页面
  const getPageById = (id: number) => {
    if (!pages.value) return null
    return pages.value.find((page) => page.meta.id === id)
  }

  // 获取数据源配置
  const dataSourceConfig = computed(() => {
    return appSchema.value?.data?.dataSource || {}
  })

  // 获取全局状态配置
  const globalStates = computed(() => {
    return appSchema.value?.data?.meta?.globalState || []
  })

  // 获取包依赖
  const packages = computed(() => {
    return appSchema.value?.data?.packages || []
  })

  // 检查应用是否已加载
  const isAppLoaded = computed(() => {
    return !!appSchema.value
  })

  const i18nConfig = computed(() => {
    return appSchema.value?.data?.i18n || {}
  })

  return {
    // 状态
    appSchema: readonly(appSchema),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 计算属性
    pages,
    dataSourceConfig,
    globalStates,
    packages,
    isAppLoaded,
    i18nConfig,

    // 方法
    fetchAppSchema,
    fetchBlocks,
    getPageById,

    // 初始化方法
    initializeAppConfig,
    injectGlobalCSS
  }
}
