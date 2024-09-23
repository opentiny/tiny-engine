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
import { useHttp } from '@opentiny/tiny-engine-http'
import { utils, constants } from '@opentiny/tiny-engine-utils'
import { meta as BuiltinComponentMaterials } from '@opentiny/tiny-engine-builtin-component'
import { getMergeMeta, getOptions, useNotify, useCanvas, useBlock } from '@opentiny/tiny-engine-meta-register'
import meta from '../../meta'

const { camelize, capitalize } = utils
const { MATERIAL_TYPE } = constants

// 这里存放所有TinyVue组件、原生HTML、内置组件的缓存，包含了物料插件面板里所有显示的组件，也包含了没显示的一些联动组件
const resource = new Map()

// 这里涉及到区块发布后的更新问题，所以需要单独缓存区块
const blockResource = new Map()

const http = useHttp()

const materialState = reactive({
  components: [], // 这里存放的是物料插件面板里所有显示的组件
  blocks: [],
  thirdPartyDeps: { scripts: [], styles: new Set() }
})

const componentState = reactive({
  componentsMap: {}
})
const getSnippet = (component) => {
  let schema = {}
  materialState.components.some(({ children }) => {
    const child = children.find(({ snippetName }) => snippetName === component)
    if (child) {
      schema = child.schema
      return true
    }
    return false
  })

  return schema
}

