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
import { VueMonaco as MonacoEditor, SvgButton } from '@opentiny/tiny-engine-common'
import { getSharedOptions, useCanvas, useProperties } from '@opentiny/tiny-engine-meta-register'
import { formatString } from '@opentiny/tiny-engine-common/js/ast'
import { DEFAULT_LOOP_NAME } from '@opentiny/tiny-engine-common/js/constants'
import { constants } from '@opentiny/tiny-engine-utils'
import { Alert, Button, DialogBox, Input, Search, Switch, Tooltip } from '@opentiny/vue'
import { camelize, capitalize } from '@vue/shared'
import { computed, nextTick, reactive, ref, watch } from 'vue'

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

const defaultVaribleList = [
  {
    id: 'loop',
    content: '循环变量',
    condition: () => useProperties().getSchema()?.loop,
    getVariables: () => {
      const [loopItem = DEFAULT_LOOP_NAME.ITEM, loopIndex = DEFAULT_LOOP_NAME.INDEX] =
        useProperties().getSchema()?.loopArgs || []

      return {
        bindPrefix: '',
        variables: [loopItem, loopIndex].reduce((variables, param) => ({ ...variables, [param]: param }), {})
      }
    },
    _order: 800
  },
  {
    id: 'slotScope',
    content: '暴露给插槽使用的变量',
    condition: () => {
      const [isInJsSlot] = getJsSlot()
      return isInJsSlot
    },
    getVariables: () => {
      const params = getJsSlotParams()
      return {
        bindPrefix: '',
        variables: params.reduce((variables, param) => ({ ...variables, [param]: param }), {})
      }
    },
    _order: 900
  }
]

export default {
  name: 'VariableConfigurator',
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
    let oldValue = ''
    let postConfirm = null

    const list = (getSharedOptions('variableConfiguratorList') || []).concat(defaultVaribleList).sort((a, b) => a - b)

    const state = reactive({
      variables: {},
      // 控制变量列表显示/隐藏
      isVisible: false,
      // 搜索框value
      value: '',
      active: 'state',
      // 某一类型下的变量列表
      variableList: [],
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
          state.variableList = list.filter((item) =>
            typeof item.condition === 'function' ? item.condition(state) : true
          )
        }
      }
    )

    const bindKey = computed(() => props.modelValue?.value?.replace?.('this.state.', '') || '')

    const editorOptions = {
      language: 'javascript',
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

      const { setSaved } = useCanvas()
      // 如果新旧值不一样就显示未保存状态
      if (oldValue !== variableContent) {
        setSaved(false)
        variableContent = formatString(variableContent, 'javascript')
      }

      const pattern = /^[\s]*{[\s]*api[\s]*:[\s\w.]*}$/
      const needFetchDataFormat = props.name === 'fetchData' && !pattern.test(variableContent)

      if (variableContent) {
        if (typeof postConfirm === 'function') {
          postConfirm(state)
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
      postConfirm = item.postConfirm

      if (typeof item.getVariables === 'function') {
        const { bindPrefix, variables } = item.getVariables()
        state.bindPrefix = bindPrefix
        state.variables = variables
      } else if (typeof item.getVariablesAsync === 'function') {
        item.getVariablesAsync().then(({ bindPrefix, variables }) => {
          state.bindPrefix = bindPrefix
          state.variables = variables
        })
      } else {
        state.bindPrefix = ''
        state.variables = {}
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
