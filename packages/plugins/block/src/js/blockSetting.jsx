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

import { reactive, readonly, onMounted } from 'vue'
import { extend } from '@opentiny/vue-renderless/common/object'
import { remove } from '@opentiny/vue-renderless/common/array'
import {
  useBlock,
  useModal,
  useCanvas,
  useTranslate,
  useApp,
  useLayout,
  useNotify
} from '@opentiny/tiny-engine-controller'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import { getCanvasStatus } from '@opentiny/tiny-engine-controller/js/canvas'
import { useHistory, useResource } from '@opentiny/tiny-engine-controller'
import html2canvas from 'html2canvas'

import {
  fetchBlockList,
  requestDeleteBlock,
  requestDeployBlock,
  fetchDeployProgress,
  requestUpdateBlock,
  requestCreateBlock,
  fetchBlockContent,
  fetchComponentsMap,
  fetchBlockContentByLabel,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from './http'
import { constants, utils } from '@opentiny/tiny-engine-utils'
import { generateBlock } from '@opentiny/tiny-engine-controller/js/vscodeGenerateFile'

const { HOST_TYPE } = constants
const { getBlockList, setBlockList, setCategoryList, getCurrentBlock, addBlockEvent, addBlockProperty } = useBlock()
const { batchCreateI18n } = useTranslate()
const { message, confirm } = useModal()
const { setSaved } = useCanvas()
const { getMaterial } = useResource()

const STRING_SLOT = ['Slot', 'slot']

// 轮询查询发布进度，目前设置为3s，后续可根据实际业务时间调整
const INTERVAL_PROGRESS = 3000

// 区块发布的状态
const DEPLOY_STATUS = readonly({
  Init: 0,
  Running: 1, // 发布中
  Stopped: 2, // 发布失败
  Finished: 3 // 发布成功
})

export const DEPLOY_TIPS = {
  1: '正在发布中',
  2: '发布失败，请重新发布',
  3: '发布完成'
}

const PROGRESS = readonly({
  Start: 0,
  End: 100
})

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
  MetaCodeEditor: 'MetaCodeEditor',
  MetaArrayItem: 'MetaArrayItem',
  MetaInput: 'MetaInput',
  MetaSelect: 'MetaSelect',
  MetaBindI18n: 'MetaBindI18n',
  MetaNumber: 'MetaNumber',
  MetaJsSlot: 'MetaJsSlot',
  MetaSwitch: 'MetaSwitch'
}

