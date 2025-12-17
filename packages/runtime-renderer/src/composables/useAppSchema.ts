import { ref, computed, readonly } from 'vue'
import type { IAppSchema, Util, I18nConfig, ComponentMap, PackageConfig } from '../types/index.ts'
import i18n from '@opentiny/tiny-engine-common/js/i18n'
import { addTagTask, getComponents, initDataSource, initImportMap, initUtils } from '../renderer/app-function/index.ts'
import config from '../../config.ts'
import { fetchAppSchema, fetchAppPackages, fetchAppPages, fetchAllBlocks, fetchBlockByName } from './service.ts'

const appSchema = ref<IAppSchema | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
window.TinyLowcodeComponent = {}
window.TinyComponentLibs = {}

export function useAppSchema() {
  const initComponentsMap = async (componentsMap: ComponentMap[]) => {
    const packages = appSchema.value?.packages || []
    // 获取组件依赖
    const componentsDeps: any = packages.map((pkg: PackageConfig) => ({
      ...pkg,
      components: componentsMap.filter((comp) => comp.package === pkg.package)
    }))
    const styles = packages.map((pkg) => pkg.css).filter((css) => css) as string[]
    await Promise.all([
      ...componentsDeps.map(getComponents),
      ...styles.map((link) =>
        addTagTask({
          href: link,
          tag: 'link',
          type: config.enableTailwindCSS ? 'text/tailwindcss' : 'text/css'
        })
      )
    ])
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('组件或资源加载失败:', err)
      })
      .finally(() => {})
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

  const initializeI18n = (i18nConfig: I18nConfig) => {
    if (!i18nConfig) return
    Object.entries(i18nConfig).forEach(([loc, msgs]) => {
      i18n.global.mergeLocaleMessage(loc, msgs as any)
    })
  }

  // 注入全局CSS
  const initGlobalCSS = async (css: string) => {
    if (!css) return
    await addTagTask({
      tag: 'style',
      textContent: css,
      id: 'app-global-css',
      type: config.enableTailwindCSS ? 'text/tailwindcss' : 'text/css'
    })
  }

  // 初始化应用配置
  const setAppConfig = async (schema: IAppSchema) => {
    if (!schema?.pages) return
    // 初始化 importMap
    await initImportMap()
    // 初始化除tinyVue之外的nativeComponents
    await initComponentsMap(schema.componentsMap || [])
    // 初始化工具函数
    await initializeUtils(schema?.utils)
    // 初始化国际化
    initializeI18n(schema?.i18n)
    // 初始化数据源
    initDataSource(schema?.dataSource)
    // 注入全局CSS
    initGlobalCSS(schema?.css)
  }

  const initAppData = async (id: string) => {
    await Promise.all([
      fetchAppSchema(id),
      fetchAppPages(id),
      fetchAllBlocks(),
      fetchAppPackages(config.material[0])
    ]).then((rss) => {
      const [schema, pages, blocks, packages] = rss
      appSchema.value = { ...schema, pages, blocks, packages }
    })
    await setAppConfig(appSchema.value!)
  }

  // 获取页面列表
  const pages = computed(() => {
    return appSchema.value?.pages || []
  })
  // 根据ID获取页面
  const getPageById = (id: string) => {
    if (!pages.value) return null
    return pages.value.find((page) => page.id === id) || null
  }

  // 获取数据源配置
  const dataSourceConfig = computed(() => {
    return appSchema.value?.dataSource || {}
  })

  // 获取全局状态配置
  const globalStates = computed(() => {
    return appSchema.value?.meta?.globalState || []
  })

  // 获取包依赖
  const packages = computed(() => {
    return appSchema.value?.packages || []
  })

  // 检查应用是否已加载
  const isAppLoaded = computed(() => {
    return !!appSchema.value
  })

  const i18nConfig = computed(() => {
    return appSchema.value?.i18n || {}
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
    initAppData,
    getPageById,
    fetchBlockByName
  }
}
