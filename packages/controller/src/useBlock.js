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

import { ref, reactive, readonly } from 'vue'
import { hyphenate } from '@vue/shared'
import { extend, copyArray } from '@opentiny/vue-renderless/common/object'
import { format } from '@opentiny/vue-renderless/common/date'
import { remove } from '@opentiny/vue-renderless/common/array'
import { constants } from '@opentiny/tiny-engine-utils'
import { getCanvasStatus } from '../js/canvas'
import { ast2String, parseExpression } from '../js/ast'
import { getCssObjectFromStyleStr } from '../js/css'
import useCanvas from './useCanvas'
import useTranslate from './useTranslate'
import useEditorInfo from './useEditorInfo'
import useBreadcrumb from './useBreadcrumb'
import useLayout from './useLayout'
import { getGlobalConfig } from './globalConfig'

const { SORT_TYPE, SCHEMA_DATA_TYPE, BLOCK_OPENNESS } = constants

const NODE_TYPE_PAGE = 'Page'
const nameCn = 'name_cn'
const DEFAULT_PROPERTIES = readonly([
  {
    label: {
      zh_CN: '基础信息'
    },
    description: {
      zh_CN: '基础信息'
    },
    collapse: {
      number: 6,
      text: {
        zh_CN: '显示更多'
      }
    },
    content: []
  }
])

const DEFAULT_BLOCK = readonly({
  componentName: 'Block',
  fileName: '',
  css: '',
  props: {},
  children: [],
  schema: {
    properties: DEFAULT_PROPERTIES,
    events: {}
  },
  state: {},
  methods: {},
  dataSource: {}
})

const blockState = reactive({
  list: [],
  current: null // 当前画布中正在渲染的区块数据
})

// 区块分组信息
const groupState = reactive({
  list: [],
  selected: {}
})

// 区块分类
const categoryState = reactive({
  list: []
})

const getBlockList = () => blockState.list

const setBlockList = (list) => {
  blockState.list = list
}

const addBlock = (block) => {
  const blockList = getBlockList()
  blockList.unshift(block)
}

const delBlock = (block) => {
  remove(getBlockList(), block)
}

// 获取当前画布中的区块信息
const getCurrentBlock = () => blockState.current

const setCurrentBlock = (block) => {
  blockState.current = block
}

const getGroupList = () => groupState.list

const setGroupList = (list) => {
  groupState.list = list
}

const getCategoryList = () => categoryState.list

const setCategoryList = (list) => {
  categoryState.list = list
}

const getSelectedGroup = () => groupState.selected

const setSelectedGroup = (selected) => {
  groupState.selected = selected
}

const copyCss = (css, classNameList) => {
  classNameList = Array.from(new Set(classNameList)).map((item) => '.' + item)
  let cssObject = getCssObjectFromStyleStr(css)
  let styleStr = ''

  Object.entries(cssObject).forEach(([key, value]) => {
    // 只要选择器包含目标类名，就复制
    if (classNameList.some((classNameItem) => key.includes(classNameItem))) {
      styleStr += `${key} {\n${value}\n}\n`
    }
  })

  return styleStr
}

const copySchema = (schema, contentList, methods) => {
  const content = schema?.properties?.[0]?.content || []
  let emitList = []
  let emitListCopies = {}
  Object.keys(methods).forEach((key) => {
    let item = JSON.stringify(methods[key].value).match(/emit..*?\)/g)

    if (item?.length) {
      emitList = [...emitList, ...item]
    }
  })

  emitList.forEach((e) => {
    let key = e.match(/'.*?'/g)[0].replace(/'/g, '')

    key = `on${key[0].toLocaleUpperCase() + key.slice(1, key.length)}`
    if (schema?.events[key]) {
      emitListCopies[key] = schema?.events[key]
    }
  })
  const schemaCopies = {
    properties: [
      {
        ...extend(true, {}, DEFAULT_PROPERTIES[0]),
        content: content.filter((item) => contentList.includes(item.property))
      }
    ],
    events: emitListCopies || {}
  }

  return schemaCopies
}

