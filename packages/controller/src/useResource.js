/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { reactive } from 'vue'
import { getGlobalConfig } from './globalConfig'
import { useHttp } from '@opentiny/tiny-engine-http'
import { utils, constants } from '@opentiny/tiny-engine-utils'
import { meta as BuiltinComponentMaterials } from '@opentiny/tiny-engine-builtin-component'
import { getCanvasStatus } from '../js/canvas'
import useApp from './useApp'
import useCanvas from './useCanvas'
import useTranslate from './useTranslate'
import useEditorInfo from './useEditorInfo'
import useBreadcrumb from './useBreadcrumb'
import useLayout from './useLayout'
import useBlock from './useBlock'
import useNotify from './useNotify'

const { camelize, capitalize } = utils
const { MATERIAL_TYPE, COMPONENT_NAME, DEFAULT_INTERCEPTOR } = constants

// 这里存放TinyVue组件、原生HTML、内置组件的缓存
const resource = new Map()

// 这里涉及到区块发布后的更新问题，所以需要单独缓存区块
const blockResource = new Map()

const http = useHttp()

const resState = reactive({
  components: [],
  blocks: [],
  dataSource: [],
  pageTree: [],
  langs: {},
  utils: {},
  globalState: [],
  thirdPartyDeps: { scripts: [], styles: new Set() }
})

const getSnippet = (component) => {
  let schema = {}
  resState.components.forEach(({ children }) => {
    const child = children.find(({ snippetName }) => snippetName === component)
    child && (schema = child.schema)
  })

  return schema
}

const generateNode = ({ type, component }) => {
  const schema = {
    componentName: component,
    props: {},
    ...getSnippet(component)
  }

  if (type === 'block') {
    schema.componentType = 'Block'
  }

  return schema
}

const registerComponent = (data) => {
  if (Array.isArray(data.component)) {
    const { component, ...others } = data
    component.forEach((item) => {
      resource.set(item, { item, ...others, type: MATERIAL_TYPE.Component })
    })
  } else {
    resource.set(data.component, { ...data, type: MATERIAL_TYPE.Component })
  }

  return data
}

const fetchBlockDetail = async (blockName) => {
  const { getBlockAssetsByVersion } = useBlock()
  const currentVersion = resState.componentsMap?.[blockName]?.version
  const block = (await http.get(`/material-center/api/block?label=${blockName}`))?.[0]

  if (!block) {
    throw new Error(`区块${blockName}不存在！`)
  }

  block.assets = getBlockAssetsByVersion(block, currentVersion)
  block.assets = history?.assets || block.assets

  return block
}

/**
 * registerBlock 注册区块
 * @param {String|Object} data 当为字符串时请求详细信息
 * @param {*} notFetchResouce 是否添加js css资源到页面
 * @returns
 */
const registerBlock = async (data, notFetchResouce) => {
  let block = data

  if (typeof block === 'string') {
    try {
      block = await fetchBlockDetail(block)
    } catch (error) {
      useNotify({
        type: 'warning',
        title: '区块读取错误',
        message: error?.message || error
      })

      return false
    }
  }

  if (!block) {
    return false
  }

  block.type = MATERIAL_TYPE.Block
  block.component = block.component || block.blockName || block.label || block.fileName
  // 区块还原备份时, 后台改变current_history, 所以assets优先从current_history里取
  const assets = block.assets
  const label = block.component
  const { scripts = [], styles = [] } = assets || {}

  if (notFetchResouce) {
    return block
  } else {
    if (!blockResource.get(label)) {
      const { addScript, addStyle } = useCanvas().canvasApi.value
      const promises = scripts
        .filter((item) => item.includes('umd.js'))
        .map(addScript)
        .concat(styles.map(addStyle))
      // 此处删除await，提前放行区块数据，在区块渲染前找到区块数据源映射关系
      Promise.allSettled(promises)
      blockResource.set(label, block.content)
    }
  }

  return block
}

const clearMaterials = () => {
  resState.components = []
  resState.blocks = []
  resource.clear()
}

const clearBlockResources = () => blockResource.clear()

/**
 * 收集第三方组件库依赖
 * @param {array} components 组件物料列表
 */
const generateThirdPartyDeps = (components) => {
  const styles = []
  const scripts = []

  components.forEach((item) => {
    const { npm, component } = item

    if (!npm || !Object.keys(npm).length) return

    const { package: pkg, script, exportName, css } = npm
    const currentPkg = scripts.find((item) => item.package === pkg)

    if (currentPkg) {
      // 保存组件id和导出组件名的对应关系 TinyButton： Button
      currentPkg.components[component] = exportName
    } else {
      scripts.push({
        package: pkg,
        script,
        components: {
          [component]: exportName
        }
      })
    }

    if (css) {
      styles.push(css)
    }
  })

  resState.thirdPartyDeps.scripts.push(...scripts)
  styles.forEach((item) => resState.thirdPartyDeps.styles.add(item))
}

