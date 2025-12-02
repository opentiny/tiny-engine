import { reactive } from 'vue'
import { constants } from '@opentiny/tiny-engine-utils'
import { getImportMap as getInitImportMap } from './importMap'
import { getMetaApi, getMergeMeta, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import {
  fetchMetaData,
  fetchAppSchema,
  fetchBlockSchema,
  getPageById,
  getBlockById,
  fetchPageHistory,
  fetchPageList
} from './http'
import generateMetaFiles, { processAppJsCode } from './generate'
import srcFiles from './srcFiles'

const { COMPONENT_NAME } = constants
const ROOT_ID = '0'

// TODO： 后面可以是否可以抽取公共的 ts 类型定义
interface IPage {
  id: number
  name: string
  parentId: number | string
  isPage: boolean
  page_content: {
    [key: string]: any
    componentName: string
  }
}

export const previewState: {
  currentPage: IPage | null
  ancestors: IPage[]
  importMap: Record<string, string>
  appData: Record<string, any> | null
} = reactive({
  currentPage: null,
  ancestors: [],
  importMap: {},
  appData: null
})

const updateUrl = (params: IPage) => {
  const searchParams = new URLSearchParams(location.search)
  const pageId = searchParams.get('pageid')
  const blockId = searchParams.get('blockid')

  if (
    // 如果当前页面是区块，且没有pageid，且blockid与当前区块id相同，则不更新url
    (params.page_content.componentName === COMPONENT_NAME.Block && !pageId && Number(blockId) === params.id) ||
    // 如果当前页面是页面，且没有blockid，且pageid与当前页面id相同，则不更新url
    (params.page_content.componentName === COMPONENT_NAME.Page && !blockId && Number(pageId) === params.id)
  ) {
    return
  }

  if (params.page_content.componentName === COMPONENT_NAME.Block) {
    searchParams.delete('pageid')
    searchParams.set('blockid', String(params.id))
  }

  if (params.page_content.componentName === COMPONENT_NAME.Page) {
    searchParams.delete('blockid')
    searchParams.set('pageid', String(params.id))
  }

  window.history.replaceState({}, '', `?${searchParams.toString()}`)
}

const getPageRecursively = async (id: string): Promise<IPage[]> => {
  const page = await getPageById(id)

  if (page.parentId === '0') {
    return [page]
  }

  return [page, ...(await getPageRecursively(page.parentId))]
}

const getPageOrBlockByApi = async (): Promise<{ currentPage: IPage | null; ancestors: IPage[] }> => {
  const searchParams = new URLSearchParams(location.search)
  const pageId = searchParams.get('pageid')
  const blockId = searchParams.get('blockid')
  const history = searchParams.get('history')

  if (pageId) {
    let ancestors = (await getPageRecursively(pageId)).reverse().filter((item) => item.isPage)
    // 避免祖先页面第一个为文件夹，导致没有 ROOT_ID，导致设置 Main.vue 失败
    if (ancestors.length && ancestors[0]?.parentId !== ROOT_ID) {
      ancestors[0].parentId = ROOT_ID
    }

    let currentPage = await getPageById(pageId)
    if (history) {
      const historyList: IPage[] = await fetchPageHistory(pageId)
      currentPage = historyList.find((item) => item.id === Number(history))

      ancestors = ancestors.map((item) => {
        if (item.id === Number(pageId)) {
          return {
            ...item,
            page_content: currentPage.page_content
          }
        }
        return item
      })
    }

    return {
      currentPage,
      ancestors
    }
  }

  if (blockId) {
    const block = await getBlockById(blockId)
    let pageContent = block.content
    let name = block.name || block.name_cn || block.label

    if (history) {
      const historyContent = (block.histories || []).find((item: { id: number }) => item.id === Number(history))
      pageContent = historyContent?.content || pageContent
      name = historyContent?.name || name
    }

    return {
      currentPage: {
        ...block,
        page_content: pageContent,
        name
      },
      ancestors: []
    }
  }

  return {
    currentPage: null,
    ancestors: []
  }
}
const getImportMap = async (scripts = {}) => {
  return getInitImportMap(scripts || {})
}

interface IPanelType {
  panelName: string
  panelValue: string
  panelType: string
  index?: boolean
}

interface IGetPageAncestryFilesParams {
  appData: { componentsMap: Array<Record<string, string>> }
  params: { currentPage: IPage; ancestors: IPage[] }
}

// 获取页面祖先区块的出码文件
const getPageAncestryFiles = (
  appData: IGetPageAncestryFilesParams['appData'],
  params: IGetPageAncestryFilesParams['params']
) => {
  const familyPages: IPanelType[] = []
  const ancestors = params.ancestors
  const { generatePageCode } = getMetaApi('engine.service.generateCode')

  // 区块预览，没有祖先
  if (params.currentPage.page_content.componentName === COMPONENT_NAME.Block) {
    familyPages.push({
      panelName: 'Main.vue',
      panelValue:
        generatePageCode(params.currentPage.page_content, appData?.componentsMap || [], {
          blockRelativePath: './'
        }) || '',
      panelType: 'vue',
      index: true
    })

    return familyPages
  }

  if (!ancestors?.length || !appData?.componentsMap) {
    return familyPages
  }

  for (let i = 0; i < ancestors.length; i++) {
    const nextPage = i < ancestors.length - 1 ? ancestors[i + 1].name : null
    const panelValueAndType = {
      panelValue:
        generatePageCode(
          ancestors[i].page_content,
          appData?.componentsMap || [],
          {
            blockRelativePath: './'
          },
          nextPage
        ) || '',
      panelType: 'vue'
    }

    if (ancestors[i]?.parentId === ROOT_ID) {
      familyPages.push({
        ...panelValueAndType,
        panelName: 'Main.vue',
        index: true
      })
    } else {
      familyPages.push({
        ...panelValueAndType,
        panelName: `${ancestors[i].name}.vue`,
        index: false
      })
    }
  }

  const hasMainPage = familyPages.some((item) => item.panelName === 'Main.vue' && item.index)

  if (!hasMainPage && familyPages.length) {
    familyPages[0].index = true
    familyPages[0].panelName = 'Main.vue'
  }

  return familyPages
}

const getAppData = async () => {
  if (previewState.appData) {
    return previewState.appData
  }

  const searchParams = new URLSearchParams(location.search)
  const appData = await fetchAppSchema(searchParams.get('id'))
  previewState.appData = appData

  return appData
}

const addScriptAndStyle = (scripts: Map<string, string>, styles: Set<string>, pkg: Record<string, string>) => {
  if (pkg.package && pkg.script) {
    scripts.set(pkg.package, pkg.script)
  }

  if (Array.isArray(pkg.css)) {
    pkg.css.forEach((style: string) => {
      if (style) {
        styles.add(style)
      }
    })
  } else if (pkg.css) {
    styles.add(pkg.css)
  }
}

const getMaterialDeps = async () => {
  const bundleUrls = getMergeMeta('engine.config')?.material || []
  const materials = await Promise.allSettled(
    bundleUrls.map((url: any) => (typeof url === 'string' ? getMetaApi(META_SERVICE.Http).get(url) : url))
  )

  const scripts = new Map<string, string>()
  const styles = new Set<string>()
  const appData = await getAppData()

  if (Array.isArray(appData.utils)) {
    appData.utils
      .filter((item: Record<string, any>) => item.type === 'npm')
      .forEach((item: Record<string, any>) => {
        addScriptAndStyle(scripts, styles, {
          package: item.content.package,
          script: item.content.cdnLink,
          css: item.content.cdnLink
        })
      })
  }

  materials
    .filter((item) => item.status === 'fulfilled' && item.value.materials)
    .map((item: any) => item.value.materials)
    .forEach((item) => {
      const { packages, components } = item

      if (Array.isArray(packages)) {
        packages.forEach((pkg) => {
          addScriptAndStyle(scripts, styles, pkg)
        })
      }

      if (Array.isArray(components)) {
        components.forEach((component) => {
          addScriptAndStyle(scripts, styles, component.npm)
        })
      }
    })

  return {
    scripts: Object.fromEntries(scripts),
    styles: Array.from(styles)
  }
}

const getBasicData = async (basicFilesPromise: Promise<any>, scripts: Record<string, string>) => {
  const searchParams = new URLSearchParams(location.search)
  const pageId = searchParams.get('pageid')
  const blockId = searchParams.get('blockid')

  const metaDataParams: IMetaDataParams = {
    platform: searchParams.get('platform') || '',
    app: searchParams.get('id') || '',
    type: pageId ? 'Page' : 'Block',
    id: pageId || blockId || '',
    tenant: searchParams.get('tenant') || ''
  }

  if (searchParams.get('history')) {
    metaDataParams.history = searchParams.get('history') || ''
  }

  const promises = [getAppData(), fetchMetaData(metaDataParams), getImportMap(scripts), basicFilesPromise]
  const [appData, metaData, importMapData] = await Promise.all(promises)

  return {
    appData,
    metaData,
    importMapData
  }
}

interface IMetaDataParams {
  platform: string
  app: string
  type: string
  id: string
  tenant: string
  history?: string
}

interface IUsePreviewData {
  setFiles: (files: Record<string, string>, mainFileName?: string) => Promise<void>
  store: any
  setImportMap: (importMap: Record<string, string>) => void
}

export const usePreviewData = ({ setFiles, store, setImportMap }: IUsePreviewData) => {
  const basicFiles = setFiles(srcFiles, 'src/Main.vue')

  const assignFiles = ({ panelName, panelValue, index }: IPanelType, newFiles: Record<string, string>) => {
    if (index) {
      panelName = 'Main.vue'
    }

    newFiles[panelName] = panelValue
  }

  // 根据新的参数更新预览
  const updatePreview = async (params: {
    currentPage: IPage
    ancestors: IPage[]
    scripts: Record<string, string>
    styles: string[]
  }) => {
    const searchParams = new URLSearchParams(location.search)
    const previewType = searchParams.get('previewType')
    const { appData, metaData, importMapData } = await getBasicData(basicFiles, params.scripts)

    if (previewType === 'page') {
      previewState.currentPage = params.currentPage
      previewState.ancestors = params.ancestors

      // importMap 发生变化才更新 importMap
      if (JSON.stringify(previewState.importMap) !== JSON.stringify(importMapData)) {
        setImportMap(importMapData)
        previewState.importMap = importMapData
      }

      const blockSet = new Set()

      let blocks = []
      const { getAllNestedBlocksSchema, generatePageCode } = getMetaApi('engine.service.generateCode')

      if (params.ancestors?.length) {
        const promises = params.ancestors.map((item) =>
          getAllNestedBlocksSchema(item.page_content, fetchBlockSchema, blockSet)
        )
        blocks = (await Promise.all(promises)).flat()
      }

      const currentPageBlocks = await getAllNestedBlocksSchema(
        params.currentPage?.page_content || {},
        fetchBlockSchema,
        blockSet
      )
      blocks = blocks.concat(currentPageBlocks)
      const pageCode = [
        ...getPageAncestryFiles(appData, params),
        ...(blocks || []).map((blockSchema) => {
          return {
            panelName: `${blockSchema.fileName}.vue`,
            panelValue: generatePageCode(blockSchema, appData?.componentsMap || [], { blockRelativePath: './' }) || '',
            panelType: 'vue'
          }
        })
      ]

      const newFiles = store.getFiles()
      const enableTailwindCSS = getMergeMeta('engine.config')?.enableTailwindCSS
      const appJsCode = processAppJsCode(newFiles['app.js'] || '', params.styles, enableTailwindCSS)

      newFiles['app.js'] = appJsCode
      pageCode.forEach((item) => assignFiles(item, newFiles))

      const metaFiles = generateMetaFiles(metaData)
      Object.assign(newFiles, metaFiles)
      setFiles(newFiles, 'App.vue')
    } else if (previewType === 'app') {
      const appId = searchParams.get('id')
      const { getAllNestedBlocksSchema, generateAppCode } = getMetaApi('engine.service.generateCode')

      let appSchema

      const getPreGenerateInfo = async () => {
        const promises = [
          getMetaApi(META_SERVICE.Http).get(`/app-center/v1/api/apps/schema/${appId}`),
          fetchPageList(appId)
        ]

        const [appData, pageList] = await Promise.all(promises)
        const pageDetailList = pageList

        // 这里需要手动传入 blockSet 的原因是多页面可能会存在重复的区块
        const blockSet = new Set()
        const list = pageDetailList.map((page) =>
          getAllNestedBlocksSchema(page.page_content, fetchBlockSchema, blockSet)
        )
        const blocks = await Promise.allSettled(list)

        const blockSchema = []
        blocks.forEach((item) => {
          if (item.status === 'fulfilled' && Array.isArray(item.value)) {
            blockSchema.push(...item.value)
          }
        })

        appSchema = {
          dataSource: appData.dataSource,
          utils: appData.utils,
          i18n: appData.i18n,
          globalState: appData.globalState,
          // 页面 schema
          pageSchema: pageDetailList.map((item) => {
            const { page_content, ...meta } = item

            return {
              ...page_content,
              meta: {
                ...meta,
                router: meta.route
              }
            }
          }),
          blockSchema,
          // 物料数据
          componentsMap: [...(appData.componentsMap || [])],
          // 物料依赖
          packages: [...(appData.packages || [])],
          meta: {
            ...(appData.meta || {})
          }
        }

        const res = await generateAppCode(appSchema)

        const { genResult = [] } = res || {}
        const fileRes = genResult.map(({ fileContent, fileName, path, fileType }) => {
          const slash = path.endsWith('/') || path === '.' ? '' : '/'
          let filePath = `${path}${slash}`
          if (filePath.startsWith('./')) {
            filePath = filePath.slice(2)
          }
          if (filePath.startsWith('.')) {
            filePath = filePath.slice(1)
          }

          if (filePath.startsWith('/')) {
            filePath = filePath.slice(1)
          }

          return {
            fileContent,
            filePath: `${filePath}${fileName}`,
            fileType
          }
        })

        return fileRes
      }

      const buildTreeRoutes = (routes) => {
        const tree = []
        const routeMap = new Map()

        // 首先将所有路由存入一个 Map 中，以便快速查找
        routes.forEach((route) => {
          routeMap.set(route.path, route)
        })

        // 递归构建树状结构
        const buildTree = (route) => {
          const children = routes.filter((childRoute) => {
            return childRoute.path.startsWith(route.path) && childRoute.path !== route.path
          })

          if (children.length > 0) {
            route.children = children.map((childRoute) => {
              const child = { ...childRoute }
              buildTree(child)
              return child
            })
          }
        }

        // 找到所有根路由
        routes.forEach((route) => {
          if (!routes.some((otherRoute) => otherRoute.path !== route.path && route.path.startsWith(otherRoute.path))) {
            const root = { ...route }
            buildTree(root)
            tree.push(root)
          }
        })

        return tree
      }

      const getRoutesAndImportSet = (schema) => {
        const importSet = new Set()
        const pageSchema = (schema.pageSchema || []).sort((a, b) => a.meta?.router?.length - b.meta?.router?.length)
        const result = []
        const home = {
          path: '/'
        }
        let isGetHome = false
        pageSchema.forEach((item) => {
          if ((item.meta?.isHome || item.meta?.isDefault) && !isGetHome) {
            home.redirect = { name: `${item.meta.id}` }
            isGetHome = true
          }
          importSet.add(
            `import ${item.fileName} from './views${item.path ? `/${item.path}` : ''}/${item.fileName}.vue'`
          )
          const newNode = {
            path: `/${item.meta.router}`,
            component: item.fileName,
            name: `${item.meta.id}`
          }
          result.push(newNode)
        })
        if (!isGetHome) {
          isGetHome = true
          home.redirect = { name: result[0]?.name }
        }

        return { routes: [home, ...buildTreeRoutes(result)], importSet }
      }

      const getRouterFile = (schema) => {
        const { routes, importSet } = getRoutesAndImportSet(schema)
        const resultStr = JSON.stringify(routes, null, 2).replace(
          /("component":\s*)"(.*?)"/g,
          (match, p1, p2) => p1 + p2
        )

        // TODO: 支持 hash 模式、history 模式
        const importSnippet = `import { createRouter, createMemoryHistory } from 'vue-router'\n${[...importSet].join(
          '\n'
        )}`
        const exportSnippet = `export default createRouter({history: createMemoryHistory(),routes })`

        const routeSnippets = `const routes = ${resultStr}`

        return `${importSnippet}\n ${routeSnippets} \n ${exportSnippet}`
      }

      const formatCode = (fileContent, fileName) => {
        if (fileName === 'src/router/index.js') {
          fileContent = getRouterFile(appSchema)
        } else {
          fileContent = fileContent.replace(/(from\s*')(@)(\/.*')/g, '$1.$3')
        }
        if (fileName === 'src/App.vue') {
          fileContent = fileContent.replace(
            '<router-view></router-view>',
            `<tiny-select v-model="currentRoute" placeholder="请选择路由" render-type="tree" :tree-op="{ data: $router.options.routes.filter(item => item.path !== '/') }" text-field="path" value-field="path" @change="routeChange"></tiny-select>\n<router-view></router-view>`
          )
          fileContent = fileContent.replace(
            `import { provide } from 'vue'`,
            `import { Select as TinySelect } from '@opentiny/vue'\nimport { ref, provide, watchEffect } from 'vue'\nimport { useRoute, useRouter } from 'vue-router'`
          )
          fileContent = fileContent.replace(
            `provide(I18nInjectionKey, i18n)`,
            `const route = useRoute()\nconst router = useRouter()\nconst currentRoute = ref()\n\nwatchEffect(() => {\n\tcurrentRoute.value = route.path\n})\n\nconst routeChange = () => {\n\trouter.push(currentRoute.value)\n}\nprovide(I18nInjectionKey, i18n)`
          )
        }
        return fileContent
      }

      const fileRes = await getPreGenerateInfo()
      const newFileRes = fileRes.filter((item) => item.filePath.includes('src/'))
      const srcFiles = newFileRes.reduce((prev, item) => {
        const fileName = item.filePath
        prev[fileName] = formatCode(item.fileContent, fileName)
        return prev
      }, {})
      srcFiles['import-map.json'] = JSON.stringify(importMapData)
      const newFiles = store.getFiles()
      const enableTailwindCSS = getMergeMeta('engine.config')?.enableTailwindCSS
      const appJsCode = processAppJsCode(newFiles['app.js'] || '', params.styles, enableTailwindCSS)
      srcFiles['app.js'] = appJsCode
      srcFiles['main.js'] = `import app from './app.js' \n ${srcFiles['src/main.js']}`
      srcFiles['main.js'] = srcFiles['main.js'].replace("import 'element-plus/dist/index.css'", '')
      setFiles(srcFiles, 'src/main.js')
    }
  }

  const loadInitialData = async () => {
    const { currentPage, ancestors } = await getPageOrBlockByApi()
    previewState.currentPage = currentPage
    previewState.ancestors = ancestors

    const { scripts, styles } = await getMaterialDeps()

    if (currentPage) {
      updatePreview({ currentPage, ancestors, scripts, styles })
    }
  }

  return {
    loadInitialData,
    updateUrl,
    updatePreview
  }
}