const copyMethods = (schema) => {
  const methodsListCopies = {}

  // 因为methods方法里面大部分是用户的业务代码（无法复用）,所以只需要拷贝一个空方法即可
  Object.entries(schema).forEach(([key, value]) => {
    const ast = parseExpression(value.value)

    // 清空函数体
    if (ast.body?.body) {
      ast.body.body = []
    }
    methodsListCopies[key] = {
      type: 'JSFunction',
      value: ast2String(ast)
    }
  })

  return methodsListCopies
}

const copyState = (stateObj = {}, methodsObj = {}) => {
  let stateCopies = {}
  const stateKey = Object.keys(stateObj).map((e) => `state.${e} `)

  stateKey.forEach((e) => {
    Object.keys(methodsObj).forEach((key) => {
      if (methodsObj[key].value.indexOf(e) !== -1) {
        const key = e.replace('state.', '').replace(' ', '')
        stateCopies[key] = stateObj[key]
      }
    })
  })

  return stateCopies
}

const parsePropToData = (data, { prop, langs, state, methods }) => {
  if (prop.type === SCHEMA_DATA_TYPE.I18n) {
    data.langs[prop.key] = langs[prop.key]
  } else if (prop.type === SCHEMA_DATA_TYPE.JSExpression) {
    if (/\.state\./.test(prop.value)) {
      const key = prop.value.replace('this.state.', '')
      data.state[key] = state[key]
    } else if (/\.props\./.test(prop.value)) {
      const key = prop.value.replace('this.props.', '')
      data.contentList.push(key)
    } else {
      const key = prop.value.replace('this.', '').replace(/\(.*?\)/, '')
      data.methods[key] = methods[key]
    }
  }
}

const filterDataFn =
  (parseChildProps) =>
  ({ children = [], langs = {}, methods = {}, state = {} }) => {
    const data = {
      langs: {},
      methods: {},
      state: {},
      classNameList: [],
      contentList: []
    }

    if (Array.isArray(children)) {
      children.forEach((child) => {
        parseChildProps(data, { child, langs, state, methods })
      })
    }

    return data
  }

const parseChildProps = (data, { child, langs, state, methods }) => {
  if (child.props) {
    Object.entries(child.props).forEach(([propKey, prop]) => {
      if (typeof prop === 'object') {
        parsePropToData(data, { prop, langs, state, methods })
      } else {
        if (propKey === 'className' && prop) {
          data.classNameList.push(...prop.split(' ').filter((item) => item))
        }
      }
    })
  }

  if (Array.isArray(child.children)) {
    const filterData = filterDataFn(parseChildProps)
    const childData = filterData({ children: child.children, langs, methods, state })
    Object.assign(data.langs, childData.langs)
    Object.assign(data.methods, childData.methods)
    Object.assign(data.state, childData.state)
    data.classNameList = [...data.classNameList, ...childData.classNameList]
    data.contentList = [...data.contentList, ...childData.contentList]
  }
}

const getBlockPageSchema = (block) => {
  const content = block?.content || {}
  content.componentName = content.componentName || content.blockName

  return content
}

const initBlock = async (block = {}, _langs = {}, isEdit) => {
  const { resetBlockCanvasState, setSaved } = useCanvas()
  const { setBreadcrumbBlock } = useBreadcrumb()

  // 把区块的schema传递给画布
  await resetBlockCanvasState({ pageSchema: getBlockPageSchema(block) })
  // 这一步操作很重要，让区块管理面板和画布共同维护同一份区块schema
  block.content = useCanvas().canvasApi.value?.getSchema()

  setCurrentBlock(block)
  setBreadcrumbBlock([block[nameCn] || block.label], block.histories)

  // 如果是点击区块管理列表进来的则不需要执行以下操作
  if (!isEdit) {
    // 非编辑状态即为新增，新增默认锁定画布
    block.occupier = useEditorInfo().userInfo
    useLayout().layoutState.pageStatus = getCanvasStatus(block.occupier)
    addBlock(block)
    setSaved(false)
  }
}

