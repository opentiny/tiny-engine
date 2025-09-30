import { ref, computed, readonly } from 'vue'
import type { AppSchema, Util, BlockItem, BlockContent } from '../types/schema'
import { initUtils } from '../app-function/utils'

const appSchema = ref<AppSchema | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
export function useAppSchema() {
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

  // 初始化应用配置
  const initializeAppConfig = async (schema: AppSchema) => {
    if (!schema?.data) return

    // 初始化工具函数
    initializeUtils(schema.data.utils)

    // 注入全局CSS
    injectGlobalCSS(schema.data.css)
  }

  // 拉取完整应用schema
  const fetchAppSchema = async (appId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/app-center/v1/api/apps/schema/${appId}`)
      appSchema.value = await response.json()

      // 解析并初始化应用级配置
      await initializeAppConfig(appSchema.value)
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
    const response = await fetch('/material-center/api/blocks')
    const blockJSON = await response.json()
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