const addMaterials = (materials = {}) => {
  generateThirdPartyDeps(materials.components)
  resState.components.push(...materials.snippets)
  materials.components.map(registerComponent)

  const promises = materials?.blocks?.map((item) => registerBlock(item, true))
  Promise.allSettled(promises).then((blocks) => {
    if (!blocks?.length) {
      return
    }
    // 默认区块都会展示在默认分组中
    if (!resState.blocks?.[0]?.children) {
      resState.blocks.push({
        groupId: useBlock().DEFAULT_GROUP_ID,
        groupName: useBlock().DEFAULT_GROUP_NAME,
        children: []
      })
    }
    resState.blocks[0].children.unshift(...blocks.filter((res) => res.status === 'fulfilled').map((res) => res.value))
  })
}

const getMaterial = (name) => {
  if (name) {
    // 先读取组件缓存，再读取区块缓存
    return (
      resource.get(name) ||
      resource.get(capitalize(camelize(name))) ||
      blockResource.get(name) ||
      blockResource.get(capitalize(camelize(name))) ||
      {}
    )
  } else {
    return {}
  }
}

const setMaterial = (name, data) => {
  resource.set(name, data)
}

const getConfigureMap = () => {
  const entries = Object.entries(Object.fromEntries(resource)).map(([key, value]) => {
    return [key, value.content?.configure || value.configure]
  })
  return Object.fromEntries(entries)
}

const fetchMaterial = async () => {
  const { dslMode, canvasOptions } = getGlobalConfig()
  const bundleUrls = canvasOptions[dslMode].material
  const materials = await Promise.allSettled(bundleUrls.map((url) => http.get(url)))

  materials.forEach((response) => {
    if (response.status === 'fulfilled' && response.value.materials) {
      addMaterials(response.value.materials)
    }
  })
}

const initPage = (pageInfo) => {
  try {
    if (pageInfo.meta) {
      const { occupier } = pageInfo.meta

      useLayout().layoutState.pageStatus = getCanvasStatus(occupier)
    } else {
      useLayout().layoutState.pageStatus = {
        state: 'empty',
        data: {}
      }
    }

    pageInfo.id = pageInfo.meta?.id
  } catch (error) {
    console.log(error) // eslint-disable-line
  }

  const { id, meta, ...pageSchema } = pageInfo
  // 画布传递 schema ，多余的数据不能传递
  useCanvas().initData(pageSchema, {
    id,
    name: pageInfo?.fileName
  })
  useBreadcrumb().setBreadcrumbPage([pageInfo.fileName])
}

/**
 * 根据区块 id 初始化应用
 * @param {string} blockId 区块 id
 */
const initBlock = async (blockId) => {
  const { PLUGIN_NAME, getPluginApi } = useLayout()
  const blockApi = getPluginApi(PLUGIN_NAME.BlockManage)
  const blockContent = await blockApi.getBlockById(blockId)

  if (blockContent.public_scope_tenants.length) {
    blockContent.public_scope_tenants = blockContent.public_scope_tenants.map((e) => e.id)
  }

  useLayout().layoutState.pageStatus = getCanvasStatus(blockContent?.occupier)

  // 请求区块详情
  useBlock().initBlock(blockContent, {}, true)
}

const initPageOrBlock = async () => {
  const { pageId, blockId } = useEditorInfo().useInfo()
  const { setBreadcrumbPage } = useBreadcrumb()

  if (pageId) {
    const { PLUGIN_NAME, getPluginApi } = useLayout()
    const pagePluginApi = getPluginApi(PLUGIN_NAME.AppManage)

    const data = await pagePluginApi.getPageById(pageId)

    useLayout().layoutState.pageStatus = getCanvasStatus(data.occupier)
    useCanvas().initData(data.page_content, data)
    setBreadcrumbPage([data.name])
    return
  }

  if (blockId) {
    await initBlock(blockId)

    return
  }

  // url 没有 pageid 或 blockid，到页面首页或第一页
  const pageInfo = resState.pageTree.find((page) => page?.meta?.isHome) ||
    resState.pageTree.find(
      (page) => page.componentName === COMPONENT_NAME.Page && page?.meta?.group !== 'publicPages'
    ) || {
      componentName: COMPONENT_NAME.Page
    }
  initPage(pageInfo)
}