const createBlock = ({ name_cn, label, path, categories }) => {
  const { pageState } = useCanvas()
  const schema = extend(true, {}, pageState.currentSchema)
  // 选中 body 节点创建区块时需传递子节点数据
  const children = schema.componentName === NODE_TYPE_PAGE ? schema.children : [schema]

  // 过滤只有新区块内使用到的数据
  const { getLangs } = useTranslate()
  const filterData = filterDataFn(parseChildProps)
  const { langs, methods, state, classNameList, contentList } = extend(
    true,
    {},
    filterData({
      children,
      langs: getLangs(),
      methods: pageState.pageSchema.methods,
      state: pageState.pageSchema.state
    })
  )

  const css = copyCss(pageState.pageSchema.css, classNameList)
  const methodsCopies = copyMethods(methods)
  Object.assign(methods, methodsCopies)

  const schemaCopies = copySchema(pageState.pageSchema.schema, contentList, methods)
  const stateCopies = copyState(pageState.pageSchema.state, methods)
  Object.assign(state, stateCopies)

  const block = {
    path,
    [nameCn]: name_cn,
    label,
    histories: [],
    categories,
    public: BLOCK_OPENNESS.Open,
    framework: getGlobalConfig()?.dslMode,
    content: {
      ...extend(true, {}, DEFAULT_BLOCK),
      fileName: label,
      css,
      methods,
      state,
      children,
      schema: schemaCopies
    }
  }

  initBlock(block, langs)
}

const createEmptyBlock = ({ name_cn, label, path, categories }) => {
  const block = {
    path,
    [nameCn]: name_cn,
    label,
    categories,
    public: BLOCK_OPENNESS.Open,
    framework: getGlobalConfig()?.dslMode,
    content: {
      ...extend(true, {}, DEFAULT_BLOCK),
      fileName: label
    }
  }

  initBlock(block)
}

const setComponentLinkedValue = ({ propertyName, value }) => {
  const { schema } = useCanvas().canvasApi.value?.getCurrent() || {}

  if (!propertyName || !schema) {
    return
  }

  schema.props = schema.props || {}
  schema.props[propertyName] = value
}

const getBlockI18n = (block) => block?.content?.i18n || {}

const getBlockProperties = (block) => block?.content?.schema?.properties?.[0]?.content || []

const addBlockProperty = (property, block) => {
  if (!block) {
    return
  }

  if (!block.content) {
    block.content = {}
  }

  if (!block.content.schema) {
    block.content.schema = {}
  }

  if (!block.content.schema.properties) {
    block.content.schema.properties = copyArray(DEFAULT_PROPERTIES)
  }

  block.content.schema.properties[0].content.push(property)

  if (property.linked) {
    setComponentLinkedValue({
      propertyName: property.linked.property,
      value: {
        type: SCHEMA_DATA_TYPE.JSExpression,
        value: `this.props.${property.property}`
      }
    })
  }
}

const editBlockProperty = (property, data) => {
  if (property.linked) {
    const value = {
      type: SCHEMA_DATA_TYPE.JSExpression,
      value: `this.props.${property.property}`
    }
    setComponentLinkedValue({
      propertyName: data?.property,
      value
    })
    data.widget.props.modelValue = value
  }
}

const removePropertyLink = ({ componentProperty }) => {
  const linked = componentProperty.linked
  componentProperty.linked = null
  const properties = getBlockProperties(getCurrentBlock())

  properties.forEach((property) => {
    if (property.linked && property.property === linked.blockProperty) {
      if (componentProperty.widget?.props?.modelValue) {
        componentProperty.widget.props.modelValue = property.defaultValue
      }

      setComponentLinkedValue({
        propertyName: property.linked.property,
        value: property.defaultValue
      })

      property.linked = null
    }
  })
}

const getBlockEvents = (block = {}) => block?.content?.schema?.events || {}

const addBlockEvent = ({ name, event }, block) => {
  if (!block) {
    return
  }

  if (!block.content) {
    block.content = {}
  }

  if (!block.content.schema) {
    block.content.schema = {}
  }

  if (!block.content.schema.events) {
    block.content.schema.events = {}
  }

  block.content.schema.events[name] = event
}

const removeEventLink = (linkedEventName) => {
  const events = getBlockEvents(getCurrentBlock())

  Object.entries(events).forEach(([name, event]) => {
    if (linkedEventName === name) {
      event.linked = null
    }
  })
}

