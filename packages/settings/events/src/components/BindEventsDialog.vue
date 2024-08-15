<template>
  <tiny-dialog-box
    :visible="dialogVisible"
    title="事件绑定"
    width="50%"
    :append-to-body="true"
    @close="closeDialog"
    @opened="openedDialog"
  >
    <div class="bind-event-dialog-content">
      <div class="dialog-content-left">
        <div class="left-title">响应方法</div>
        <div class="left-list-wrap">
          <div class="left-action-list">
            <tiny-search v-model="state.searchValue" placeholder="搜索"></tiny-search>
            <ul class="action-list-wrap">
              <li v-for="item in state.filterMethodList" :key="item.name" @click="selectMethod(item)">
                <div :class="['action-name', { active: item.name === state.bindMethodInfo.name }]">
                  {{ item.title || item.name }}
                  <icon-yes v-if="item.name === state.bindMethodInfo.name" class="action-selected-icon"></icon-yes>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="content-right">
        <div :class="['content-right-top', { 'tip-error': state.tipError }]">
          <div class="content-right-title">方法名称</div>
          <tiny-input
            v-model="state.bindMethodInfo.name"
            :disabled="state.bindMethodInfo.type !== NEW_METHOD_TYPE"
            :class="[{ 'status-error': state.tipError }]"
            placeholder="请从左侧选择一个方法进行绑定，或者选择添加新方法，输入自定义方法名称。"
            @update:modelValue="change"
          ></tiny-input>
          <div class="new-action-tip">{{ state.tip }}</div>
        </div>
        <div :class="['content-right-bottom', { 'tip-error': !state.isValidParams }]">
          <div class="content-right-title">
            <span class="set-params-tip">扩展参数设置</span>
            <tiny-popover placement="top-start" width="350" trigger="hover">
              <template #reference>
                <icon-help-query></icon-help-query>
              </template>
              <p>
                扩展参数：调用当前事件传入的真实参数，数组格式，追加在原有事件参数之后<br />
                如:
                {{ state.bindMethodInfo.name }}(eventArgs, extParam1, extParam2, ...)
              </p>
            </tiny-popover>

            <tiny-switch v-model="state.enableExtraParams" class="set-switch" :show-text="true">
              <template #open>
                <span>开启</span>
              </template>
              <template #close>
                <span>关闭</span>
              </template>
            </tiny-switch>
          </div>
          <div class="content-right-monaco">
            <monaco-editor
              v-if="dialogVisible"
              ref="editor"
              :value="state.editorContent"
              :options="editorOptions"
              class="monaco-editor"
            />
            <div v-if="!state.enableExtraParams" class="mark"></div>
          </div>
          <div v-if="!state.isValidParams && state.enableExtraParams" class="params-tip">
            请输入数组格式的参数，参数可以为表达式。例如：["extParam1", "item.status", 1, "getNames()"]
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="bind-dialog-footer">
        <tiny-button type="info" @click="confirm">确 定</tiny-button>
        <tiny-button @click="closeDialog">取 消</tiny-button>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script>
import { reactive, ref, watchEffect, nextTick } from 'vue'
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { Button, DialogBox, Input, Search, Popover, Switch } from '@opentiny/vue'
import { useCanvas, useHistory, useLayout } from '@opentiny/tiny-engine-controller'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import { string2Ast, ast2String } from '@opentiny/tiny-engine-controller/js/ast'
import { iconYes, iconHelpQuery } from '@opentiny/vue-icon'

const dialogVisible = ref(false)

export const open = () => {
  dialogVisible.value = true
}

export const close = () => {
  dialogVisible.value = false
}

const NEW_METHOD_TYPE = 'newMethod'
const invalidVarNameCharRE = /[^0-9a-zA-Z_$]/
const validVarNameRE = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/