const generateNode = ({ type, component }) => {
  const snippet = getSnippet(component) || {}
  const schema = {
    componentName: component,
    props: {},
    ...snippet
  }

  if (type === 'block') {
    schema.componentType = 'Block'
  }

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
 * @param {any[]} schemaProperties
 * @returns
 */
const patchBaseProps = (schemaProperties) => {
  if (!Array.isArray(schemaProperties)) {
    return
  }

  const { properties = [], insertPosition = 'end' } = getOptions(meta.id).basePropertyOptions || {}

  for (const basePropGroup of properties) {
    const group = schemaProperties.find((item) => {
      // 如果存在了包含'其他'字符串的分组，统一为'其他'分组
      if (item.label.zh_CN.includes('其他')) {
        item.label.zh_CN = '其他'
      }

      return (
        (basePropGroup.group && basePropGroup.group === item.group) || basePropGroup.label.zh_CN === item.label.zh_CN
      )
    })

    if (group) {
      if (insertPosition === 'start') {
        group.content.splice(0, 0, ...basePropGroup.content)
      } else {
        group.content.push(...basePropGroup.content)
      }
    } else {
      schemaProperties.push(basePropGroup)
    }
  }
}

/**
 * 将component里的内容注册到resource变量中
 * @param {*} data
 */
const registerComponentToResource = (data) => {
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

const fetchBlockDetail = async (blockName) => {
  const { getBlockAssetsByVersion } = useBlock()
  const currentVersion = componentState.componentsMap?.[blockName]?.version
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

  if (!notFetchResouce && !blockResource.get(label)) {
    const { addScript, addStyle } = useCanvas().canvasApi.value
    const promises = scripts
      .filter((item) => item.includes('umd.js'))
      .map(addScript)
      .concat(styles.map(addStyle))
    // 此处删除await，提前放行区块数据，在区块渲染前找到区块数据源映射关系
    Promise.allSettled(promises)
    blockResource.set(label, block.content)
  }
  return block
}

const clearMaterials = () => {
  materialState.components = []
  materialState.blocks = []
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

  return { styles, scripts }
}

/**
 * 设置第三方组件库依赖
 * @param {array} components 组件物料列表
 */
const setThirdPartyDeps = (components) => {
  const { scripts = [], styles = [] } = generateThirdPartyDeps(components)
  materialState.thirdPartyDeps.scripts.push(...scripts)
  styles.forEach((item) => materialState.thirdPartyDeps.styles.add(item))
}

/**
 * 添加组件snippets(分组相同则合并)
 * @param {*} componentsSnippets 待添加的组件snippets
 * @param {*} snippetsData 当前snippets
 * @returns {*} snippetsData 合并后的snippets
 */
const addComponentSnippets = (componentSnippets, snippetsData) => {
  if (!componentSnippets) return

  const snippetsMap = new Map()
  snippetsData.forEach((snippetGroup) => snippetsMap.set(snippetGroup.group, snippetGroup))
  componentSnippets.forEach((snippetGroup) => {
    if (snippetsMap.has(snippetGroup.group)) {
      snippetsMap.get(snippetGroup.group).children.push(...snippetGroup.children)
    } else {
      snippetsData.push(snippetGroup)
    }
  })

  return snippetsData
}

/**
 * 添加物料Bundle文件中的组件类型物料
 * @param {*} materialBundle 物料包Bundle.json文件对象
 * @returns null
 */
const addComponents = (materialBundle) => {
  const { snippets, components } = materialBundle
  // 解析组件三方依赖
  setThirdPartyDeps(components)
  // 注册组件到map中
  components.forEach(registerComponentToResource)
  // 添加组件snippets
  addComponentSnippets(snippets, materialState.components)
}

/**
 * 添加物料Bundle文件中的区块类型物料
 * @param {*} blocks 物料包Bundle.json文件中blocks对象
 */
const addBlocks = (blocks) => {
  if (!Array.isArray(blocks) || !blocks.length) {
    return
  }
  const promises = blocks?.map((item) => registerBlock(item, true))

  Promise.allSettled(promises).then((blocks) => {
    if (!blocks?.length) {
      return
    }
    // 默认区块都会展示在默认分组中
    if (!materialState.blocks?.[0]?.children) {
      materialState.blocks.push({
        groupId: useBlock().DEFAULT_GROUP_ID,
        groupName: useBlock().DEFAULT_GROUP_NAME,
        children: []
      })
    }
    materialState.blocks[0].children.unshift(
      ...blocks.filter((res) => res.status === 'fulfilled').map((res) => res.value)
    )
  })
}

/**
 * 获取到符合物料协议的bundle.json之后，处理组件与区块物料
 * @param {*} materials
 */
const addMaterials = (materials = {}) => {
  addComponents(materials)
  addBlocks(materials.blocks)
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

/**
 * 获取物料，并返回符合物料协议的bundle.json内容
 * @returns getMaterialsRes: () =>  Promise<Materials>
 */
export const getMaterialsRes = async () => {
  const bundleUrls = getMergeMeta('engine.config')?.material || []
  const materials = await Promise.allSettled(bundleUrls.map((url) => http.get(url)))
  let properties = []
  materials[0].value.materials.components.forEach((item) => {
    let materialProps = []
    item.schema.properties.forEach((group) => {
      group.content.forEach((prop) => {
        materialProps.push({
          label: prop.label.text.zh_CN,
          description: prop.description?.zh_CN,
          property: prop.property
        })
      })
    })
    materialProps = materialProps.map((mProps) => {
      return { name: item.name.zh_CN, category: item.category, component: item.component, ...mProps }
    })
    properties = properties.concat(materialProps)
  })
  console.log(properties)
  return materials
}

const fetchMaterial = async () => {
  const materials = await getMaterialsRes()

  materials.forEach((response) => {
    if (response.status === 'fulfilled' && response.value.materials) {
      addMaterials(response.value.materials)
    }
  })
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
      const npmInfo = materialState.thirdPartyDeps.scripts.find((item) => item.package === pkg)

      if (!npmInfo || !npmInfo.script) {
        materialState.thirdPartyDeps.scripts.push({ package: pkg, script, css, components })
      } else {
        const components = npmInfo.components || {}

        npmInfo.components = { ...components, ...npm.components }
      }
    })

  styles?.forEach((item) => materialState.thirdPartyDeps.styles.add(item))
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

  useCanvas().canvasApi.value?.canvasDispatch('updateDependencies', { detail: materialState.thirdPartyDeps })
}

const initBuiltinMaterial = () => {
  const { Builtin } = useCanvas().canvasApi.value
  // 添加画布物料
  addMaterials(Builtin.data.materials)
  // 添加builtin-component NPM包物料
  addMaterials(BuiltinComponentMaterials)
}

const initMaterial = ({ isInit = true, appData = {} } = {}) => {
  initBuiltinMaterial()
  if (isInit) {
    componentState.componentsMap = {}
    appData.componentsMap?.forEach((component) => {
      if (component.dependencies) {
        getBlockDeps(component.dependencies)
      }
      componentState.componentsMap[component.componentName] = component
    })
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
    registerBlock, // 注册新的区块
    updateCanvasDependencies, //传入新的区块，获取新增区块的依赖，更新画布中的组件依赖
    getConfigureMap // 获取物料组件的配置信息
  }
}

const a = [
  {
    name: '输入框',
    category: 'element-plus',
    component: 'ElInput',
    label: '绑定值',
    description: '绑定值',
    property: 'modelValue'
  },
  {
    name: '输入框',
    category: 'element-plus',
    component: 'ElInput',
    label: '尺寸',
    description: '尺寸',
    property: 'size'
  },
  {
    name: '输入框',
    category: 'element-plus',
    component: 'ElInput',
    label: '类型',
    description: '类型',
    property: 'type'
  },
  {
    name: '输入框',
    category: 'element-plus',
    component: 'ElInput',
    label: '占位文本',
    description: '输入框占位文本',
    property: 'placeholder'
  },
  {
    name: '输入框',
    category: 'element-plus',
    component: 'ElInput',
    label: '最大长度',
    description: '最大输入长度',
    property: 'maxlength'
  },
  {
    name: '输入框',
    category: 'element-plus',
    component: 'ElInput',
    label: '是否禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '尺寸',
    description: '尺寸',
    property: 'size'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '类型',
    description: '类型',
    property: 'type'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '朴素按钮',
    description: '是否为朴素按钮',
    property: 'plain'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '文字按钮',
    description: '是否为文字按钮',
    property: 'text'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '背景颜色',
    description: '是否显示文字按钮背景颜色',
    property: 'bg'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '链接按钮',
    description: '是否为链接按钮',
    property: 'link'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '圆角按钮',
    description: '是否为圆角按钮',
    property: 'round'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '圆形按钮',
    description: '是否为圆形按钮',
    property: 'circle'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '加载中状态',
    description: '是否为加载中状态',
    property: 'loading'
  },
  {
    name: '按钮',
    category: 'element-plus',
    component: 'ElButton',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '数据对象',
    description: '表单数据对象',
    property: 'model'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '验证规则',
    description: '表单验证规则',
    property: 'rules'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '行内模式',
    description: '行内表单模式',
    property: 'inline'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '标签位置',
    description: '表单域标签的位置， 当设置为 left 或 right 时，则也需要设置标签宽度属性',
    property: 'label-position'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '标签宽度',
    description: "标签的长度，例如 '50px'。 作为 Form 直接子元素的 form-item 会继承该值。 可以使用 auto。",
    property: 'label-width'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '标签后缀',
    description: '表单域标签的后缀',
    property: 'label-suffix'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '隐藏必填星号',
    description: '是否隐藏必填字段标签旁边的红色星号',
    property: 'hide-required-asterisk'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '星号位置',
    description: '星号的位置',
    property: 'require-asterisk-position'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '显示校验信息',
    description: '是否显示校验错误信息',
    property: 'show-message'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '行内显示校验信息',
    description: '是否以行内形式展示校验信息',
    property: 'inline-message'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '显示校验结果图标',
    description: '是否在输入框中显示校验结果反馈图标',
    property: 'status-icon'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '触发验证',
    description: '是否在 rules 属性改变后立即触发一次验证',
    property: 'validate-on-rule-change'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '尺寸',
    description: '用于控制该表单内组件的尺寸',
    property: 'size'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '禁用',
    description: '是否禁用该表单内的所有组件。 如果设置为 true, 它将覆盖内部组件的 disabled 属性',
    property: 'disabled'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElForm',
    label: '滚动到错误项',
    description: '当校验失败时，滚动到第一个错误表单项',
    property: 'scroll-to-error'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '键名',
    description:
      "model 的键名。 它可以是一个属性的值(如 a.b.0 或 [a', 'b', '0'])。 在定义了 validate、resetFields 的方法时，该属性是必填的",
    property: 'prop'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '标签文本',
    description: '标签文本',
    property: 'label'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '标签宽度',
    description: "标签宽度，例如 '50px'。 可以使用 auto",
    property: 'label-width'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '必填项',
    description: '是否为必填项，如不设置，则会根据校验规则确认',
    property: 'required'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '验证规则',
    description: '表单验证规则, 更多内容可以参考async-validator',
    property: 'rules'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '错误信息',
    description: '表单域验证错误时的提示信息。设置该值会导致表单验证状态变为 error，并显示该错误信息',
    property: 'error'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '显示错误信息',
    description: '是否显示校验错误信息',
    property: 'show-message'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '行内显示错误信息',
    description: '是否在行内显示校验信息',
    property: 'inline-message'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '尺寸',
    description: '用于控制该表单内组件的尺寸',
    property: 'size'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: 'for',
    description: '和原生标签相同能力',
    property: 'for'
  },
  {
    name: '表单子项',
    category: 'element-plus',
    component: 'ElFormItem',
    label: '校验状态',
    description: 'formItem 校验的状态',
    property: 'validate-status'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '数据',
    description: '显示的数据',
    property: 'data'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '表格列配置',
    description: '表格列的配置信息',
    property: 'columns'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '最大高度',
    description: 'Table 的最大高度。',
    property: 'max-height'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '表格高度',
    description:
      'Table 的高度， 默认为自动高度。 这个高度会设置为 Table 的 style.height 的值，Table 的高度会受控于外部样式。',
    property: 'height'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '斑马纹',
    description: '是否为斑马纹 table',
    property: 'stripe'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '纵向边框',
    description: '是否带有纵向边框',
    property: 'border'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '表格尺寸',
    description: 'Table 的尺寸',
    property: 'size'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '列宽自撑开',
    description: '列的宽度是否自撑开',
    property: 'fit'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '显示表头',
    description: '是否显示表头',
    property: 'show-header'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '高亮当前行',
    description: '是否要高亮当前行',
    property: 'highlight-current-row'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '当前行的 key',
    description: '当前行的 key，只写属性',
    property: 'current-row-key'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '行的类名',
    description: '行的 className',
    property: 'row-class-name'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '行数据的 Key',
    description:
      '行数据的 Key，用来优化 Table 的渲染； 在使用reserve-selection功能与显示树形数据时，该属性是必填的。 类型为 String 时，支持多层访问：user.info.id，但不支持 user.info[0].id，此种情况请使用 Function',
    property: 'row-key'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '空数据文本',
    description: '空数据时显示的文本内容',
    property: 'empty-text'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '表格布局方式',
    description: '设置表格单元、行和列的布局方式',
    property: 'table-layout'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '显示滚动条',
    description: '总是显示滚动条',
    property: 'scrollbar-always-on'
  },
  {
    name: '表单',
    category: 'element-plus',
    component: 'ElTable',
    label: '主轴最小尺寸',
    description: '确保主轴的最小尺寸，以便不超过内容',
    property: 'flexible'
  },
  {
    name: '走马灯子项',
    category: '容器组件',
    component: 'TinyCarouselItem',
    label: '名称',
    description: '幻灯片的名字，可用作 setActiveItem 的参数',
    property: 'name'
  },
  {
    name: '走马灯子项',
    category: '容器组件',
    component: 'TinyCarouselItem',
    label: '标题',
    description: '幻灯片的标题',
    property: 'title'
  },
  {
    name: '走马灯子项',
    category: '容器组件',
    component: 'TinyCarouselItem',
    label: '指示器位置',
    description: '指示器的位置',
    property: 'indicator-position'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '箭头显示时机',
    description: '切换箭头的显示时机',
    property: 'arrow'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '自动切换',
    description: '是否自动切换',
    property: 'autoplay'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '选项卡',
    description: 'tabs 选项卡',
    property: 'tabs'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '高度',
    description: '走马灯的高度',
    property: 'height'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '位置',
    description: '指示器的位置',
    property: 'indicator-position'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '初始索引',
    description: '初始状态激活的幻灯片的索引，从 0 开始 ',
    property: 'initial-index'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '自动切换间隔',
    description: '自动切换的时间间隔，单位为毫秒',
    property: 'interval'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '循环显示',
    description: '是否循环显示',
    property: 'loop'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '显示标题',
    description: '是否显示标题',
    property: 'show-title'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '触发方式',
    description: '指示器的触发方式，默认为 hover',
    property: 'trigger'
  },
  {
    name: '走马灯',
    category: '容器组件',
    component: 'TinyCarousel',
    label: '类型',
    description: '走马灯的类型',
    property: 'type'
  },
  {
    name: '提示框',
    component: 'a',
    label: '类型',
    description: '类型',
    property: 'children'
  },
  {
    name: '提示框',
    component: 'a',
    label: '链接',
    description: '指定链接的 URL',
    property: 'href'
  },
  {
    name: '提示框',
    component: 'a',
    label: '打开方式',
    description: '指定链接的打开方式，例如在当前窗口中打开或在新窗口中打开。',
    property: 'target'
  },
  {
    name: '提示框',
    component: 'a',
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: '标题',
    category: 'html',
    component: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    label: '类型',
    description: '类型',
    property: 'children'
  },
  {
    name: '标题',
    category: 'html',
    component: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: '段落',
    category: 'html',
    component: 'p',
    label: '类型',
    description: '类型',
    property: 'children'
  },
  {
    name: '段落',
    category: 'html',
    component: 'p',
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: '输入框',
    category: 'html',
    component: 'input',
    label: '类型',
    description: '类型',
    property: 'type'
  },
  {
    name: '输入框',
    category: 'html',
    component: 'input',
    label: '占位符',
    description: '占位符',
    property: 'placeholder'
  },
  {
    name: '输入框',
    category: 'html',
    component: 'input',
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: '视频',
    category: 'html',
    component: 'video',
    label: '资源',
    description: '视频的 URL',
    property: 'src'
  },
  {
    name: '视频',
    category: 'html',
    component: 'video',
    label: '播放器宽度',
    description: '视频播放器的宽度',
    property: 'width'
  },
  {
    name: '视频',
    category: 'html',
    component: 'video',
    label: '播放器高度',
    description: '视频播放器的高度',
    property: 'height'
  },
  {
    name: '视频',
    category: 'html',
    component: 'video',
    label: '显示控件',
    description: '是否显示控件',
    property: 'controls'
  },
  {
    name: '视频',
    category: 'html',
    component: 'video',
    label: '马上播放',
    description: '是否马上播放',
    property: 'autoplay'
  },
  {
    name: '视频',
    category: 'html',
    component: 'video',
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: 'Img',
    category: 'html',
    component: 'Img',
    label: '资源',
    description: 'src路径',
    property: 'src'
  },
  {
    name: 'Img',
    category: 'html',
    component: 'Img',
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: 'Button',
    category: 'html',
    component: 'button',
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: '表格',
    category: 'html',
    component: 'table',
    label: '宽度',
    description: '表格的宽度',
    property: 'width'
  },
  {
    name: '表格',
    category: 'html',
    component: 'table',
    label: '边框宽度',
    description: '表格边框的宽度',
    property: 'border'
  },
  {
    name: '表格',
    category: 'html',
    component: 'table',
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: '表格单元格',
    category: 'html',
    component: 'td',
    label: '合并列',
    description: '单元格可横跨的列数',
    property: 'colspan'
  },
  {
    name: '表格单元格',
    category: 'html',
    component: 'td',
    label: '合并行',
    description: '单元格可横跨的行数',
    property: 'rowspan'
  },
  {
    name: '表格单元格',
    category: 'html',
    component: 'td',
    label: '原生属性',
    description: '原生属性',
    property: 'attributes3'
  },
  {
    name: '表单',
    category: 'html',
    component: 'form',
    label: '名称',
    description: '表单的名称',
    property: 'name'
  },
  {
    name: '表单',
    category: 'html',
    component: 'form',
    label: '提交地址',
    description: '提交表单时向何处发送表单数据',
    property: 'action'
  },
  {
    name: '表单',
    category: 'html',
    component: 'form',
    label: 'HTTP方法',
    description: '用于发送 form-data 的 HTTP 方法',
    property: 'method'
  },
  {
    name: '表单标签',
    category: 'html',
    component: 'label',
    label: 'label绑定表单元素',
    description: 'label 绑定到哪个表单元素',
    property: 'for'
  },
  {
    name: '表单标签',
    category: 'html',
    component: 'label',
    label: 'label字段所属表单',
    description: 'label 字段所属的一个或多个表单',
    property: 'form'
  },
  {
    name: '按钮组',
    category: 'general',
    component: 'TinyButtonGroup',
    label: '数据',
    description: '配置按钮组数据',
    property: 'data'
  },
  {
    name: '按钮组',
    category: 'general',
    component: 'TinyButtonGroup',
    label: '大小',
    description: '组件大小',
    property: 'size'
  },
  {
    name: '按钮组',
    category: 'general',
    component: 'TinyButtonGroup',
    label: '朴素按钮',
    description: '是否是朴素按钮',
    property: 'plain'
  },
  {
    name: '按钮组',
    category: 'general',
    component: 'TinyButtonGroup',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: 'row',
    component: 'TinyRow',
    label: '布局',
    description: '选择布局方式',
    property: 'layout'
  },
  {
    name: 'row',
    component: 'TinyRow',
    label: '子项对齐方式',
    description: '子项的副轴对齐方向，可取值：top, middle, bottom',
    property: 'align'
  },
  {
    name: 'row',
    component: 'TinyRow',
    label: 'flex容器',
    description: '是否为flex容器',
    property: 'flex'
  },
  {
    name: 'row',
    component: 'TinyRow',
    label: '子项间隔',
    description: '子项的间隔的像素',
    property: 'gutter'
  },
  {
    name: '表单',
    component: 'TinyForm',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '表单',
    component: 'TinyForm',
    label: '标签宽度',
    description: '表单中标签占位宽度，默认为 80px',
    property: 'label-width'
  },
  {
    name: '表单',
    component: 'TinyForm',
    label: '行内布局',
    description: '行内布局模式，默认为 false',
    property: 'inline'
  },
  {
    name: '表单',
    component: 'TinyForm',
    label: '必填标识占位',
    description: '必填标识 * 是否占位',
    property: 'label-align'
  },
  {
    name: '表单',
    component: 'TinyForm',
    label: '标签后缀',
    description: '表单中标签后缀',
    property: 'label-suffix'
  },
  {
    name: '表单',
    component: 'TinyForm',
    label: '标签位置',
    description: '表单中标签的布局位置',
    property: 'label-position'
  },
  {
    name: '表单',
    component: 'TinyForm',
    label: '数据对象',
    description: '表单数据对象',
    property: 'model'
  },
  {
    name: '表单',
    component: 'TinyForm',
    label: '校验规则',
    description: '表单验证规则',
    property: 'rules'
  },
  {
    name: '表单项',
    component: 'TinyFormItem',
    label: '标签文本',
    description: '标签文本',
    property: 'label'
  },
  {
    name: '表单项',
    component: 'TinyFormItem',
    label: '校验字段',
    description: '表单域 model 字段，在使用 validate、resetFields 方法的情况下，该属性是必填的',
    property: 'prop'
  },
  {
    name: '表单项',
    component: 'TinyFormItem',
    label: '必填',
    description: '是否必填',
    property: 'required'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '栅格列格数',
    description: '当一行分为12格时，一列可占位多少格',
    property: 'span'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '栅格移动格数',
    description: '栅格左右移动格数（正数向右，负数向左）',
    property: 'move'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '排序编号',
    description: '排序编号（row中启用order生效）',
    property: 'no'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '间隔格数',
    description: '栅格左侧的间隔格数',
    property: 'offset'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '超小屏格数',
    description: '<768px 响应式栅格数',
    property: 'xs'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '小屏格数',
    description: '≥768px 响应式栅格数',
    property: 'sm'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '中屏格数',
    description: '≥992px 响应式栅格数',
    property: 'md'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '大屏格数',
    description: '≥1200px 响应式栅格数',
    property: 'lg'
  },
  {
    name: 'col',
    component: 'TinyCol',
    label: '超大屏格数',
    description: '≥1920px 响应式栅格数',
    property: 'xl'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '按钮文字',
    description: '按钮文字',
    property: 'text'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '大小',
    description: '按钮大小',
    property: 'size'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '禁用',
    description: '是否被禁用',
    property: 'disabled'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '类型',
    description: '设置不同的主题样式',
    property: 'type'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '圆角',
    description: '是否圆角按钮',
    property: 'round'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '朴素按钮',
    description: '是否为朴素按钮',
    property: 'plain'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '禁用时间',
    description: '设置禁用时间，防止重复提交，单位毫秒',
    property: 'reset-time'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '圆形按钮',
    description: '是否圆形按钮',
    property: 'circle'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '自动聚焦',
    description: '是否默认聚焦',
    property: 'autofocus'
  },
  {
    name: '按钮',
    component: 'TinyButton',
    label: '加载中样式',
    description: '是否展示位加载中样式',
    property: 'loading'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '绑定值',
    description: '双向绑定值',
    property: 'modelValue'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '类型',
    description: '设置input框的type属性',
    property: 'type'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '行数',
    description: "输入框行数，只对 type='textarea' 有效",
    property: 'rows'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '占位文本',
    description: '输入框占位文本',
    property: 'placeholder'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '清除按钮',
    description: '是否显示清除按钮',
    property: 'clearable'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '尺寸',
    description: '输入框尺寸。该属性的可选值为 medium / small / mini',
    property: 'size'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '最大输入长度',
    description: '设置 input 框的maxLength',
    property: 'maxlength'
  },
  {
    name: '输入框',
    component: 'TinyInput',
    label: '自动聚焦',
    description: '自动获取焦点',
    property: 'autofocus'
  },
  {
    name: '单选',
    component: 'TinyRadio',
    label: '文本内容',
    description: '单选框文本内容',
    property: 'text'
  },
  {
    name: '单选',
    component: 'TinyRadio',
    label: '选中值',
    description: 'radio 选中时的值',
    property: 'label'
  },
  {
    name: '单选',
    component: 'TinyRadio',
    label: '绑定值',
    description: '双向绑定的当前选中值',
    property: 'modelValue'
  },
  {
    name: '单选',
    component: 'TinyRadio',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '单选',
    component: 'TinyRadio',
    label: '显示边框',
    description: '是否显示边框',
    property: 'border'
  },
  {
    name: '单选',
    component: 'TinyRadio',
    label: '尺寸',
    description: '单选框的尺寸，仅在 border 为true时有效',
    property: 'size'
  },
  {
    name: '单选',
    component: 'TinyRadio',
    label: '原生name属性',
    description: '原生 name 属性',
    property: 'name'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '绑定值',
    description: '双向绑定的当前选中值',
    property: 'modelValue'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '占位文本',
    description: '输入框占位文本',
    property: 'placeholder'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '清除按钮',
    description: '是否显示清除按钮',
    property: 'clearable'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '下拉可搜索',
    description: '下拉面板是否可搜索',
    property: 'searchable'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '选项数据',
    description: '配置 Select 下拉数据项',
    property: 'options'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '多选',
    description: '是否允许输入框输入或选择多个项',
    property: 'multiple'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '最大可选值',
    description: '多选时用户最多可以选择的项目数，为 0 则不限制',
    property: 'multiple-limit'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '下拉框类名',
    description: '设置下拉框自定义的类名',
    property: 'popper-class'
  },
  {
    name: '下拉框',
    component: 'TinySelect',
    label: '多选展示',
    description: '多选时是否将选中值按文字的形式展示',
    property: 'collapse-tags'
  },
  {
    name: '开关',
    component: 'TinySwitch',
    label: '禁用',
    description: '是否被禁用',
    property: 'disabled'
  },
  {
    name: '开关',
    component: 'TinySwitch',
    label: '绑定值',
    description: '绑定默认值',
    property: 'modelValue'
  },
  {
    name: '开关',
    component: 'TinySwitch',
    label: '设置打开值',
    description: '设置打开时的值(Boolean / String / Number)',
    property: 'true-value'
  },
  {
    name: '开关',
    component: 'TinySwitch',
    label: '设置关闭值',
    description: '设置关闭时的值(Boolean / String / Number)',
    property: 'false-value'
  },
  {
    name: '开关',
    component: 'TinySwitch',
    label: '迷你尺寸',
    description: '是否显示为 mini 模式',
    property: 'mini'
  },
  {
    name: '搜索框',
    component: 'TinySearch',
    label: '默认值',
    description: '输入框内的默认搜索值',
    property: 'modelValue'
  },
  {
    name: '搜索框',
    component: 'TinySearch',
    label: '禁用',
    description: '是否被禁用',
    property: 'disabled'
  },
  {
    name: '搜索框',
    component: 'TinySearch',
    label: '占位文本',
    description: '输入框内的提示占位文本',
    property: 'placeholder'
  },
  {
    name: '搜索框',
    component: 'TinySearch',
    label: '清空按钮',
    description: '设置显示清空图标按钮',
    property: 'clearable'
  },
  {
    name: '搜索框',
    component: 'TinySearch',
    label: 'Enter键触发',
    description: '是否在按下键盘Enter键的时候触发search事件',
    property: 'isEnterSearch'
  },
  {
    name: '搜索框',
    component: 'TinySearch',
    label: '迷你尺寸',
    description: '迷你模式，配置为true时，搜索默认显示为一个带图标的圆形按钮，点击后展开',
    property: 'mini'
  },
  {
    name: '搜索框',
    component: 'TinySearch',
    label: '透明模式',
    description: '配置为true时，边框变为透明且收缩后半透明显示，一般用在带有背景的场景，默认 false',
    property: 'transparent'
  },
  {
    name: '复选框',
    component: 'TinyCheckbox',
    label: '绑定值',
    description: '双向绑定值',
    property: 'modelValue'
  },
  {
    name: '复选框',
    component: 'TinyCheckbox',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '复选框',
    component: 'TinyCheckbox',
    label: '勾选',
    description: '当前是否勾选',
    property: 'checked'
  },
  {
    name: '复选框',
    component: 'TinyCheckbox',
    label: '文本',
    description: '复选框的文本',
    property: 'text'
  },
  {
    name: '复选框',
    component: 'TinyCheckbox',
    label: '边框',
    description: '是否显示边框',
    property: 'border'
  },
  {
    name: '复选框',
    component: 'TinyCheckbox',
    label: '未选中的值',
    description: '没有选中时的值',
    property: 'false-label'
  },
  {
    name: '复选框',
    component: 'TinyCheckbox',
    label: '选择时的值',
    description: '选中时的值',
    property: 'true-label'
  },
  {
    name: '复选按钮',
    component: 'TinyCheckboxButton',
    label: '绑定值',
    description: '双向绑定的当前选中值',
    property: 'modelValue'
  },
  {
    name: '复选按钮',
    component: 'TinyCheckboxButton',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '复选按钮',
    component: 'TinyCheckboxButton',
    label: '勾选',
    description: '当前是否勾选',
    property: 'checked'
  },
  {
    name: '复选按钮',
    component: 'TinyCheckboxButton',
    label: '文本',
    description: '按钮文本',
    property: 'text'
  },
  {
    name: '复选按钮组',
    component: 'TinyCheckboxGroup',
    label: '绑定值',
    description: '双向绑定的当前选中值',
    property: 'modelValue'
  },
  {
    name: '复选按钮组',
    component: 'TinyCheckboxGroup',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '复选按钮组',
    component: 'TinyCheckboxGroup',
    label: '选项列表',
    description: 'checkbox组件列表',
    property: 'options'
  },
  {
    name: '复选按钮组',
    component: 'TinyCheckboxGroup',
    label: '类型',
    description: 'checkbox组件类型（button/checkbox），该属性的默认值为 checkbox,配合 options 属性一起使用',
    property: 'type'
  },
  {
    name: '对话框',
    component: 'TinyDialogBox',
    label: '标题',
    description: '弹出框标题',
    property: 'title'
  },
  {
    name: '对话框',
    component: 'TinyDialogBox',
    label: '显示与隐藏',
    description: '控制弹出框显示与关闭',
    property: 'visible'
  },
  {
    name: '对话框',
    component: 'TinyDialogBox',
    label: '宽度',
    description: '弹出框的宽度',
    property: 'width'
  },
  {
    name: '对话框',
    component: 'TinyDialogBox',
    label: '可拖拽',
    description: '是否开启弹窗的拖拽功能，默认值为 false 。',
    property: 'draggable'
  },
  {
    name: '对话框',
    component: 'TinyDialogBox',
    label: '居中',
    description: '弹出框的头部与底部内容会自动居中',
    property: 'center'
  },
  {
    name: '对话框',
    component: 'TinyDialogBox',
    label: '自定义类名',
    description: '自定义配置弹窗类名',
    property: 'dialog-class'
  },
  {
    name: '对话框',
    component: 'TinyDialogBox',
    label: '插入到Body',
    description: 'DialogBox 本身是否插入到 body 上，嵌套的 Dialog 必须指定该属性并赋值为 true',
    property: 'append-to-body'
  },
  {
    name: '对话框',
    component: 'TinyDialogBox',
    label: '关闭按钮',
    description: '是否显示关闭按钮，默认值为 true 。',
    property: 'show-close'
  },
  {
    name: '标签页',
    component: 'TinyTabs',
    label: '显示编辑图标',
    description: '是否显示标题后编辑 ICON',
    property: 'showEditIcon'
  },
  {
    name: '标签页',
    component: 'TinyTabs',
    label: '选项卡',
    description: 'tabs 选项卡',
    property: 'tabs'
  },
  {
    name: '标签页',
    component: 'TinyTabs',
    label: '绑定值',
    description: '绑定值，选中选项卡的 name',
    property: 'modelValue'
  },
  {
    name: '标签页',
    component: 'TinyTabs',
    label: '标签新增',
    description: '标签是否可增加',
    property: 'with-add'
  },
  {
    name: '标签页',
    component: 'TinyTabs',
    label: '可关闭',
    description: '标签是否可关闭',
    property: 'with-close'
  },
  {
    name: '标签页',
    component: 'TinyTabs',
    label: '标签页样式',
    description: '标签页样式',
    property: 'tab-style'
  },
  {
    name: 'tab页签',
    component: 'TinyTabItem',
    label: '唯一标识',
    description: '唯一标识',
    property: 'name'
  },
  {
    name: 'tab页签',
    component: 'TinyTabItem',
    label: '标题',
    description: '标题',
    property: 'title'
  },
  {
    name: '面包屑',
    component: 'TinyBreadcrumb',
    label: '分隔符',
    description: '自定义分隔符',
    property: 'separator'
  },
  {
    name: '面包屑',
    component: 'TinyBreadcrumb',
    label: '配置数据',
    description: '单独使用 Breadcrumb，通过 option 配置生成面包屑',
    property: 'options'
  },
  {
    name: '面包屑',
    component: 'TinyBreadcrumb',
    label: '键值',
    description: '指定面包屑的显示键值，结合 options 使用',
    property: 'textField'
  },
  {
    name: '面包屑项',
    component: 'TinyBreadcrumbItem',
    label: '路由跳转',
    description: '路由跳转对象，同 vue-router 的 to',
    property: 'to'
  },
  {
    name: '折叠面板',
    component: 'TinyCollapse',
    label: '当前激活面板',
    description: '双向绑定当前激活的面板',
    property: 'modelValue'
  },
  {
    name: '折叠面板项',
    component: 'TinyCollapseItem',
    label: '唯一标识符',
    description: '唯一标识符： String | Number',
    property: 'name'
  },
  {
    name: '折叠面板项',
    component: 'TinyCollapseItem',
    label: '标题',
    description: '面板标题',
    property: 'title'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '表格数据',
    description: '设置表格的数据',
    property: 'data'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '表格列',
    description: '表格列的配置信息',
    property: 'columns'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '服务端查询',
    description: '服务端数据查询方法',
    property: 'fetchData'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '分页配置',
    description: '分页配置，需结合fetchData使用',
    property: 'pager'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '调整列宽',
    description: '是否允许调整列宽',
    property: 'resizable'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '行数据主键',
    description: '自定义行数据唯一主键的字段名（行数据必须要有唯一主键，默认自动生成）',
    property: 'row-id'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '行复选框配置',
    description: '表格行数据复选框配置项',
    property: 'select-config'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '校验规则',
    description: '表格校验规则配置项',
    property: 'edit-rules'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '编辑配置项',
    description: '表格编辑配置项',
    property: 'edit-config'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '展开行配置',
    description: '展开行配置项',
    property: 'expand-config'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '可排序',
    description: '是否允许列数据排序。默认为 true 可排序',
    property: 'sortable'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '响应式监听',
    description: '表格属性设置 autoResize 属性开启响应式表格宽高的同时，将高度height设置为auto就可以自动跟随父容器高度。',
    property: 'auto-resize'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '边框',
    description: '是否带有纵向边框',
    property: 'border'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '行号连续',
    description: '设置行序号是否连续，开启分页时有效，该属性的默认值为 false',
    property: 'seq-serial'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '高亮当前行',
    description: '高亮当前行',
    property: 'highlight-current-row'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '移入行高亮',
    description: '鼠标移到行是否要高亮显示',
    property: 'highlight-hover-row'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '设置行高亮',
    description: '给行附加 className，也可以是函数 Function({seq, row, rowIndex, $rowIndex})',
    property: 'row-class-name'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '内容最大高度',
    description: '设置表格内容区域（不含表格头部，底部）的最大高度。',
    property: 'max-height'
  },
  {
    name: '表格',
    component: 'TinyGrid',
    label: '行合并',
    description: '设置行合并,该属性仅适用于普通表格，不可与 tree-config 同时使用',
    property: 'row-span'
  },
  {
    name: '分页',
    component: 'TinyPager',
    label: '当前页数',
    description: '当前页数，支持 .sync 修饰符',
    property: 'currentPage'
  },
  {
    name: '分页',
    component: 'TinyPager',
    label: '每页条数',
    description: '每页显示条目个数',
    property: 'pageSize'
  },
  {
    name: '分页',
    component: 'TinyPager',
    label: '可选每页条数',
    description: '设置可选择的每页显示条数',
    property: 'pageSizes'
  },
  {
    name: '分页',
    component: 'TinyPager',
    label: '总条数',
    description: '数据总条数',
    property: 'total'
  },
  {
    name: '分页',
    component: 'TinyPager',
    label: '布局',
    description: '组件布局，子组件名用逗号分隔',
    property: 'layout'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '绑定值',
    description: '双向绑定值',
    property: 'modelValue'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '占位文本',
    description: '输入框占位文本',
    property: 'placeholder'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '清除按钮',
    description: '是否显示清除按钮',
    property: 'show-clear-btn'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '宽度',
    description: '设置弹出面板的宽度（单位像素）',
    property: 'width'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '过滤条件',
    description: '当弹出面板配置的是表格时，设置弹出面板中的过滤条件',
    property: 'conditions'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '面板表格配置',
    description: '设置弹出面板中表格组件的配置信息',
    property: 'grid-op'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '分页配置',
    description: '设置弹出编辑框中分页配置',
    property: 'pager-op'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '多选',
    description: '设置弹出面板中的数据是否可多选',
    property: 'multi'
  },
  {
    name: '弹出编辑',
    component: 'TinyPopeditor',
    label: '启用分页',
    description: '当 popseletor 为 grid 时才能生效，配置为 true 后还需配置 pagerOp 属性',
    property: 'show-pager'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '多选',
    description: '设置接口是否可以多选',
    property: 'show-checkbox'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '数据源',
    description: '可配置静态数据源和动态数据源',
    property: 'data'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '唯一标识',
    description: '节点唯一标识属性名称',
    property: 'node-key'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '渲染函数',
    description: '树节点的内容区的渲染函数',
    property: 'render-content'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '触发NodeClick事件',
    description: '点击图标展开节点时是否触发 node-click 事件',
    property: 'icon-trigger-click-node'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '展开图标',
    description: '节点展开图标',
    property: 'expand-icon'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '收缩图标',
    description: '节点收缩的图标',
    property: 'shrink-icon'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '点击节点选中',
    description: '是否在点击节点的时候选中节点，默认值为 false，即只有在点击复选框时才会选中节点',
    property: 'check-on-click-node'
  },
  {
    name: '树',
    component: 'TinyTree',
    label: '筛选函数',
    description: '节点筛选函数',
    property: 'filter-node-method'
  },
  {
    name: '时间线',
    component: 'TinyTimeLine',
    label: '水平布局',
    description: '节点和文字横向布局',
    property: 'horizontal'
  },
  {
    name: '时间线',
    component: 'TinyTimeLine',
    label: '垂直布局',
    description: '节点和文字垂直布局',
    property: 'vertical'
  },
  {
    name: '时间线',
    component: 'TinyTimeLine',
    label: '选中值',
    description: '步骤条的选中步骤值',
    property: 'active'
  },
  {
    name: '时间线',
    component: 'TinyTimeLine',
    label: '步骤条数据',
    description: '时间线步骤条数据',
    property: 'data'
  },
  {
    name: '文字提示框',
    component: 'TinyTooltip',
    label: '提示位置',
    description: 'Tooltip 的出现位置',
    property: 'placement'
  },
  {
    name: '文字提示框',
    component: 'TinyTooltip',
    label: '内容',
    description: '显示的内容，也可以通过 slot#content 传入 DOM',
    property: 'content'
  },
  {
    name: '文字提示框',
    component: 'TinyTooltip',
    label: '渲染函数',
    description: '自定义渲染函数，返回需要渲染的节点内容',
    property: 'render-content'
  },
  {
    name: '文字提示框',
    component: 'TinyTooltip',
    label: '是否可见',
    description: '状态是否可见',
    property: 'modelValue'
  },
  {
    name: '文字提示框',
    component: 'TinyTooltip',
    label: '手动控制',
    description: '手动控制模式，设置为 true 后，mouseenter 和 mouseleave 事件将不会生效',
    property: 'manual'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '绑定值',
    description: '双向绑定，手动控制是否可见的状态值',
    property: 'modelValue'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '位置',
    description: '提示框位置',
    property: 'placement'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '触发方式',
    description: '触发方式，该属性的可选值为 click / focus / hover / manual，该属性的默认值为 click',
    property: 'trigger'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '自定义类',
    description: '为 popper 添加类名',
    property: 'popper-class'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '显示箭头',
    description: '是否显示 Tooltip 箭头',
    property: 'visible-arrow'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '添加到body上',
    description: 'Popover弹窗是否添加到body上',
    property: 'append-to-body'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '箭头的位置偏移',
    description: '箭头的位置偏移，该属性的默认值为 0',
    property: 'arrow-offset'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '延迟隐藏',
    description: '触发方式为 hover 时的隐藏延迟，单位为毫秒',
    property: 'close-delay'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '显示的内容',
    description: '显示的内容，也可以通过 slot 传入 DOM',
    property: 'content'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '禁用',
    description: 'Popover 是否可用',
    property: 'disabled'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '位置偏移量',
    description: '出现位置的偏移量',
    property: 'offset'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '显示延迟',
    description: '触发方式为 hover 时的显示延迟，单位为毫秒',
    property: 'open-delay'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '弹出层参数',
    description: 'popper.js 的参数',
    property: 'popper-options'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '标题',
    description: '提示内容标题',
    property: 'title'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '旋转中心点',
    description: '组件的旋转中心点,组件的旋转中心点',
    property: 'transform-origin'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '渐变动画',
    description: '该属性的默认值为 fade-in-linear',
    property: 'transition'
  },
  {
    name: '提示框',
    component: 'TinyPopover',
    label: '宽度',
    description: '宽度',
    property: 'width'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '绑定值',
    description: '双向绑定值',
    property: 'modelValue'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '类型',
    description: '设置日期框的type属性',
    property: 'type'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '占位文本',
    description: '输入框占位文本',
    property: 'placeholder'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '清除按钮',
    description: '是否显示清除按钮',
    property: 'clearable'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '只读',
    description: '是否只读',
    property: 'readonly'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '尺寸',
    description: '日期框尺寸。该属性的可选值为 medium / small / mini',
    property: 'size'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '输入最大长度',
    description: '设置 input 框的maxLength',
    property: 'maxlength'
  },
  {
    name: '日期选择',
    component: 'TinyDatePicker',
    label: '聚焦',
    description: '自动获取焦点',
    property: 'autofocus'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '绑定值',
    description: '双向绑定值',
    property: 'modelValue'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '占位文本',
    description: '输入框占位文本',
    property: 'placeholder'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '内容可清空',
    description: '是否内容可清空',
    property: 'allow-empty'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '禁用',
    description: '是否禁用',
    property: 'disabled'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '尺寸',
    description: '输入框尺寸。该属性的可选值为 medium / small / mini',
    property: 'size'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '加减按钮',
    description: '是否使用加减按钮',
    property: 'controls'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '加减按钮位置',
    description: '加减按钮位置',
    property: 'controls-position'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '精度',
    description: '数值精度',
    property: 'precision'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '步长',
    description: '步长',
    property: 'step'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '最大数值',
    description: '可输入的最大数值',
    property: 'max'
  },
  {
    name: '数字输入框',
    component: 'TinyNumeric',
    label: '最小数值',
    description: '可输入的最大数值',
    property: 'min'
  }
]
