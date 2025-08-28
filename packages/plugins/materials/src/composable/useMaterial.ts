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

/* metaService: engine.service.material.useMaterial */
import { reactive } from 'vue'
import { utils, constants } from '@opentiny/tiny-engine-utils'
import { meta as BuiltinComponentMaterials } from '@opentiny/tiny-engine-builtin-component'
import {
  getMergeMeta,
  getOptions,
  useCanvas,
  useBlock,
  useMessage,
  useResource,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import meta from '../../meta'
import { getBlockCompileRes, getBlockByName, updateBlockCompileCache } from './block-compile'
import type {
  Block,
  BlockResource,
  Component,
  Dependency,
  InitMaterialOptions,
  Material,
  MaterialState,
  Property,
  Resource,
  Schema,
  Snippet
} from './types'

const { camelize, capitalize, deepClone } = utils
const { MATERIAL_TYPE } = constants

// 这里存放所有TinyVue组件、原生HTML、内置组件的缓存，包含了物料插件面板里所有显示的组件，也包含了没显示的一些联动组件
const resource = new Map<string, Resource>()

// 这里涉及到区块发布后的更新问题，所以需要单独缓存区块
const blockResource = new Map<string, BlockResource>()

const materialState = reactive<MaterialState>({
  components: [], // 这里存放的是物料插件面板里所有显示的组件
  blocks: [],
  componentsDepsMap: { scripts: [], styles: new Set() }, //
  packages: [] // 物料依赖的包
})

const getSnippet = (component: string) => {
  let schema: Schema = {}
  materialState.components.some(({ children }) => {
    const child = children.find(({ snippetName }) => snippetName === component)
    if (child?.schema) {
      schema = child.schema
      return true
    }
    return false
  })

  return schema
}

/**
 * 获取物料组件的配置信息
 * @returns
 */
const getConfigureMap = () => {
  const entries = Object.entries(Object.fromEntries(resource)).map(([key, value]) => {
    return [key, value.content?.configure || value.configure]
  })
  return Object.fromEntries(entries)
}

/**
 * 附加基础属性，基础属性可以通过注册表配置
 * @param schemaProperties
 * @returns
 */
const patchBaseProps = (schemaProperties?: Property[]) => {
  if (!Array.isArray(schemaProperties)) {
    return
  }

  const { properties = [], insertPosition = 'end' } = getOptions(meta.id).basePropertyOptions || {}

  for (const basePropGroup of properties) {
    const group = schemaProperties.find((item) => {
      // 如果存在了包含'其他'字符串的分组，统一为'其他'分组
      if (item.label.zh_CN?.includes('其他')) {
        item.label.zh_CN = '其他'
      }

      return (
        (basePropGroup.group && basePropGroup.group === item.group) || basePropGroup.label.zh_CN === item.label.zh_CN
      )
    })

    if (group) {
      const targetInsertContent = basePropGroup.content.filter(
        (item: { property: string }) => !group.content.some((prop) => prop.property === item.property)
      )

      if (insertPosition === 'start') {
        group.content.splice(0, 0, ...deepClone(targetInsertContent))
      } else {
        group.content.push(...deepClone(targetInsertContent))
      }
    } else {
      schemaProperties.push(deepClone(basePropGroup))
    }
  }
}

/**
 * 将component里的内容注册到resource变量中
 * @param data
 */
const registerComponentToResource = (data: Component) => {
  patchBaseProps(data.schema?.properties)

  if (Array.isArray(data.component)) {
    const { component, ...others } = data
    component.forEach((item) => {
      resource.set(item, { item, ...others, type: MATERIAL_TYPE.Component })
    })
  } else {
    resource.set(data.component, { ...data, type: MATERIAL_TYPE.Component })
  }
}

const clearMaterials = () => {
  materialState.components = []
  materialState.blocks = []
  resource.clear()
}

const clearBlockResources = () => blockResource.clear()

/**
 * 生成组件依赖映射
 * @param components 组件物料列表
 */
const generateThirdPartyDeps = (components: Component[]) => {
  const styles: string[] = []
  const scripts: {
    package: string
    script?: string
    components: Record<string, { exportName?: string; destructuring: boolean }>
  }[] = []

  components.forEach((item) => {
    const { npm, component } = item

    if (!npm || !Object.keys(npm).length) return

    const { package: pkg, script, exportName, css, destructuring = true } = npm
    const currentPkg = scripts.find((item) => item.package === pkg)

    if (currentPkg) {
      // 保存组件id和导出组件名的对应关系 TinyButton： Button
      currentPkg.components[component] = {
        exportName,
        destructuring
      }
    } else {
      scripts.push({
        package: pkg,
        script,
        components: {
          [component]: {
            destructuring,
            exportName
          }
        }
      })
    }

    if (css) {
      styles.push(css)
    }
  })

  return { styles, scripts }
}

/**
 * 添加组件snippets(分组相同则合并)
 * @param componentSnippets 待添加的组件snippets
 * @param snippetsData 当前snippets
 * @returns snippetsData 合并后的snippets
 */
const addComponentSnippets = (componentSnippets: Snippet[] | undefined, snippetsData: Snippet[]) => {
  if (!componentSnippets) return

  const snippetsMap = new Map<string, Snippet>()
  snippetsData.forEach((snippetGroup) => snippetsMap.set(snippetGroup.group, snippetGroup))
  componentSnippets.forEach((snippetGroup) => {
    if (snippetsMap.has(snippetGroup.group)) {
      snippetsMap.get(snippetGroup.group)!.children.push(...snippetGroup.children)
    } else {
      const snippetGroupClone = deepClone(snippetGroup)
      snippetsData.push(snippetGroupClone)
      snippetsMap.set(snippetGroup.group, snippetGroupClone)
    }
  })

  return snippetsData
}

const getCanvasDeps = () => {
  const { scripts, styles } = useResource().appSchemaState.materialsDeps

  return {
    scripts: [...scripts].filter((item) => item.script),
    styles: [...styles]
  }
}

/**
 * 组装画布的依赖，通知画布更新docsrc
 */
const updateCanvasDeps = () => {
  useMessage().publish({
    topic: 'init_canvas_deps',
    data: getCanvasDeps()
  })
}

//
const parseMaterialsDependencies = (materialBundle: Material) => {
  const { packages, components } = materialBundle

  const { scripts: scriptsDeps, styles: stylesDeps } = useResource().appSchemaState.materialsDeps

  packages?.forEach((pkg) => {
    if (!pkg.script || !pkg.package || scriptsDeps.find((item) => item.package === pkg.package)) {
      return
    }

    scriptsDeps.push(pkg)

    if (!pkg.css) {
      return
    }

    if (Array.isArray(pkg.css)) {
      pkg.css.forEach((item) => stylesDeps.add(item))
    } else {
      stylesDeps.add(pkg.css)
    }
  })

  // 解析组件npm字段（兼容旧的物料协议）
  const { scripts, styles } = generateThirdPartyDeps(components)
  // 合并到canvasDeps中
  scripts.forEach((item) => {
    const dep = scriptsDeps.find((dep) => dep.package === item.package)

    if (dep) {
      // 合并组件
      dep.components = { ...dep.components, ...(item.components || {}) }
    } else {
      scriptsDeps.push(item)
    }
  })

  if (!styles) {
    return
  }

  if (Array.isArray(styles)) {
    styles.forEach((item) => stylesDeps.add(item))
  } else {
    stylesDeps.add(styles)
  }
}

/**
 * 添加物料Bundle文件中的组件类型物料
 * @param materialBundle 物料包Bundle.json文件对象
 * @returns null
 */
const addComponents = (materialBundle: Material) => {
  const { snippets, components } = materialBundle
  // 解析物料依赖
  parseMaterialsDependencies(materialBundle)
  // 注册组件到map中
  components.forEach(registerComponentToResource)
  // 添加组件snippets
  addComponentSnippets(snippets, materialState.components)
}

/**
 * 添加物料Bundle文件中的区块类型物料
 * @param blocks 物料包Bundle.json文件中blocks对象
 */
const addBlocks = (blocks?: Block[]) => {
  if (!Array.isArray(blocks) || !blocks.length) {
    return
  }

  // 提前构建区块
  blocks.map((item) => getBlockCompileRes(item))

  // 默认区块都会展示在默认分组中
  if (!materialState.blocks?.[0]?.children) {
    materialState.blocks.push({
      groupId: useBlock().DEFAULT_GROUP_ID,
      groupName: useBlock().DEFAULT_GROUP_NAME,
      children: []
    })
  }

  // 区块存到物料列表
  materialState.blocks[0].children.unshift(...blocks)
}

/**
 * 获取到符合物料协议的bundle.json之后，处理组件与区块物料
 * @param materials
 */
const addMaterials = (materials: Material) => {
  addComponents(materials)
  addBlocks(materials.blocks)
}

const getMaterial = (name?: string): Partial<Resource & BlockResource> => {
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

const setMaterial = (name: string, data: Resource) => {
  resource.set(name, data)
}

/**
 * 获取物料，并返回符合物料协议的bundle.json内容
 * @returns getMaterialsRes: () =>  Promise<Materials>
 */
export const getMaterialsRes = async () => {
  const bundleUrls = getMergeMeta('engine.config')?.material || []
  const materials = await Promise.allSettled(
    bundleUrls.map((url: any) => (typeof url === 'string' ? getMetaApi(META_SERVICE.Http).get(url) : url))
  )
  return materials
}

const fetchMaterial = async () => {
  const materials = await getMaterialsRes()

  materials.forEach((response) => {
    if (response.status === 'fulfilled' && response.value.materials) {
      addMaterials(response.value.materials)
    }
  })

  updateCanvasDeps()
}

/**
 * 获取区块保存的依赖信息，合并到appSchemaState.thirdPartyDeps
 * @param {object} dependencies 区块保存的依赖信息
 */
const getBlockDeps = (dependencies: { scripts?: Dependency[]; styles?: any[] } = {}) => {
  const { scripts = [], styles = [] } = dependencies

  if (scripts.length) {
    scripts.forEach((npm) => {
      const { package: pkg, script, css, components } = npm
      const npmInfo = materialState.componentsDepsMap.scripts.find((item) => item.package === pkg)

      if (!npmInfo || !npmInfo.script) {
        materialState.componentsDepsMap.scripts.push({ package: pkg, script, css, components })
      } else {
        const components = npmInfo.components || {}

        npmInfo.components = { ...components, ...npm.components }
      }
    })
  }

  if (Array.isArray(styles)) {
    styles.forEach((item) => materialState.componentsDepsMap.styles.add(item))
  }
}

/**
 * 过滤内置物料，用户配置隐藏的内置物料，不显示在物料面板
 * @param materials 物料
 * @returns 过滤后的物料
 */
const filterBuiltinMaterials = (materials: Material) => {
  const hiddenBuiltinMaterials = getOptions(meta.id).hiddenBuiltinMaterials || []

  return {
    ...materials,
    snippets: materials.snippets?.map((item) => {
      return {
        ...item,
        children: item.children?.filter((child) => !hiddenBuiltinMaterials.includes(child.snippetName))
      }
    })
  }
}

const initBuiltinMaterial = () => {
  const { Builtin } = useCanvas().canvasApi.value
  const builtinMaterials = filterBuiltinMaterials(Builtin!.data.materials)
  const builtinComponentMaterials = filterBuiltinMaterials(BuiltinComponentMaterials)

  // 添加画布物料
  addMaterials(builtinMaterials)
  // 添加builtin-component NPM包物料
  addMaterials(builtinComponentMaterials)
}

const initMaterial = ({ isInit = true, appData = {} }: InitMaterialOptions = {}) => {
  initBuiltinMaterial()
  if (isInit) {
    appData.componentsMap?.forEach((component) => {
      if (component.dependencies) {
        getBlockDeps(component.dependencies)
      }
    })
  }
}
const generateNode = ({ type, component }) => {
  const snippet = getSnippet(component) || {}
  const material = getMaterial(component)
  // 判断是否要加基础样式
  const materialUseBaseStyle = material.configure?.useBaseStyle
  const globalUseBaseStyle = getOptions(meta.id).useBaseStyle
  const useBaseStyle = globalUseBaseStyle && materialUseBaseStyle !== false
  const schema = {
    componentName: component,
    ...snippet,
    props: {
      ...snippet.props,
      className: useBaseStyle ? getOptions(meta.id).componentBaseStyle.className : ''
    }
  }

  if (type === 'block') {
    schema.componentType = 'Block'
    schema.props.className = getOptions(meta.id).useBaseStyle ? getOptions(meta.id).blockBaseStyle.className : ''
  }

  return schema
}
const refreshMaterial = async () => {
  clearMaterials()
  initMaterial()
  await fetchMaterial()
}

/**
 * 根据组名获取指定分组组件
 * @param components 所有组件
 * @param groupName 组件分组名
 * @returns
 */
const getComponentsByGroup = (components: Component[], groupName: string) => {
  if (!Array.isArray(components)) return []
  return components.filter((item) => item.group === groupName)
}

/**
 * 增加区块缓存
 * @param id 区块 id，也就是 label 字段
 * @param resource 区块信息，区块详情中的 content 字段
 */
export const addBlockResources = (id: string, resource: BlockResource) => {
  blockResource.set(id, resource)
}

const getComponentList = () => {
  return Array.from(resource.values())
    .filter((item) => item.type === MATERIAL_TYPE.Component)
    .map((dataItem) => {
      return {
        component: dataItem.component,
        name: dataItem.name
      }
    })
}

const getComponentDetail = (name) => {
  const data = resource.get(name)

  const props = data.schema.properties
    .map((item) => {
      return item.content.map((content) => {
        return {
          property: content.property,
          description: content.description,
          type: content.type,
          defaultValue: content.defaultValue
        }
      })
    })
    .flat()

  const events = Object.entries(data.schema.events || {}).map(([key, value]) => {
    return {
      name: key,
      description: value?.description || ''
    }
  })

  const slots = Object.entries(data.schema.slots || {}).map(([key, value]) => {
    return {
      name: key,
      description: value?.description || ''
    }
  })

  return {
    component: data.component,
    name: data.name,
    configure: data.configure,
    props,
    events,
    slots
  }
}

export default function () {
  return {
    materialState, // 存放着组件、物料侧区块、第三方依赖信息
    initMaterial, // 物料模块初始化
    fetchMaterial, // 请求物料并进行处理
    getMaterialsRes, // 获取物料，并返回符合物料协议的bundle.json内容，getMaterialsRes: () =>  Promise<Materials>
    generateNode, // 根据 包含{ type, componentName }的组件信息生成组件schema节点，结构：
    clearMaterials, // 清空物料
    clearBlockResources, // 清空区块缓存，以便更新最新版区块
    getMaterial, // 获取单个物料，(property) getMaterial: (name: string) => Material
    setMaterial, // 设置单个物料 (property) setMaterial: (name: string, data: Material) => void
    addMaterials, // 添加多个物料
    getCanvasDeps, // 组装画布依赖，包含物料和工具类的依赖。
    updateCanvasDeps, // 通知画布更新依赖
    getConfigureMap, // 获取物料组件的配置信息
    getBlockByName,
    getBlockCompileRes,
    addBlockResources,
    updateBlockCompileCache,
    getComponentsByGroup,
    refreshMaterial,
    getComponentList,
    getComponentDetail
  }
}