const METHOD_TIPS_MAP = {
  default: '选择已有方法或者添加新方法(点击 确定 之后将在JS面板中创建一个该名称的新方法)',
  exist: '方法名称已存在',
  ruleInvalid: '请输入有效的方法名，可以由字母、数字、下划线、$ 符号组成，不能以数字开头',
  empty: '方法名称不能为空'
}

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyInput: Input,
    TinyButton: Button,
    TinySearch: Search,
    TinyPopover: Popover,
    TinyDialogBox: DialogBox,
    IconYes: iconYes(),
    IconHelpQuery: iconHelpQuery(),
    TinySwitch: Switch
  },
  inheritAttrs: false,
  props: {
    eventBinding: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const { PLUGIN_NAME, getPluginApi, activePlugin } = useLayout()
    const { pageState } = useCanvas()
    const { getMethodNameList, getMethods, saveMethod, highlightMethod } = getPluginApi(PLUGIN_NAME.PageController)

    const editor = ref(null)

    const state = reactive({
      searchValue: '',
      editorContent: '',
      bindMethodInfo: {},
      filterMethodList: [],
      tip: METHOD_TIPS_MAP.default,
      tipError: false,
      enableExtraParams: false,
      isValidParams: true
    })

    const editorOptions = {
      roundedSelection: true,
      automaticLayout: true,
      autoIndent: true,
      language: 'json',
      formatOnPaste: true,
      tabSize: 2,
      theme: theme(),
      lineNumbers: false,
      minimap: {
        enabled: false
      }
    }

    const generateMethodName = (nameList, eventName) => {
      const max = nameList
        .map((name) => Number.parseInt(name.match(/\d+$/)?.[0]) || 0)
        .sort((a, b) => a - b)
        .pop()

      const functionName = eventName?.replace(invalidVarNameCharRE, '_') || ''
      let name = `${functionName}New`

      if (max > -1) {
        name += `${max + 1}`
      }

      return name
    }

    watchEffect(() => {
      const eventName = props.eventBinding?.eventName
      const nameList = getMethodNameList?.().filter((action) => action.indexOf(eventName) > -1) || []
      const newMethodName = generateMethodName(nameList, eventName)

      const newMethod = {
        title: '添加新方法',
        name: newMethodName,
        type: NEW_METHOD_TYPE
      }

      if (props.eventBinding?.ref) {
        state.bindMethodInfo = {
          name: props.eventBinding.ref
        }
      } else {
        state.bindMethodInfo = newMethod
      }

      const methodList =
        getMethodNameList?.()
          .filter((item) => item.indexOf(state.searchValue) > -1)
          .map((name) => ({ name })) || []

      state.filterMethodList = [newMethod, ...methodList]
    })

    const selectMethod = (data) => {
      state.bindMethodInfo = data
    }

    const bindMethod = (data) => {
      if (!data) {
        return
      }

      const eventName = props.eventBinding?.eventName

      if (!eventName) {
        return
      }

      const nodeProps = pageState?.currentSchema?.props

      if (!nodeProps) {
        return
      }

      const { name, extra } = data

      if (!props[eventName]) {
        nodeProps[eventName] = {
          type: 'JSExpression',
          value: ''
        }
      }

      if (extra && state.enableExtraParams) {
        nodeProps[eventName].params = extra
      }

      nodeProps[eventName].value = `this.${name}`

      useHistory().addHistory()
    }

    const resetTipError = () => {
      state.tipError = false
      state.tip = METHOD_TIPS_MAP.default
    }

    const validMethodNameEmpty = (name) => !name

    const validMethodNameExist = (name) => getMethodNameList?.().includes(name)

    const invalidMethodName = (name) => !validVarNameRE.test(name)

    const change = (value) => {
      const validRules = [
        { validator: validMethodNameEmpty, tip: METHOD_TIPS_MAP.empty },
        { validator: validMethodNameExist, tip: METHOD_TIPS_MAP.exist },
        { validator: invalidMethodName, tip: METHOD_TIPS_MAP.ruleInvalid }
      ]
      for (let i = 0; i < validRules.length; i++) {
        const rule = validRules[i]
        if (rule.validator(value)) {
          state.tipError = true
          state.tip = rule.tip

          // 若存在校验不通过的，则直接返回，不继续走下面的流程
          return
        }
      }
      state.tipError = false
      state.tip = METHOD_TIPS_MAP.default
    }

    const getExtraParams = () => {
      let extraParams = ''
      if (state.enableExtraParams) {
        try {
          const inputParams = editor.value?.getEditor().getValue()
          extraParams = JSON.parse(inputParams)
          state.isValidParams = Array.isArray(extraParams)
        } catch (error) {
          state.isValidParams = false
        }
      }
      return extraParams
    }

    const getFormatParams = (extraParams) => Array.from({ length: extraParams.length }, (v, i) => `args${i}`).join(',')

    const getFunctionBody = () => {
      let method = getMethods()?.[state.bindMethodInfo.name]?.value
      let preBody = '{}'

      if (method) {
        let astStr = {}
        try {
          astStr = string2Ast(method)
        } catch (e) {
          method = method.replace('function', `function ${state.bindMethodInfo.name}`)
          astStr = string2Ast(method)
        }

        if (astStr?.program?.body[0]?.body) {
          preBody = ast2String(astStr.program.body[0].body)
        }
      }

      return preBody || '{\n}'
    }

    const activePagePlugin = () => {
      activePlugin(PLUGIN_NAME.PageController).then(() => {
        // 确认js面板渲染完成之后再对目标函数进行高亮处理
        nextTick(() => {
          if (highlightMethod) {
            highlightMethod(state.bindMethodInfo?.name)
          }
        })
      })
    }

    const confirm = () => {
      if (state.tipError) {
        return
      }

      let params = 'event'
      let extraParams = getExtraParams()
      let formatParams = params

      if (!state.isValidParams) {
        return
      }

      if (extraParams) {
        params = extraParams.join(',')
        formatParams = getFormatParams(extraParams)
      }

      bindMethod({ ...state.bindMethodInfo, params, extra: extraParams })

      // 需要在bindMethod之后
      const functionBody = getFunctionBody()

      saveMethod?.({
        name: state.bindMethodInfo.name,
        content: state.enableExtraParams
          ? `function ${state.bindMethodInfo.name}(eventArgs,${formatParams}) ${functionBody}`
          : `function ${state.bindMethodInfo.name}(${formatParams})  ${functionBody}`
      })

      activePagePlugin()
      close()
    }

    const openedDialog = () => {
      state.enableExtraParams = Boolean(props.eventBinding?.params?.length)
      state.editorContent = JSON.stringify(props.eventBinding?.params || [], null, 2)
      resetTipError()
    }

    const closeDialog = () => {
      resetTipError()
      close()
    }

    return {
      NEW_METHOD_TYPE,
      state,
      editor,
      editorOptions,
      dialogVisible,
      change,
      confirm,
      closeDialog,
      openedDialog,
      selectMethod
    }
  }
}
</script>

