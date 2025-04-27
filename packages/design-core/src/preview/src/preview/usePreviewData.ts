import { reactive } from 'vue'
import { transformSync } from '@babel/core'
import vueJsx from '@vue/babel-plugin-jsx'
import { constants } from '@opentiny/tiny-engine-utils'
import { getImportMap as getInitImportMap } from './importMap'
import { getMetaApi } from '@opentiny/tiny-engine-meta-register'
import {
  fetchMetaData,
  fetchImportMap,
  fetchAppSchema,
  fetchBlockSchema,
  getPageById,
  getBlockById,
  fetchPageHistory
} from './http'
import { PanelType } from '../constant'
import generateMetaFiles, { processAppJsCode } from './generate'
import srcFiles from './srcFiles'

const { COMPONENT_NAME } = constants
const ROOT_ID = '0'

// TODO： 后面可以是否可以抽取公共的 ts 类型定义
interface IPage {
  id: number
  name: string
  parentId: number | string
  page_content: {
    [key: string]: any
    componentName: string
  }
}

export const previewState: {
  currentPage: IPage | null
  ancestors: IPage[]
  importMap: Record<string, string>
} = reactive({
  currentPage: null,
  ancestors: [],
  importMap: {}
})

interface IDeps {
  scripts: Record<string, string>
  styles: string[]
}

const updateUrl = (params: IPage, deps: IDeps) => {
  const searchParams = new URLSearchParams(location.search)
  const pageId = searchParams.get('pageid')
  const blockId = searchParams.get('blockid')
  const scripts = searchParams.get('scripts')
  const styles = searchParams.get('styles')
  let shouldUpdate = false

  if (deps.scripts && JSON.stringify(deps.scripts) !== scripts) {
    searchParams.set('scripts', JSON.stringify(deps.scripts))
    shouldUpdate = true
  }

  if (deps.styles && JSON.stringify(deps.styles) !== styles) {
    searchParams.set('styles', JSON.stringify(deps.styles))
    shouldUpdate = true
  }

  if (
    !shouldUpdate &&
    // 如果当前页面是区块，且没有pageid，且blockid与当前区块id相同，则不更新url
    ((params.page_content.componentName === COMPONENT_NAME.Block && !pageId && Number(blockId) === params.id) ||
      // 如果当前页面是页面，且没有blockid，且pageid与当前页面id相同，则不更新url
      (params.page_content.componentName === COMPONENT_NAME.Page && !blockId && Number(pageId) === params.id))
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
    let ancestors = (await getPageRecursively(pageId)).reverse()
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
  if (import.meta.env.VITE_LOCAL_BUNDLE_DEPS === 'true') {
    const mapJSON = await fetchImportMap()

    return {
      imports: {
        ...mapJSON.imports,
        ...scripts
      }
    }
  }
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

  return familyPages
}

const getBasicData = async (basicFilesPromise: Promise<any>) => {
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

  const promises = [
    fetchAppSchema(searchParams.get('id')),
    fetchMetaData(metaDataParams),
    getImportMap(JSON.parse(searchParams.get('scripts') || '{}')),
    basicFilesPromise
  ]
  const [appData, metaData, importMapData] = await Promise.all(promises)

  return { appData, metaData, importMapData }
}

// [@vue/repl] `Only lang="ts" is supported for <script> blocks.`
const langReg = /lang="jsx"/
const fixScriptLang = (generatedCode: IPanelType) => {
  const fixedCode = { ...generatedCode }

  if (generatedCode.panelType === PanelType.VUE) {
    fixedCode.panelValue = generatedCode.panelValue.replace(langReg, '')
  }

  return fixedCode
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
}

export const usePreviewData = ({ setFiles, store }: IUsePreviewData) => {
  const basicFiles = setFiles(srcFiles, 'src/Main.vue')

  const assignFiles = ({ panelName, panelValue, index }: IPanelType, newFiles: Record<string, string>) => {
    if (index) {
      panelName = 'Main.vue'
    }

    const newPanelValue = panelValue.replace(/<script\s*setup\s*>([\s\S]*)<\/script>/, (match, p1) => {
      if (!p1) {
        // eslint-disable-next-line no-useless-escape
        return '<script setup></script>'
      }

      const transformedScript = transformSync(p1, {
        babelrc: false,
        plugins: [[vueJsx, { pragma: 'h' }]],
        sourceMaps: false,
        configFile: false
      })

      const res = `<script setup>${transformedScript?.code || ''}`
      // eslint-disable-next-line no-useless-escape
      const endTag = '</script>'

      return `${res}${endTag}`
    })

    newFiles[panelName] = newPanelValue
  }

  // 根据新的参数更新预览
  const updatePreview = async (params: { currentPage: IPage; ancestors: IPage[] }) => {
    const { appData, metaData, importMapData } = await getBasicData(basicFiles)

    previewState.currentPage = params.currentPage
    previewState.ancestors = params.ancestors

    // importMap 发生变化才更新 importMap
    if (JSON.stringify(previewState.importMap) !== JSON.stringify(importMapData)) {
      store.setImportMap(importMapData)
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
    const searchParams = new URLSearchParams(location.search)
    const appJsCode = processAppJsCode(newFiles['app.js'], JSON.parse(searchParams.get('styles') || '[]'))

    newFiles['app.js'] = appJsCode

    pageCode.map(fixScriptLang).forEach((item) => assignFiles(item, newFiles))

    const metaFiles = generateMetaFiles(metaData)
    Object.assign(newFiles, metaFiles)

    setFiles(newFiles)
  }

  const loadInitialData = async () => {
    const { currentPage, ancestors } = await getPageOrBlockByApi()
    previewState.currentPage = currentPage
    previewState.ancestors = ancestors

    if (currentPage) {
      updatePreview({ currentPage, ancestors })
    }
  }

  return {
    loadInitialData,
    updateUrl,
    updatePreview
  }
}