const handlePopStateEvent = async () => {
  const { id, type } = useEditorInfo().useInfo()

  await initPageOrBlock()

  // 国际化貌似有 app 和区块之分，但是目前其实都存到了 app 里面，需要确认是否需要修复
  await useTranslate().initI18n({ host: id, hostType: type })
}

/**
 * 获取区块保存的依赖信息，合并到resState.thirdPartyDeps
 * @param {object} dependencies 区块保存的依赖信息
 */
const getBlockDeps = (dependencies = {}) => {
  const { scripts = [], styles = [] } = dependencies

  scripts.length &&
    scripts.forEach((npm) => {
      const { package: pkg, script, css, components } = npm
      const npmInfo = resState.thirdPartyDeps.scripts.find((item) => item.package === pkg)

      if (!npmInfo || !npmInfo.script) {
        resState.thirdPartyDeps.scripts.push({ package: pkg, script, css, components })
      } else {
        const components = npmInfo.components || {}

        npmInfo.components = { ...components, ...npm.components }
      }
    })

  styles?.forEach((item) => resState.thirdPartyDeps.styles.add(item))
}

const fetchResource = async ({ isInit = true } = {}) => {
  const { id, type } = useEditorInfo().useInfo()
  useApp().appInfoState.selectedId = id

  const { Builtin } = useCanvas().canvasApi.value
  Builtin.data.materials.components[0].children.map(registerComponent)
  BuiltinComponentMaterials.components[0].children.map(registerComponent)

  const builtinSnippets = {
    group: '内置组件',
    children: [...Builtin.data.materials.snippets[0].children, ...BuiltinComponentMaterials.snippets[0].children]
  }

  resState.components.push(builtinSnippets)

  const appData = await useHttp().get(`/app-center/v1/api/apps/schema/${id}`)
  resState.pageTree = appData.componentsTree
  resState.dataSource = appData.dataSource?.list
  resState.dataHandler = appData.dataSource?.dataHandler || DEFAULT_INTERCEPTOR.dataHandler
  resState.willFetch = appData.dataSource?.willFetch || DEFAULT_INTERCEPTOR.willFetch
  resState.errorHandler = appData.dataSource?.errorHandler || DEFAULT_INTERCEPTOR.errorHandler

  resState.bridge = appData.bridge
  resState.utils = appData.utils
  resState.isDemo = appData.meta?.is_demo
  resState.globalState = appData?.meta.global_state

  if (isInit) {
    resState.componentsMap = appData.componentsMap?.reduce((componentsMap, component) => {
      if (component.dependencies) {
        getBlockDeps(component.dependencies)
      }

      return { ...componentsMap, [component.componentName]: component }
    }, {})
  }

  // 词条语言为空时使用默认的语言
  const defaultLocales = [
    { lang: 'zh_CN', label: 'zh_CN' },
    { lang: 'en_US', label: 'en_US' }
  ]
  const locales = Object.keys(appData.i18n).length
    ? Object.keys(appData.i18n).map((key) => ({ lang: key, label: key }))
    : defaultLocales
  resState.langs = {
    locales,
    messages: appData.i18n
  }

  try {
    await fetchMaterial()

    if (isInit) {
      await initPageOrBlock()
    }

    await useTranslate().initI18n({ host: id, hostType: type, init: true })
  } catch (error) {
    console.log(error) // eslint-disable-line
  }
}

const getSnippetRelationship = (component) => {
  let relationship = {}
  resState.components.forEach(({ children }) => {
    const child = children.find(({ snippetName }) => snippetName === component)
    child && (relationship = child.relationship)
  })

  return relationship
}

/**
 * 获取新增区块的依赖，更新画布中的组件依赖
 * @param {array} blocks 新增的区块列表
 */
const updateCanvasDependencies = (blocks) => {
  blocks.forEach((block) => {
    if (!block.content.dependencies) return

    getBlockDeps(block.content.dependencies)
  })

  useCanvas().canvasApi.value?.canvasDispatch('updateDependencies', { detail: resState.thirdPartyDeps })
}

export default function () {
  return {
    resState,
    fetchResource,
    fetchMaterial,
    generateNode,
    addMaterials,
    clearMaterials,
    clearBlockResources,
    getMaterial,
    setMaterial,
    getConfigureMap,
    registerComponent,
    registerBlock,
    getSnippetRelationship,
    initPageOrBlock,
    handlePopStateEvent,
    updateCanvasDependencies
  }
}
