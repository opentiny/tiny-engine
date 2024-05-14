<template>
  <slot>
    <span :class="['icon', { 'icon-bind': modelValue?.variable }]" @click="open">
      <svg-button name="cloud-shell" placement="top" tips="变量绑定"></svg-button>
    </span>
  </slot>

  <tiny-dialog-box
    v-if="dialogShouldInitialize"
    :visible="state.isVisible"
    title="变量绑定"
    width="48%"
    :append-to-body="true"
    class="meta-bind-variable-dialog-box"
    @update:visible="state.isVisible = $event"
    @close="cancel"
  >
    <div class="bind-dialog-container">
      <div class="bind-dialog-container-header">
        <tiny-alert
          type="info"
          description="你可以通过点击左侧区域变量列表绑定变量或处理函数，也可以在右边输入模式输入复杂的表达式。"
          class="header-alert"
        ></tiny-alert>
      </div>
      <div class="bind-dialog-content">
        <div class="content-left">
          <span class="content-left__title">变量列表</span>
          <div class="list-wrap">
            <ul class="content-left__list">
              <li
                v-for="item in state.variableList"
                :key="item.id"
                :class="{ 'content-left__list-item': true, active: item.id === state.active }"
                @click="selectItem(item)"
              >
                {{ item.content }}
              </li>
            </ul>
            <div class="item-content">
              <tiny-search v-model="state.value" placeholder="搜索"></tiny-search>
              <div class="item-content-list lowcode-scrollbar-thin">
                <ul>
                  <li
                    v-for="(item, key) in state.variables"
                    v-show="key.includes(state.value)"
                    :key="key"
                    :class="{ 'item-selected': state.variableName === key }"
                    @click="variableClick(key, item)"
                  >
                    <div class="item-text" :title="state.bindPrefix + key">{{ `${state.bindPrefix}${key}` }}</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="content-right">
          <div class="content-detail-header">
            <div class="header-name">
              <span class="content-right__title">变量</span>
            </div>
          </div>
          <div class="content-wrap">
            <div v-if="!state.isEditorEditMode" class="top">{{ state.variable }}</div>
            <div v-else :class="['top', { 'poll-top': isDataSource }]">
              <monaco-editor
                ref="editor"
                :value="state.variable"
                :options="editorOptions"
                @editorDidMount="editorDidMount"
              ></monaco-editor>
              <div v-if="isDataSource" class="datasource-poll-wrap">
                <tiny-tooltip
                  placement="top"
                  content="定时更新开启后，页面运行时将会定期请求远程数据源，实现数据定时更新。"
                  ><span>定时更新：</span></tiny-tooltip
                >
                <tiny-switch v-model="state.isPoll"></tiny-switch>
                <div v-if="state.isPoll" class="datasource-poll-interval">
                  <span>更新时间：</span>
                  <tiny-input type="number" v-model="state.pollInterval"></tiny-input>
                  <span>ms</span>
                </div>
              </div>
            </div>
            <div class="bottom lowcode-scrollbar-thin">
              <h3>用法</h3>
              <div class="bottom-demo">
                <p>
                  你可以通过点击左侧区域绑定变量或处理函数，或者点击右边的铅笔按钮切换到输入模式，输入复杂的表达式。
                </p>
                <p>输入框内默认支持变量，写法和 JS 写法完全一致。</p>
                <div>页面状态: this.state.xxx</div>
                <div>字符串: "string"</div>
                <div>数字: 123</div>
                <div>布尔值: true / false</div>
                <div>对象: { name: "张三" }</div>
                <div>数组: ["1", "2"]</div>
                <div>空值: null</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="bind-dialog-footer">
        <div class="left">
          <tiny-button type="danger" plain @click="remove">移除绑定</tiny-button>
        </div>
        <div class="right">
          <tiny-button @click="cancel">取 消</tiny-button>
          <tiny-button type="info" @click="confirm">确 定</tiny-button>
        </div>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script>