<style lang="less" scoped>
.bind-event-dialog-content {
  display: flex;
  min-width: 700px;

  .dialog-content-left {
    margin-right: 30px;
    width: 30%;
    display: flex;
    flex-direction: column;

    .left-title {
      font-weight: 600;
    }

    .left-list-wrap {
      border: 1px solid var(--ti-lowcode-bind-event-dialog-content-left-border-color);
      border-radius: 4px;
      height: 300px;
      margin-top: 12px;
      display: flex;
      flex: 1;

      .left-action-list {
        flex: 1;
        padding: 12px;
        .action-list-wrap {
          height: 250px;
          margin-top: 8px;
          overflow: auto;
        }

        .action-name {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          cursor: pointer;

          &.active {
            background: var(--ti-lowcode-bind-event-dialog-content-left-list-item-active-bg-color);
          }

          .action-selected-icon {
            font-size: 14px;
            color: var(--ti-lowcode-bind-event-dialog-action-selected-icon-color);
          }
        }
      }
    }
  }

  .content-right {
    width: 68%;

    .content-right-top {
      .new-action-tip {
        margin: 8px 0;
        color: var(--ti-lowcode-bind-event-dialog-new-action-tip-color);
      }
    }
    .content-right-bottom {
      .content-right-monaco {
        border: 1px solid var(--ti-lowcode-bind-event-dialog-content-right-monaco-border-color);
        overflow: hidden;
        position: relative;

        .monaco-editor {
          width: 100%;
          height: 216px;
          padding: 12px 8px;
          color: var(--ti-lowcode-toolbar-breadcrumb-color);
        }
        .mark {
          width: 100%;
          height: 216px;
          position: absolute;
          z-index: 1;
          top: 0;
          background-color: var(--ti-lowcode-bind-event-dialog-mark-bg-color);
        }
      }

      .params-tip {
        margin: 8px 0;
        color: var(--ti-lowcode-error-tip-color);
      }
    }
    .content-right-top .content-right-title,
    .content-right-bottom .content-right-title {
      font-weight: 600;
      margin-bottom: 12px;
      .set-params-tip {
        margin-right: 3px;
      }
      .set-switch {
        width: 60px;
        margin-left: 10px;
      }
    }

    .tip-error {
      .content-right-monaco {
        border: 1px solid var(--ti-lowcode-error-tip-color);
      }
      .params-tip,
      .new-action-tip {
        color: var(--ti-lowcode-error-tip-color);
      }
    }
  }
}
</style>