// 每个值类型可选的编辑器类型
export const META_COMPONENT_LIST = {
  [META_TYPES.array]: ['MetaCodeEditor', 'MetaArrayItem', 'MetaRelatedColumns', 'MetaRelatedEditor'],
  [META_TYPES.string]: ['MetaInput', 'MetaSelect', 'MetaBindI18n'],
  [META_TYPES.number]: ['MetaNumber'],
  [META_TYPES.object]: ['MetaCodeEditor', 'MetaJsSlot'],
  [META_TYPES.boolean]: ['MetaSwitch'],
  [META_TYPES.function]: ['MetaCodeEditor']
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
      component: 'MetaInput',
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
      component: 'MetaSelect',
      props: {
        options: META_TYPES_OPTIONS,
        modelValue: ''
      }
    }
  },
  {
    property: 'component',
    type: META_TYPES.string,
    defaultValue: 'MetaInput',
    label: {
      text: {
        zh_CN: '设计器'
      }
    },
    labelPosition: 'top',
    widget: {
      component: 'MetaSelect',
      props: {
        options: META_COMPONENT_LIST[META_TYPES.string],
        modelValue: 'MetaInput'
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
      component: 'MetaCodeEditor',
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
      component: 'MetaCodeEditor',
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
      component: 'MetaInput',
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
  [META_TYPES.array]: 'MetaCodeEditor',
  [META_TYPES.string]: 'MetaInput',
  [META_TYPES.number]: 'MetaNumber',
  [META_TYPES.object]: 'MetaCodeEditor',
  [META_TYPES.boolean]: 'MetaSwitch',
  [META_TYPES.function]: 'MetaCodeEditor'
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
    ({ property, type, defaultValue, label, widget: { props = {}, component = 'MetaInput' } = {} }) => ({
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

  addBlockProperty(defaultProperty, getEditBlock())

  return defaultProperty
}

export const addBlockCustomEvent = () => {
  const uid = utils.generateRandomLetters(4)
  const defaultEvent = extend(true, {}, DEFAULT_EVENT)

  const event = {
    name: `${DEFAULT_EVENT_NAME}${uid}`,
    event: defaultEvent
  }

  addBlockEvent(event, getEditBlock())

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

export const initEditBlock = (block = getCurrentBlock()) => {
  // 如果当前点击的区块和画布中的区块是同一区块，则直接获取最新的区块数据
  if (block?.id && block?.id === getCurrentBlock()?.id) {
    const currentBlock = getCurrentBlock()

    // 这里需要做一次合并，保证区块列表中的数据引用地址和getEditBlock获取的是一样的
    Object.assign(block, currentBlock)
  }

  setEditBlock(block)
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

export const delBlock = (closePanel) => () => {
  const block = getEditBlock()
  const blockId = block?.id

  if (blockId) {
    requestDeleteBlock(blockId)
      .then(() => {
        // data:后台删除成功返回的是被删除的数据
        remove(getBlockList(), block)
        message({ message: '删除区块成功！', status: 'success' })
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
      if (newBlock.public_scope_tenants.length) {
        newBlock.public_scope_tenants = newBlock.public_scope_tenants.map((e) => e.id)
      }
      Object.assign(block, newBlock)
      useLayout().layoutState.pageStatus = getCanvasStatus(newBlock?.occupier)

      useHistory().addHistory(block.content)
    }
  }
}

const setDeployFailed = (block) => {
  block.isAnimation = true
  block.isShowProgress = false
  block.publishProgress = PROGRESS.Start
  block.deployStatus = DEPLOY_STATUS.Stopped
}

const setDeployFinished = (block) => {
  block.isAnimation = true
  block.isShowProgress = false
  block.publishProgress = PROGRESS.Finished
  block.deployStatus = DEPLOY_STATUS.Finished
  refreshBlockData(block)
}

const setDeployStarted = (block) => {
  block.isAnimation = false
  block.isShowProgress = true
  block.publishProgress = PROGRESS.Start
  block.deployStatus = DEPLOY_STATUS.Running
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

export const getDeployProgress = (taskId, block) => {
  fetchDeployProgress(taskId).then((data) => {
    block.deployStatus = data.taskStatus
    block.publishProgress = data.progress_percent
    block.taskResult = data.taskResult

    if (block.publishProgress === PROGRESS.End) {
      block.deployStatus = DEPLOY_STATUS.Finished
    }

    if (block.deployStatus === DEPLOY_STATUS.Running || block.deployStatus === DEPLOY_STATUS.Init) {
      setTimeout(() => {
        getDeployProgress(taskId, block)
      }, INTERVAL_PROGRESS)
    } else if (block.deployStatus === DEPLOY_STATUS.Stopped) {
      message({
        title: '异常提示',
        status: 'error',
        message: {
          render: () => <span style="max-height:276px;overflow:auto;">{`区块发布失败: ${block.taskResult}`}</span>
        },
        width: '550'
      })
      setDeployFailed(block)
    } else {
      setDeployFinished(block)
      useNotify({ message: '区块发布成功!', type: 'success' })
    }
  })
}

const validBlockSlotsName = (block) => {
  const slotsTips = configureSlots(block.content)
  if (slotsTips) {
    confirm({
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
    // 查询发布进度之前，先将动画状态初始化
    setDeployStarted(block)

    requestDeployBlock(params)
      .then((data) => {
        getDeployProgress(data.id, block)
      })
      .catch((error) => {
        message({ message: error.message, status: 'error' })
        setDeployFailed(block)
      })
  }
}

const getCategories = () => {
  const appId = useApp().appInfoState.selectedId
  fetchCategories({ appId }).then((res) => {
    setCategoryList(res)
  })
}

// 新建区块
const createBlock = (block = {}) => {
  const { appInfoState } = useApp()
  const { selectedId: created_app } = appInfoState
  const params = { ...block, created_app }

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
      batchCreateI18n({ host: block.id, hostType: HOST_TYPE.Block })
      setSaved(true)
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
  requestUpdateBlock(
    id,
    {
      [nameCn]: block[nameCn],
      content,
      screenshot,
      public_scope_tenants,
      public: publicType,
      tags,
      categories: categories.map((category) => category.id),
      description,
      label
    },
    {
      params: {
        appId: useApp().appInfoState.selectedId
      }
    }
  )
    .then((data) => {
      setSaved(true)
      useBlock().initBlock(data, {}, true)
      // 弹出保存区块成功
      message({ message: '保存区块成功！', status: 'success' })
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

/**
 * 收集区块依赖的组件信息
 * @param {array} children 子区块
 * @param {object} deps 依赖的组件信息
 * @returns
 */
const generateBlockDeps = (children, deps = { scripts: [], styles: new Set() }) => {
  children.forEach((child) => {
    const component = getMaterial(child.componentName)

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
  }
}

export const updateBlockList = (params) => {
  const appId = useApp().appInfoState.selectedId
  fetchBlockList({ appId, ...params }).then((data) => {
    const blockListDescByUpdateAt = data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    setBlockList(blockListDescByUpdateAt)
  })
}

export const fetchMaterialId = () => {
  const { appInfoState } = useApp()

  fetchComponentsMap(appInfoState.selectedId).then((data) => {
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
  const appId = useApp().appInfoState.selectedId
  params.app = Number(appId)
  let requestFunc = updateCategory

  if (!isEdit) {
    params.category_id = categoryId
    requestFunc = createCategory
  }

  const res = await requestFunc(params)

  if (res) {
    getCategories()
  }
}

export const delCategory = async (id) => {
  const res = await deleteCategory(id)

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