import { reactive, ref, computed, nextTick, watch } from 'vue'
import { camelize, capitalize } from '@vue/shared'
import { Button, DialogBox, Search, Switch, Input, Tooltip, Alert } from '@opentiny/vue'
import { useHttp } from '@opentiny/tiny-engine-http'
import { useCanvas, useResource, useLayout, useApp, useProperties, useData } from '@opentiny/tiny-engine-controller'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import { constants } from '@opentiny/tiny-engine-utils'
import SvgButton from './SvgButton.vue'
import { parse, traverse, generate } from '@opentiny/tiny-engine-controller/js/ast'
import { DEFAULT_LOOP_NAME } from '@opentiny/tiny-engine-controller/js/constants'
import MonacoEditor from './VueMonaco.vue'
import { formatString } from '@opentiny/tiny-engine-controller/js/ast'

const { EXPRESSION_TYPE } = constants

const CONSTANTS = {
  THIS: 'this.',
  STATE: 'this.state.',
  STORE: 'this.stores.',
  PROPS: 'this.props.',
  COLLECTION: 'Collection',
  ITEM: 'item',
  DATASOUCE: 'datasource',
  DATASOUCEPREFIX: '数据源： ',
  DATASOURCEMAP: 'this.dataSourceMap.',
  INTERVALID: 'intervalId'
}

const getJsSlot = () => {
  const { getNode, getCurrent } = useCanvas().canvasApi.value || {}

  if (!getNode || !getCurrent) {
    return [false, {}]
  }

  const jsSlot = getNode(getCurrent()?.parent?.id, true)?.parent

  return [jsSlot?.type === 'JSSlot', jsSlot]
}

const getJsSlotParams = () => {
  const [isJsSlot, jsSlot] = getJsSlot()
  return isJsSlot ? jsSlot?.params || [] : []
}

