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

import { ref, reactive, readonly, onMounted } from 'vue'
import { extend } from '@opentiny/vue-renderless/common/object'
import { remove } from '@opentiny/vue-renderless/common/array'
import {
  useBlock,
  useModal,
  useCanvas,
  useTranslate,
  useLayout,
  useNotify,
  useHistory,
  useMaterial,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { isVsCodeEnv } from '@opentiny/tiny-engine-common/js/environments'
import { getCanvasStatus } from '@opentiny/tiny-engine-common/js/canvas'
import html2canvas from 'html2canvas'

import {
  fetchBlockList,
  requestDeleteBlock,
  requestDeployBlock,
  requestUpdateBlock,
  requestCreateBlock,
  fetchBlockContent,
  fetchComponentsMap,
  fetchBlockContentByLabel,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup
} from './http'
import { constants, utils } from '@opentiny/tiny-engine-utils'
import { generateBlock } from '@opentiny/tiny-engine-common/js/vscodeGenerateFile'

const { HOST_TYPE } = constants

const STRING_SLOT = ['Slot', 'slot']

const currentCategory = ref('')

// 区块暴露属性和事件的类型
export const META_TYPES = {
  array: 'array',
  string: 'string',
  number: 'number',
  object: 'object',
  boolean: 'boolean',
  function: 'function'
}

// 类型转化成 select 组件 option 需要的结构 { label: string; value: string }[]
export const META_TYPES_OPTIONS = Object.entries(META_TYPES).map(([key, value]) => ({
  label: key,
  value: value
}))

// 组件的枚举
export const META_COMPONENTS_ENUM = {
  CodeConfigurator: 'CodeConfigurator',
  ArrayItemConfigurator: 'ArrayItemConfigurator',
  InputConfigurator: 'InputConfigurator',
  SelectConfigurator: 'SelectConfigurator',
  I18nConfigurator: 'I18nConfigurator',
  NumberConfigurator: 'NumberConfigurator',
  JsSlotConfigurator: 'JsSlotConfigurator',
  SwitchConfigurator: 'SwitchConfigurator'
}

// 每个值类型可选的编辑器类型
export const META_COMPONENT_LIST = {
  [META_TYPES.array]: [
    'CodeConfigurator',
    'ArrayItemConfigurator',
    'RelatedColumnsConfigurator',
    'RelatedEditorConfigurator'
  ],
  [META_TYPES.string]: ['InputConfigurator', 'SelectConfigurator', 'I18nConfigurator'],
  [META_TYPES.number]: ['NumberConfigurator'],
  [META_TYPES.object]: ['CodeConfigurator', 'JsSlotConfigurator'],
  [META_TYPES.boolean]: ['SwitchConfigurator'],
  [META_TYPES.function]: ['CodeConfigurator']
}

// 数组类型 item 的配置
export const DEFAULT_ARRAY_CONFIG = [
  {
    property: 'property',
    type: META_TYPES.string,
    defaultValue: '',
    label: {
      text: {
        zh_CN: '显示值'
      }
    },
    labelPosition: 'top',
    widget: {
      component: 'InputConfigurator',
      props: {
        modelValue: ''
      }
    }
  },
  {
    property: 'type',
    type: META_TYPES.string,
    defaultValue: 'String',
    label: {
      text: {
        zh_CN: '值类型'
      }
    },
    labelPosition: 'top',
    widget: {
      component: 'SelectConfigurator',
      props: {
        options: META_TYPES_OPTIONS,
        modelValue: ''
      }
    }
  },
  {
    property: 'component',
    type: META_TYPES.string,
    defaultValue: 'InputConfigurator',
    label: {
      text: {
        zh_CN: '设计器'
      }
    },
    labelPosition: 'top',
    widget: {
      component: 'SelectConfigurator',
      props: {
        options: META_COMPONENT_LIST[META_TYPES.string],
        modelValue: 'InputConfigurator'
      }
    }
  },
  {
    property: 'props',
    type: META_TYPES.object,
    defaultValue: '{}',
    label: {
      text: {
        zh_CN: '属性面板组件属性'
      }
    },
    labelPosition: 'top',
    widget: {
      component: 'CodeConfigurator',
      props: {
        modelValue: '{}',
        language: 'json'
      }
    }
  },
  {
    property: 'defaultValue',
    type: META_TYPES.string,
    defaultValue: '',
    label: {
      text: {
        zh_CN: '缺省值'
      }
    },
    labelPosition: 'top',
    widget: {
      component: 'CodeConfigurator',
      props: {
        modelValue: ''
      }
    }
  },
  {
    property: 'description',
    type: META_TYPES.string,
    defaultValue: '',
    label: {
      text: {
        zh_CN: '描述'
      }
    },
    labelPosition: 'top',
    widget: {
      component: 'InputConfigurator',
      props: {
        modelValue: ''
      }
    }
  }
]

// 区块暴露属性和事件各类型的默认值
export const META_DEFAULT_VALUE = {
  [META_TYPES.array]: [],
  [META_TYPES.string]: '',
  [META_TYPES.number]: 0,
  [META_TYPES.object]: {},
  [META_TYPES.boolean]: false,
  [META_TYPES.function]: 'function value() {}'
}

// 区块暴露属性和事件各类型对应的默认编辑器
export const META_COMPONENTS = {
  [META_TYPES.array]: 'CodeConfigurator',
  [META_TYPES.string]: 'InputConfigurator',
  [META_TYPES.number]: 'NumberConfigurator',
  [META_TYPES.object]: 'CodeConfigurator',
  [META_TYPES.boolean]: 'SwitchConfigurator',
  [META_TYPES.function]: 'CodeConfigurator'
}

// 区块默认的属性schema
const DEFAULT_PROPERTY = readonly({
  property: 'customProperty',
  type: META_TYPES.string,
  defaultValue: META_DEFAULT_VALUE[META_TYPES.string],
  label: {
    text: {
      zh_CN: ''
    }
  },
  cols: 12,
  rules: [],
  // 区块属性访问器
  accessor: {},
  hidden: false,
  required: true,
  readOnly: false,
  disabled: false,
  widget: {
    component: META_COMPONENTS[META_TYPES.string],
    props: {}
  }
})

// 区块默认的事件名称
const DEFAULT_EVENT_NAME = 'onCustomEvent'

// 区块默认的事件schema
const DEFAULT_EVENT = readonly({
  label: {
    zh_CN: ''
  },
  description: {
    zh_CN: ''
  }
})

// 这里存放的是区块设置面板的响应式数据
const state = reactive({
  block: null,
  categoryList: [],
  event: null,
  eventName: null,
  property: null,
  materialHistory: null,
  showPropertyConfigItem: false,
  arrayConfig: []
})

export const setCurrentCategory = (categoryId) => {
  currentCategory.value = categoryId
}

export const getMaterialHistory = () => state.materialHistory

export const setMaterialHistory = (value) => {
  state.materialHistory = value
}

export const getEditBlock = () => state.block

export const setEditBlock = (block) => {
  state.block = block
}

export const getEditEvent = () => state.event

export const setEditEvent = (event) => {
  state.event = event
}

export const getEditEventName = () => state.eventName

export const setEditEventName = (name) => {
  state.eventName = name
}

export const getEditProperty = () => state.property

export const setEditProperty = (property) => {
  state.property = property

  state.arrayConfig = (property?.properties?.[0]?.content || []).map(
    ({ property, type, defaultValue, label, widget: { props = {}, component = 'InputConfigurator' } = {} }) => ({
      property,
      type,
      defaultValue,
      description: label?.text?.zh_CN || '',
      props,
      component
    })
  )
}

export const getEditBlockPropertyList = () => state.block?.content?.schema?.properties?.[0]?.content

export const getEditBlockEvents = () => state.block?.content?.schema?.events

export const addBlockCustomProperty = () => {
  const defaultProperty = extend(true, {}, DEFAULT_PROPERTY)

  useBlock().addBlockProperty(defaultProperty, getEditBlock())

  return defaultProperty
}

export const addBlockCustomEvent = () => {
  const uid = utils.generateRandomLetters(4)
  const defaultEvent = extend(true, {}, DEFAULT_EVENT)

  const event = {
    name: `${DEFAULT_EVENT_NAME}${uid}`,
    event: defaultEvent
  }

  useBlock().addBlockEvent(event, getEditBlock())

  return event
}

export const delBlockEvent = (name) => {
  const events = getEditBlockEvents()

  if (name && events) {
    delete events[name]
    if (state.eventName === name) {
      state.event = null
    }
  }
}

export const renameBlockEventName = (name, oldName) => {
  const events = getEditBlockEvents()
  events[name] = events[oldName]
  setEditEventName(name)
  delete events[oldName]
}

const getAppId = () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

export const initEditBlock = (block) => {
  const currentBlock = useBlock().getCurrentBlock()
  // 如果当前点击的区块和画布中的区块是同一区块，则直接获取最新的区块数据
  if (block?.id && block.id === currentBlock?.id) {
    // 这里需要做一次合并，保证区块列表中的数据引用地址和getEditBlock获取的是一样的
    Object.assign(block, currentBlock)
  }

  setEditBlock(block || currentBlock)
  setEditProperty(null)
  setEditEvent(null)
}

export const getBlockBase64 = () => {
  const iframe = document.querySelector('#canvas')
  const subDocument = iframe.contentWindow.document
  const container = subDocument.querySelector('.design-page')

  return html2canvas(container, { useCORS: true })
    .then((canvas) => canvas.toDataURL('image/webp'))
    .catch((err) => {
      useNotify({
        type: 'error',
        title: '生成区块截图错误',
        message: JSON.stringify(err)
      })

      return ''
    })
}

export const updateBlockList = () => {
  let params = useBlock().shouldReplaceCategoryWithGroup()
    ? { groupId: currentCategory.value }
    : { categoryId: currentCategory.value }
  if (!currentCategory.value) {
    params = {}
  }
  const appId = getAppId()
  fetchBlockList({ appId, ...params }).then((data) => {
    const blockListDescByUpdateAt = data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    useBlock().setBlockList(blockListDescByUpdateAt)
  })
}

export const delBlock = (closePanel) => () => {
  const { getBlockList } = useBlock()
  const { message } = useModal()
  const block = getEditBlock()
  const blockId = block?.id

  if (blockId) {
    requestDeleteBlock(blockId)
      .then(() => {
        // data:后台删除成功返回的是被删除的数据
        remove(getBlockList(), block)
        message({ message: '删除区块成功！', status: 'success' })
        updateBlockList()
        useBlock().isRefresh.value = true
        closePanel()
      })
      .catch((error) => {
        message({ message: error.message, status: 'error' })
      })
  }
}

export const refreshBlockData = async (block = {}) => {
  if (block?.id) {
    const newBlock = await fetchBlockContent(block.id)

    if (newBlock) {
      if (newBlock?.public_scope_tenants?.length) {
        newBlock.public_scope_tenants = newBlock.public_scope_tenants.map((e) => e.id)
      }

      Object.assign(block, newBlock)

      // 与当前正在画布编辑态的区块相同，需要同步更新
      if (useBlock().getCurrentBlock()?.id === block.id) {
        useLayout().layoutState.pageStatus = getCanvasStatus(newBlock?.occupier)
        useHistory().addHistory(block.content)
        Object.assign(useBlock().getCurrentBlock(), newBlock)
      }
      // 与当前区块管理面板的区块相同，需要同步更新
      if (getEditBlock()?.id === block.id) {
        Object.assign(getEditBlock(), newBlock)
      }
    }
  }
}

export const findTree = (schema = {}, find) => {
  const children = schema.children

  find(schema)
  if (Array.isArray(children)) {
    children.forEach((child) => findTree(child, find))
  }
}

const findSlots = (schema) => {
  const configure = { slots: {}, slotsTips: '' }
  const slotsNameMap = {}

  findTree(schema, ({ componentName, props }) => {
    if (STRING_SLOT.includes(componentName)) {
      // 这里如果用户没有配置插槽名称，则默认给一个'default'
      props.name = props.name || 'default'
      const slotName = props.name
      const slotParams =
        typeof props.params === 'string' ? props.params.split(',') : props.params?.map((item) => item.name)

      if (slotsNameMap[slotName]) {
        slotsNameMap[slotName]++
      } else {
        slotsNameMap[slotName] = 1
      }
      // 注意：因为画布中webcomponents会把空格和换行也当作默认插槽，所以默认插槽统一取名default
      configure.slots[slotName] = { label: { zh_CN: slotName } }

      // 如果用户配置了作用域插槽的参数则需要在协议中添加
      if (slotParams) {
        configure.slots[slotName].params = slotParams
      }
    }
  })

  Object.entries(slotsNameMap).forEach(([key, value]) => {
    // 某一种插槽只能出现一次，包括默认插槽
    if (value > 1) {
      configure.slotsTips += `插槽【${key}】,出现了${value}次,`
    }
  })

  return configure
}

// 计算区块的 slot 信息，并配置到区块 schema 中
const configureSlots = (blockSchema = {}) => {
  // 区块不能设置成容器，可以拖入物料的容器是区块中的插槽
  const { slots, slotsTips } = findSlots(blockSchema)
  blockSchema.schema.slots = slots
  return slotsTips
}

const validBlockSlotsName = (block) => {
  const slotsTips = configureSlots(block.content)
  if (slotsTips) {
    useModal().confirm({
      title: '插槽名称不能重复!!!',
      message: `${slotsTips.slice(0, -1)}。`
    })
  }
  return !slotsTips
}

// 发布区块
export const publishBlock = (params) => {
  const block = params.block

  // 校验区块插槽名称
  if (block && validBlockSlotsName(block)) {
    requestDeployBlock(params)
      .then(() => {
        refreshBlockData(block)
        useNotify({ message: '区块发布成功!', type: 'success' })
        updateBlockList()
        useBlock().isRefresh.value = true
      })
      .catch((error) => {
        useModal().message({ message: error.message, status: 'error' })
      })
  }
}

const getCategories = () => {
  const appId = getAppId()
  const fetchData = useBlock().shouldReplaceCategoryWithGroup() ? fetchGroups : fetchCategories

  fetchData({ appId }).then((res) => {
    useBlock().setCategoryList(res)
  })
}

// 新建区块
const createBlock = (block = {}) => {
  const { message } = useModal()
  const created_app = getAppId()

  const { categories, ...rest } = block
  const extraParams = {}

  if (useBlock().shouldReplaceCategoryWithGroup()) {
    extraParams.groups = categories
  } else {
    extraParams.categories = categories
  }

  const params = { ...rest, ...extraParams, created_app }

  if (isVsCodeEnv) {
    const id = getMaterialHistory()?.id

    if (id) {
      const materialHistories = 'material_histories'
      params[materialHistories] = Array.isArray(id) ? id : [id]
    }
  }

  requestCreateBlock(params)
    .then((data) => {
      // 后台获取区块id后保存id信息
      block.id = data.id
      useTranslate().batchCreateI18n({ host: block.id, hostType: HOST_TYPE.Block })
      useCanvas().setSaved(true)
      // 新建区块成功后需要同步更新画布上的区块数据ctx上下文环境
      useBlock().initBlock(data, {}, true)
      message({ message: '新建区块成功！', status: 'success' })
      // 本地生成区块服务
      if (isVsCodeEnv) {
        generateBlock({ schema: data.content, blockPath: data.path })
      }
      // 更新区块分类数据，分类下区块不为空的不能删除
      getCategories()
    })
    .catch((error) => {
      message({ message: error.message, status: 'error' })
    })
}

// 点击Toolbar上的保存图标保存区块Schema
const updateBlock = (block = {}) => {
  const {
    id,
    content,
    screenshot,
    public_scope_tenants,
    public: publicType,
    tags,
    categories,
    description,
    label
  } = block
  const nameCn = 'name_cn'

  const extraParams = {}
  if (useBlock().shouldReplaceCategoryWithGroup()) {
    extraParams.groups = categories
  } else {
    extraParams.categories = categories
  }

  requestUpdateBlock(
    id,
    {
      [nameCn]: block[nameCn],
      content,
      screenshot,
      public_scope_tenants,
      public: publicType,
      tags,
      description,
      label,
      ...extraParams
    },
    {
      params: {
        appId: getAppId()
      }
    }
  )
    .then((data) => {
      useCanvas().setSaved(true)
      const currentId = useBlock().getCurrentBlock()?.id

      // 如果是当前正在编辑的区块，需要同步更新画布
      if (currentId === id) {
        useBlock().initBlock(data, {}, true)
      }

      // 弹出保存区块成功
      useModal().message({ message: '保存区块成功！', status: 'success' })
      // 本地生成区块服务
      if (isVsCodeEnv) {
        generateBlock({ schema: data.content, blockPath: data.path })
      }
      // 更新区块分类数据，分类下区块不为空的不能删除
      getCategories()
      useBlock().isRefresh.value = true
    })
    .catch((error) => {
      useModal().message({ message: error.message, status: 'error' })
    })
}

/**
 * 收集区块依赖的组件信息
 * @param {array} children 子区块
 * @param {object} deps 依赖的组件信息
 * @returns
 */
const generateBlockDeps = (children, deps = { scripts: [], styles: new Set() }) => {
  if (!Array.isArray(children)) {
    return
  }

  children.forEach((child) => {
    const component = useMaterial().getMaterial(child.componentName)

    if (!component) return

    const { npm, component: componentName } = component

    if (npm) {
      const { package: pkg, exportName, css, version, script } = npm
      const currentPkg = deps.scripts.find((item) => item.package === pkg)

      if (currentPkg) {
        currentPkg.components[componentName] = exportName
      } else {
        deps.scripts.push({
          package: pkg,
          version,
          script,
          css,
          components: {
            [componentName]: exportName
          }
        })
      }

      if (css) {
        deps.styles.add(css)
      }
    }

    // 递归查找子区块或子组件
    if (child.children) {
      generateBlockDeps(child.children, deps)
    }
  })

  return deps
}

export const saveBlock = async (block) => {
  if (block && validBlockSlotsName(block)) {
    const { scripts, styles } = generateBlockDeps(block.content.children)

    block.content.dependencies = { scripts, styles: [...styles] }

    const actionPromise = block.id ? updateBlock(block) : createBlock(block)
    await actionPromise
    updateBlockList()
  }
}

export const fetchMaterialId = () => {
  fetchComponentsMap(getAppId()).then((data) => {
    setMaterialHistory(data?.materialHistory)
  })
}

export const mountedHook = () => {
  onMounted(() => {
    updateBlockList()
    getCategories()

    if (isVsCodeEnv) {
      fetchMaterialId()
    }
  })
}

export const getBlockContentByLabel = (label) => {
  return fetchBlockContentByLabel(label)
}

export const getBlockById = async (id) => {
  if (id) {
    const blockId = await fetchBlockContent(id)
    return blockId
  }

  return undefined
}

export const createOrUpdateCategory = async ({ categoryId, ...params }, isEdit) => {
  const appId = getAppId()
  const replaceCategoryWithGroup = useBlock().shouldReplaceCategoryWithGroup()
  let requestFunc

  if (replaceCategoryWithGroup) {
    params.app = appId
    requestFunc = updateGroup
  } else {
    params.app = Number(appId)
    requestFunc = updateCategory
  }

  if (!isEdit) {
    // 替换成创建接口
    if (replaceCategoryWithGroup) {
      requestFunc = createGroup
    } else {
      requestFunc = createCategory
      params.category_id = categoryId
    }
  }

  const res = await requestFunc(params)

  if (res) {
    getCategories()
  }
}

export const delCategory = async (id) => {
  const deleteFn = useBlock().shouldReplaceCategoryWithGroup() ? deleteGroup : deleteCategory
  const res = await deleteFn(id)

  if (res) {
    getCategories()
    useNotify({
      type: 'success',
      message: '删除成功'
    })
  }
}

export const getConfigItemVisible = () => state.showPropertyConfigItem
export const setConfigItemVisible = (visible) => {
  state.showPropertyConfigItem = visible
}

// 获取真实 config item 配置 将数据与默认配置结合，得到渲染的配置
export const getItemConfig = (data = {}) => {
  const dataType = data?.type?.toLowerCase?.()

  return DEFAULT_ARRAY_CONFIG.map(({ property, widget, type, ...other }) => {
    const props = {
      ...widget.props,
      modelValue: data[property] ?? ''
    }

    if (property === 'component') {
      props.options =
        dataType === META_TYPES.array
          ? [{ label: META_COMPONENTS[META_TYPES.array], value: META_COMPONENTS[META_TYPES.array] }]
          : (META_COMPONENT_LIST[dataType] || []).map((item) => ({ label: item, value: item }))
    }

    return {
      property,
      type,
      ...other,
      widget: {
        ...widget,
        component: property === 'defaultValue' ? META_COMPONENTS[dataType] : widget.component,
        props
      }
    }
  })
}

export const getArrayConfig = () => state.arrayConfig
export const setArrayConfig = (value) => {
  state.arrayConfig = value
}

export const saveArrayConfig = () => {
  const property = getEditProperty()

  if (!property) {
    return
  }

  property.properties = [
    {
      label: {
        zh_CN: '默认分组'
      },
      content: state.arrayConfig.map?.(({ property, type, component, defaultValue, description, props }) => ({
        property,
        type,
        defaultValue,
        label: {
          text: {
            zh_CN: description
          }
        },
        widget: {
          component,
          props
        }
      }))
    }
  ]
}