const appendEventEmit = ({ eventName, functionName } = {}) => {
  if (!eventName || !functionName) {
    return
  }

  const { PLUGIN_NAME, getPluginApi } = useLayout()
  const getMethods = getPluginApi(PLUGIN_NAME.PageController)?.getMethods

  if (getMethods && typeof getMethods === 'function') {
    const method = getMethods()?.[functionName]

    if (method?.type === SCHEMA_DATA_TYPE.JSFunction) {
      const ast = parseExpression(method.value)
      const params = ast.params.map((param) => param.name)
      const emitContent = `this.emit('${hyphenate(eventName.replace(/^on/i, ''))}', ${params.join(',')})`

      // 如果方法里面已经有了相同的emit语句就不添加了
      if (!method?.value?.includes(emitContent)) {
        ast.body.body.push(parseExpression(emitContent))
      }
      method.value = ast2String(ast)
    }
  }
}

// 区块消费侧

const DEFAULT_GROUPS = [
  {
    groupId: 'all',
    groupName: '所有分组'
  },
  {
    groupId: 'default',
    groupName: '设计器默认区块分组'
  }
]

// 区块默认分组id
const DEFAULT_GROUP_ID = DEFAULT_GROUPS[1].groupId

// 区块默认分组名称
const DEFAULT_GROUP_NAME = DEFAULT_GROUPS[1].groupName

// 当前选中的分组
const selectedGroup = ref({ ...DEFAULT_GROUPS[0] })

// 当前选中的区块，用于查看区块详情、区块历史记录
const selectedBlock = ref('')

// 已选择的区块数组，用于在当前分组里添加区块
const selectedBlockArray = ref([])

// 是否刷新区块列表，在当前分组里添加/删除区块后通知刷新区块列表
const isRefresh = ref(false)

// 切换分组时调用
const groupChange = (group) => {
  if (!group) return

  // 需要改变selectedGroup的引用地址才能触发tiny-select组件的watch事件
  selectedGroup.value = {
    groupId: group.groupId || group.id,
    groupName: group.groupName || group.name
  }
}

// 添加设计器默认区块分组
const addDefaultGroup = (groups) => {
  const result = DEFAULT_GROUPS.map((group) => ({
    label: group.groupName,
    value: group
  }))

  groups.forEach((item) => {
    result.push({
      label: item.name,
      value: {
        groupId: item.id,
        groupName: item.name
      }
    })
  })

  setGroupList(groups)

  return result
}

// 是否是设计器默认区块分组
const isDefaultGroupId = (groupId) => groupId === DEFAULT_GROUP_ID

const isAllGroupId = (groupId) => groupId === DEFAULT_GROUPS[0].groupId

// 获取今天的开始时间
const getCurrentDate = () => new Date().setHours(0, 0, 0, 0)

// 获取本周的开始时间
const getCurrentWeek = (date) => {
  const { nowDayOfWeek, nowDay, nowMonth, nowYear } = date
  const weekStartDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek + 1)

  return weekStartDate.setHours(0, 0, 0, 0)
}

// 获取本月的开始时间
const getCurrentMonth = (date) => {
  const { nowMonth, nowYear } = date
  const monthStartDate = new Date(nowYear, nowMonth, 1)

  return monthStartDate.setHours(0, 0, 0, 0)
}

// 获取上月的开始时间
const getLastMonth = (date) => {
  const { nowYear, lastMonth } = date
  const lastMonthStartDate = new Date(nowYear, lastMonth, 1)

  return lastMonthStartDate.setHours(0, 0, 0, 0)
}

// 判断时间戳属于今天/本周/本月/上月/更久以前
const getDateFromNow = (timeStamp) => {
  // 当前日期
  const now = new Date()
  const nowDay = now.getDate()
  const nowMonth = now.getMonth()
  const nowYear = now.getFullYear()

  // 今天是本周的第几天
  const nowDayOfWeek = now.getDay() || 7

  // 上月日期
  const lastMonthDate = new Date()
  lastMonthDate.setDate(1)
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
  const lastMonth = lastMonthDate.getMonth()

  const date = { nowDayOfWeek, nowDay, nowMonth, nowYear, lastMonth }

  // 存在currentDateStart与currentWeekStart相同的情况，故不可以用currentDateStart作key
  const dateMap = new Map([
    ['今天', getCurrentDate],
    ['本周', () => getCurrentWeek(date)],
    ['本月', () => getCurrentMonth(date)],
    ['上月', () => getLastMonth(date)],
    ['更久以前', () => '']
  ])

  for (let [key, value] of dateMap) {
    if (timeStamp >= value()) {
      return key
    }
  }

  return undefined
}