export default {
  name: 'MetaBindVariable',
  components: {
    MonacoEditor,
    TinyDialogBox: DialogBox,
    TinyButton: Button,
    TinySearch: Search,
    TinySwitch: Switch,
    TinyInput: Input,
    TinyTooltip: Tooltip,
    SvgButton,
    TinyAlert: Alert
  },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: [String, Number, Boolean, Array, Object, Date],
      default: ''
    },
    lazyLoad: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { emit }) {
    const editor = ref(null)
    const http = useHttp()
    let oldValue = ''

    const list = [
      { id: 'state', content: 'State 属性' },
      { id: 'store', content: '应用状态' },
      { id: 'function', content: '自定义处理函数' },
      { id: 'utils', content: '工具类' },
      { id: 'bridge', content: '桥接源' },
      { id: 'datasource', content: '数据源' }
    ]

    const state = reactive({
      isBlock: computed(() => useCanvas().isBlock()),
      variables: {},
      // 控制变量列表显示/隐藏
      isVisible: false,
      // 搜索框value
      value: '',
      active: 'state',
      // 某一类型下的变量列表
      variableList: computed(() => {
        const extendedVars = []
        const [isInJsSlot] = getJsSlot()

        if (state.isBlock) {
          extendedVars.push({ id: 'props', content: 'props' })
        }

        if (state.loopData) {
          extendedVars.push({ id: 'loop', content: '循环变量' })
        }

        if (isInJsSlot) {
          extendedVars.push({ id: 'slotScope', content: '暴露给插槽使用的变量' })
        }

        return [...list, ...extendedVars]
      }),
      // 绑定的变量名/变量表达式
      variable: '',
      // 绑定的变量指向的值内容
      variableContent: null,
      // 引用的state变量名
      variableName: '',
      // 编辑器状态：只读状态(false)、编辑状态(true)
      isEditorEditMode: true,
      dataSouce: null,
      // 静态值
      mock: props.modelValue?.value || props.modelValue,
      bindPrefix: '',
      loopData: null,
      loopArgs: '',
      isPoll: false,
      pollInterval: 5000
    })

    const isDataSource = computed(() => state.active === CONSTANTS.DATASOUCE)

    // 每次弹窗打开时都记录下绑定变量的旧值，用来判断保存按钮状态
    watch(
      () => state.isVisible,
      (value) => {
        if (value) {
          oldValue = state.variable
          state.loopData = useProperties().getSchema()?.loop
        }
      }
    )

    const bindKey = computed(() => props.modelValue?.value?.replace?.('this.state.', '') || '')

    const editorOptions = {
      theme: theme(),
      tabSize: 2,
      language: 'javascript',
      autoIndent: true,
      formatOnPaste: true,
      automaticLayout: true,
      roundedSelection: true,
      lineNumbers: false,
      minimap: {
        enabled: false
      }
    }

    const editorDidMount = () => {
      if (!editor.value) {
        return
      }

      // 支持对象类型数据或表达式，不显示语法校验报错
      const diagnosticsOptions = editor.value
        .getMonaco()
        .languages.typescript.javascriptDefaults.getDiagnosticsOptions()
      editor.value.getMonaco().languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        ...diagnosticsOptions,
        noSyntaxValidation: true,
        noSemanticValidation: true
      })
    }

    const removeInterval = (start, end, intervalId, pageSchema) => {
      const unmountedFn = pageSchema.lifeCycles?.onUnmounted?.value
      const fetchBody = `
      /** ${start} */
      clearInterval(state.${intervalId});
      /** ${end} */`

      if (!unmountedFn) {
        pageSchema.lifeCycles = pageSchema.lifeCycles || {}
        pageSchema.lifeCycles.onUnmounted = {
          type: 'JSFunction',
          value: `function onUnmounted() {${fetchBody}}`
        }
      } else {
        if (!unmountedFn.includes(`${intervalId}`)) {
          pageSchema.lifeCycles.onUnmounted.value = unmountedFn.trim().replace(/\}$/, fetchBody + '}')
        }
      }
    }

    const genRemoteMethodToLifeSetup = (variableName, sourceRef, pageSchema) => {
      if (sourceRef?.data?.data) {
        const setupFn = pageSchema.lifeCycles?.setup?.value
        const { getCommentByKey } = useData()
        const { start, end } = getCommentByKey(variableName)
        const intervalId = `${CONSTANTS.INTERVALID}${capitalize(camelize(sourceRef.name))}`
        const isPoll = state.isPoll && state.pollInterval !== undefined

        let fetchBodyFn = `${CONSTANTS.DATASOURCEMAP}${sourceRef.name}.load().then(res => {
          state.${variableName} = res?.data?.items || res?.data || res
        })`

        if (isPoll) {
          fetchBodyFn = `state.${intervalId} = setInterval(() => {${CONSTANTS.DATASOURCEMAP}${sourceRef.name}.load().then(res => {
            state.${variableName} = res?.data?.items || res?.data || res
          })}, ${state.pollInterval})`
        }

        const fetchBody = `
        /** ${start} */
        ${fetchBodyFn};
        /** ${end} */`

        if (!setupFn) {
          pageSchema.lifeCycles = pageSchema.lifeCycles || {}
          pageSchema.lifeCycles.setup = {
            type: 'JSFunction',
            value: `function setup({ props, state, watch, onMounted }) {${fetchBody}}`
          }
        } else {
          if (!setupFn.includes(`${CONSTANTS.DATASOURCEMAP}${sourceRef.name}`)) {
            pageSchema.lifeCycles.setup.value = setupFn.trim().replace(/\}$/, fetchBody + '}')
          } else {
            const ast = parse(setupFn)
            traverse(ast, {
              ExpressionStatement(path) {
                if (path.toString().includes(sourceRef.name)) {
                  path.replaceWithSourceString(fetchBodyFn)
                  path.stop()
                }
              }
            })

            pageSchema.lifeCycles.setup.value = generate(ast).code
          }
        }

        if (isPoll) {
          removeInterval(start, end, intervalId, pageSchema)
        }
      }
    }

    const variableClick = (key, item) => {
      if (state.bindPrefix === CONSTANTS.DATASOUCEPREFIX) {
        // 当选中数据源时，直接生成对应state变量并绑定数据源的静态数据
        const stateName = `${CONSTANTS.DATASOUCE}${capitalize(camelize(key))}`
        const staticData = item?.data?.data || []

        // 处理数据数据回显
        state.dataSouce = item
        state.variable = `${CONSTANTS.STATE}${stateName}`
        editor.value.getEditor().setValue(state.variable)
        state.variableName = key
        state.variableContent = staticData
      } else {
        state.variable = !state.bindPrefix ? `${state.loopArgs}${key}` : `${state.bindPrefix}${key}`
        editor.value.getEditor().setValue(state.variable)
        state.variableName = key
        state.variableContent = state.variables[key]
      }
    }

    const cancel = () => {
      state.variable = ''
      state.isVisible = false
    }

    const remove = () => {
      emit('update:modelValue', '')
      cancel()
    }

    const confirm = () => {
      let variableContent = state.isEditorEditMode ? editor.value?.getEditor().getValue() : state.variable

      const { setSaved, canvasApi } = useCanvas()
      // 如果新旧值不一样就显示未保存状态
      if (oldValue !== variableContent) {
        setSaved(false)
        variableContent = formatString(variableContent, 'javascript')
      }

      const pattern = /^[\s]*{[\s]*api[\s]*:[\s\w.]*}$/
      const needFetchDataFormat = props.name === 'fetchData' && !pattern.test(variableContent)

      if (variableContent) {
        if (state.bindPrefix === CONSTANTS.DATASOUCEPREFIX) {
          const pageSchema = canvasApi.value.getSchema()
          const stateName = state.variable.replace(`${CONSTANTS.STATE}`, '')
          const staticData = state.variableContent.map(({ _id, ...other }) => other)

          pageSchema.state[stateName] = staticData

          // 设置画布上下文环境，让画布触发更新渲染
          canvasApi.value.setState({ [stateName]: staticData })

          // 这里在setup生命周期函数内部处理用户真实环境中的数据源请求
          genRemoteMethodToLifeSetup(stateName, state.dataSouce, pageSchema)
        }

        emit('update:modelValue', {
          type: 'JSExpression',
          value: needFetchDataFormat ? `{api:${variableContent}}` : variableContent
        })
      } else {
        emit('update:modelValue', '')
      }

      cancel()
    }

    const getInitVariable = () => {
      if (
        props.modelValue?.value &&
        props.modelValue?.type === EXPRESSION_TYPE.JS_EXPRESSION &&
        Object.keys(props.modelValue || {}).length === 2
      ) {
        return String(props.modelValue?.value)
      }

      return ''
    }

    const dialogShouldInitialize = ref(!props.lazyLoad)
    const open = () => {
      dialogShouldInitialize.value = true
      state.isVisible = true
      state.variableName = bindKey.value
      state.variable = getInitVariable()
      state.variables = useCanvas().canvasApi.value.getSchema()?.state || {}
      state.bindPrefix = CONSTANTS.STATE
      state.variableContent = state.variables[bindKey.value]
      nextTick(() => window.dispatchEvent(new Event('resize')))
    }

    const selectItem = (item) => {
      state.active = item.id
      const { canvasApi } = useCanvas()

      if (item.id === 'function') {
        state.bindPrefix = CONSTANTS.THIS
        const { PLUGIN_NAME, getPluginApi } = useLayout()
        const { getMethods } = getPluginApi(PLUGIN_NAME.PageController)
        state.variables = { ...getMethods?.() }
      } else if (item.id === 'bridge' || item.id === 'utils') {
        state.bindPrefix = `${CONSTANTS.THIS}${item.id}.`
        const bridge = {}
        useResource().resState[item.id]?.forEach((res) => {
          bridge[res.name] = `${item.id}.${res.content.exportName}`
        })

        state.variables = bridge
      } else if (item.id === 'props') {
        state.bindPrefix = CONSTANTS.PROPS
        const properties = canvasApi.value.getSchema()?.schema?.properties
        const bindProperties = {}
        properties?.forEach(({ content }) => {
          content.forEach(({ property }) => {
            bindProperties[property] = property
          })
        })
        state.variables = bindProperties
      } else if (item.id === 'datasource') {
        state.bindPrefix = CONSTANTS.DATASOUCEPREFIX
        const { appInfoState } = useApp()
        const url = new URLSearchParams(location.search)
        const selectedId = appInfoState.selectedId || url.get('id')

        // 实时请求数据源列表数据，保证数据源获取最新的数据源数据
        http.get(`/app-center/api/sources/list/${selectedId}`).then((data) => {
          const sourceData = {}
          data.forEach((res) => {
            sourceData[res.name] = res
          })
          state.variables = sourceData
        })
      } else if (item.id === 'store') {
        state.bindPrefix = CONSTANTS.STORE
        state.variables = {}

        const stores = canvasApi.value.getGlobalState()
        stores.forEach(({ id, state: storeState = {}, getters = {} }) => {
          const loadProp = (prop) => {
            const propBinding = `${id}.${prop}`
            state.variables[propBinding] = propBinding
          }

          Object.keys(storeState).forEach(loadProp)
          Object.keys(getters).forEach(loadProp)
        })
      } else if (item.id === 'loop') {
        state.bindPrefix = ''
        const [loopItem = DEFAULT_LOOP_NAME.ITEM, loopIndex = DEFAULT_LOOP_NAME.INDEX] =
          useProperties().getSchema()?.loopArgs || []
        state.variables = [loopItem, loopIndex].reduce((variables, param) => ({ ...variables, [param]: param }), {})
      } else if (item.id === 'slotScope') {
        state.bindPrefix = ''
        const params = getJsSlotParams()
        state.variables = params.reduce((variables, param) => ({ ...variables, [param]: param }), {})
      } else {
        state.bindPrefix = CONSTANTS.STATE
        state.variables = canvasApi.value.getSchema()?.[item.id]
      }
    }

    return {
      editorDidMount,
      editorOptions,
      variableClick,
      remove,
      cancel,
      confirm,
      dialogShouldInitialize,
      open,
      selectItem,
      state,
      editor,
      isDataSource
    }
  }
}
</script>

