<template>
  <tiny-dialog-box
    :visible="dialogVisible"
    title="事件绑定"
    width="50%"
    dialog-class="bind-event-dialog"
    draggable
    :append-to-body="true"
    @close="closeDialog"
    @opened="openedDialog"
  >
    <div class="bind-event-dialog-tip">
      选择已有方法或者添加新方法（点击 确定 之后将在JS面板中创建一个该名称的新方法）。
    </div>
    <div class="bind-event-dialog-content">
      <component :is="BindEventsDialogSidebar" :dialogVisible="dialogVisible" :eventBinding="eventBinding"></component>
      <component :is="BindEventsDialogContent" :dialogVisible="dialogVisible"></component>
    </div>
    <template #footer>
      <div class="bind-dialog-footer">
        <tiny-button @click="closeDialog">取 消</tiny-button>
        <tiny-button type="info" @click="confirm">确 定</tiny-button>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script>
import { ast2String, string2Ast } from '@opentiny/tiny-engine-common/js/ast'
import {
  getMergeMeta,
  useCanvas,
  useHistory,
  useLayout,
  getOptions,
  getMetaApi,
  META_APP
} from '@opentiny/tiny-engine-meta-register'
import { Button, DialogBox } from '@opentiny/vue'
import { nextTick, provide, reactive, ref } from 'vue'
import meta from '../../meta'

const dialogVisible = ref(false)

export const open = () => {
  dialogVisible.value = true
}

export const close = () => {
  dialogVisible.value = false
}

export default {
  components: {
    TinyButton: Button,
    TinyDialogBox: DialogBox
  },
  inheritAttrs: false,
  props: {
    eventBinding: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const { BindEventsDialogSidebar, BindEventsDialogContent } = getMergeMeta(meta.id).components

    const { PLUGIN_NAME, activePlugin } = useLayout()
    const { pageState } = useCanvas()
    const { getMethods, saveMethod, highlightMethod } = getMetaApi(META_APP.Page)

    const state = reactive({
      editorContent: '',
      bindMethodInfo: {},
      tip: '',
      tipError: false,
      enableExtraParams: false,
      isValidParams: true
    })

    provide('context', state)

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
      state.tip = ''
      state.isValidParams = true
    }

    const getExtraParams = () => {
      let extraParams = ''
      if (state.enableExtraParams) {
        try {
          extraParams = JSON.parse(state.editorContent)
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
      activePlugin(PLUGIN_NAME.Page).then(() => {
        // 确认js面板渲染完成之后再对目标函数进行高亮处理
        nextTick(() => {
          if (highlightMethod) {
            highlightMethod(state.bindMethodInfo?.name)
          }
        })
      })
    }

    const confirm = async () => {
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
      const { name } = state.bindMethodInfo
      const method = {
        name,
        content: state.enableExtraParams
          ? `function ${name}(eventArgs,${formatParams}) ${functionBody}`
          : `function ${name}(${formatParams})  ${functionBody}`
      }
      const { beforeSaveMethod } = getOptions(meta.id)

      if (typeof beforeSaveMethod === 'function') {
        await beforeSaveMethod(method, state.bindMethodInfo)
      }

      saveMethod?.(method)

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
      BindEventsDialogSidebar,
      BindEventsDialogContent,
      state,
      dialogVisible,
      confirm,
      closeDialog,
      openedDialog,
      selectMethod
    }
  }
}
</script>

<style lang="less" scoped>
.bind-event-dialog {
  z-index: 99;
  :deep(.tiny-dialog-box) {
    min-width: 760px;
  }
}

.bind-event-dialog-tip {
  padding: var(--te-common-vertical-item-spacing-normal) 14px;
  margin-bottom: var(--te-common-vertical-item-spacing-normal);
  background-color: var(--te-bind-event-dialog-tip-bg-color);
  color: var(--te-bind-event-dialog-tip-text-color);
}

.bind-event-dialog-content {
  display: flex;
  min-width: 700px;
}
</style>