// 将历史记录分组
const splitBackupGroups = (data) => {
  const backupList = {}

  if (!data || !data.length) return backupList

  data.sort((backup1, backup2) => new Date(backup2.updated_at) - new Date(backup1.updated_at))
  data.forEach((item) => {
    const updateTime = item.updated_at && new Date(item.updated_at)
    const title = getDateFromNow(updateTime?.getTime()) || ''
    backupList[title] = backupList[title] || []
    backupList[title].push({
      backupTitle: item.message,
      backupTime: format(updateTime),
      id: item.id
    })
  })

  return backupList
}

const sortTypeHandlerMap = {
  [SORT_TYPE.timeAsc]: (blockList) => {
    blockList.sort((block1, block2) => new Date(block1.updated_at) - new Date(block2.updated_at))
  },
  [SORT_TYPE.timeDesc]: (blockList) => {
    blockList.sort((block1, block2) => new Date(block2.updated_at) - new Date(block1.updated_at))
  },
  [SORT_TYPE.alphabetDesc]: (blockList) => {
    // name_cn 包含中文，需要用 localeCompare
    blockList.sort((block1, block2) => (block2.name_cn || block2.label).localeCompare(block1.name_cn || block1.label))
  },
  [SORT_TYPE.alphabetAsc]: (blockList) => {
    // name_cn 包含中文，需要用 localeCompare
    blockList.sort((block1, block2) => (block1.name_cn || block1.label).localeCompare(block2.name_cn || block2.label))
  }
}

// 排序
const sort = (blockList, type) => {
  if (blockList.length === 0) return blockList

  if (sortTypeHandlerMap[type]) {
    sortTypeHandlerMap[type](blockList)
  } else {
    // 默认按照时间倒序进行排序
    sortTypeHandlerMap[SORT_TYPE.timeDesc](blockList)
  }

  return blockList
}

// 在可选区块列表里选择区块
const check = (blockList, block) => {
  const index = blockList.indexOf(block)

  blockList.splice(index, 1)
  selectedBlockArray.value.push(block)

  return blockList
}

// 取消选择区块
const cancelCheck = (blockList, block) => {
  const index = selectedBlockArray.value.indexOf(block)

  selectedBlockArray.value.splice(index, 1)
  blockList.push(block)

  return blockList
}

const getBlockAssetsByVersion = (block, version) => {
  let assets = block.assets

  if (version) {
    const replaceUri = (uri) => uri.replace(/@\d{1,3}(\.\d{1,3}){0,2}\//, `@${version}/`)

    assets = {
      ...block.assets,
      scripts: block.assets.scripts.map(replaceUri),
      styles: block.assets.styles.map(replaceUri)
    }
  }

  return assets
}

export default function () {
  return {
    NODE_TYPE_PAGE,
    DEFAULT_GROUP_ID,
    DEFAULT_GROUP_NAME,
    selectedGroup,
    selectedBlock,
    selectedBlockArray,
    isRefresh,
    addBlock,
    delBlock,
    createBlock,
    getBlockAssetsByVersion,
    createEmptyBlock,
    groupChange,
    addDefaultGroup,
    isDefaultGroupId,
    isAllGroupId,
    splitBackupGroups,
    sort,
    check,
    cancelCheck,
    getBlockList,
    setBlockList,
    getBlockI18n,
    getGroupList,
    setGroupList,
    getCategoryList,
    setCategoryList,
    addBlockEvent,
    getBlockEvents,
    appendEventEmit,
    getCurrentBlock,
    initBlock,
    setCurrentBlock,
    removeEventLink,
    getSelectedGroup,
    setSelectedGroup,
    addBlockProperty,
    editBlockProperty,
    removePropertyLink,
    getBlockProperties,
    getBlockPageSchema,
    getDateFromNow
  }
}