<style lang="less" scoped>
.icon {
  margin-left: 8px;
}

.meta-bind-variable-dialog-box {
  .header-alert {
    margin-top: 0;
    margin-bottom: 12px;
    color: var(--ti-lowcode-meta-bind-variable-header-alert-color);
  }
  .bind-dialog-content {
    display: flex;
    align-items: center;

    .content-left {
      margin-right: 12px;
      width: 38%;

      .content-left__title {
        color: var(--ti-lowcode-meta-bind-variable-content-left-title-color);
      }

      .list-wrap {
        border: 1px solid var(--ti-lowcode-meta-bind-variable-list-wrap-border-color);
        border-radius: 4px;
        height: 300px;
        margin-top: 8px;
        display: flex;
      }

      .content-left__list {
        width: 120px;
        color: var(--ti-lowcode-meta-bind-variable-content-left-list-color);
        border-right: 1px solid var(--ti-lowcode-meta-bind-variable-content-left-list-border-right-color);
      }

      .content-left__list-item {
        padding: 8px 12px;
        cursor: pointer;
        transition: background 0.3s;
        &.active,
        &:hover {
          background: var(--ti-lowcode-meta-bind-variable-list-item-hover-bg-color);
        }
      }

      .item-selected {
        background-color: var(--ti-lowcode-meta-bind-variable-item-selected-bg-color);
      }

      .item-text {
        padding: 8px 12px;
        cursor: pointer;
        color: var(--ti-lowcode-meta-bind-variable-item-text-color);

        &:hover {
          background-color: var(--ti-lowcode-meta-bind-variable-item-hover-bg-color);
        }
      }

      .content-left__title {
        font-weight: 600;
      }

      .item-content {
        padding: 12px;
        width: calc(100% - 140px);

        .item-content-list {
          height: calc(100% - 42px);
          overflow-y: auto;
        }
      }
    }

    .content-right {
      flex: 1 1 0;
      width: 60%;
      .content-detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .header-name {
          display: flex;
          align-items: center;
        }
      }

      .content-right__title {
        color: var(--ti-lowcode-meta-bind-variable-content-right-title-color);
        font-weight: 600;
        margin-right: 5px;
      }

      .state-preview {
        margin-top: 5px;
      }

      .content-wrap {
        height: 300px;
        margin-top: 8px;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .top {
          width: 100%;
          height: 54%;
          border-radius: 4px;
          padding: 12px 8px;
          color: var(--ti-lowcode-meta-bind-variable-top-color);
          border: 1px solid var(--ti-lowcode-meta-bind-variable-top-border-color);
          box-sizing: border-box;
          & > div {
            height: 100%;
            width: 100%;
          }
          .datasource-poll-wrap {
            display: flex;
            align-items: center;
            height: 24px;
            margin-top: 12px;
            .datasource-poll-interval {
              margin-left: 16px;
              .tiny-input {
                width: 120px;
                height: 20px;
                margin: 0 8px;
              }
            }
          }
        }

        .poll-top {
          & > div {
            height: calc(100% - 36px);
            width: 100%;
          }
        }

        .bottom {
          width: 100%;
          height: 40%;
          padding: 8px 12px;
          border-radius: 4px;
          box-sizing: border-box;
          overflow: auto;
          color: var(--ti-lowcode-meta-bind-variable-bottom-color);
          border: 1px solid var(--ti-lowcode-meta-bind-variable-bottom-border-color);
          pre {
            font-family: consolas;
          }
        }
      }
    }
  }

  .bind-dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
