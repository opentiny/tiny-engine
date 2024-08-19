import { reactive, ref } from 'vue'

const defaultTemplateState = {
  currentVm: null,
  currentSchema: null,
  currentType: null,
  pageSchema: null,
  properties: null,
  dataSource: null,
  dataSourceMap: null,
  isSaved: true,
  isLock: false,
  isBlock: false,
  nodesStatus: {},
  loading: false
}

const defaultTemplateSchema = {
  componentName: 'Template',
  fileName: '',
  css: '',
  props: {},
  lifeCycles: {},
  children: [],
  dataSource: {
    list: []
  },
  methods: {},
  bridge: {
    imports: []
  },
  state: {},
  inputs: [],
  outputs: []
}

const templateState = reactive({ ...defaultTemplateState, loading: true })

const isTemplate = ref(false)

const setTemplateSaved = (flag = false) => {
  templateState.isSaved = flag
}

const isTemplateBlock = () => templateState.isBlock
const isTemplateSaved = () => templateState.isSaved
const isTemplateLoading = () => templateState.loading
const getTemplateSchema = () => templateState.pageSchema || {}

const setCurrentTemplateSchema = (schema) => {
  templateState.currentSchema = schema
}
const getCurrentTemplateSchema = () => templateState.currentSchema

const clearCurrentTemplateState = () => {
  templateState.currentVm = null
  templateState.hoverVm = null
  templateState.properties = {}
  templateState.pageSchema = null
}

const getCurrentTemplate = () => templateState.currentPage

export default function () {
  return {
    defaultTemplateState,
    defaultTemplateSchema,
    templateState,
    isTemplateBlock,
    isTemplateSaved,
    isTemplateLoading,
    getTemplateSchema,
    setCurrentTemplateSchema,
    getCurrentTemplateSchema,
    getCurrentTemplate,
    clearCurrentTemplateState,
    setTemplateSaved,
    isTemplate
  }
}
