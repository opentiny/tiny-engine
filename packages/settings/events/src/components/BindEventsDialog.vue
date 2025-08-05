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
      <tiny-alert
        type="info"
        description="选择已有方法或者添加新方法（点击 确定 之后将在JS面板中创建一个该名称的新方法）。"
        class="header-alert"
        :closable="false"
      ></tiny-alert>
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
/* metaService: engine.setting.event.BindEventsDialog */
import { string2Ast } from '@opentiny/tiny-engine-common/js/ast'
import {
  getMergeMeta,
  useCanvas,
  useHistory,
  useLayout,
  getOptions,
  getMetaApi,
  META_APP
} from '@opentiny/tiny-engine-meta-register'
import { Button, DialogBox, TinyAlert } from '@opentiny/vue'
import { nextTick, provide, reactive, ref } from 'vue'
import MagicString from 'magic-string'
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
    TinyDialogBox: DialogBox,
    TinyAlert
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

    const rewriteMethodParams = (method, name, formatParams, extraParams, enableExtraParams) => {
      const finalParams = enableExtraParams && extraParams.length ? `event,${formatParams}` : formatParams
      const defaultMethod = `function ${name} (${finalParams}) {\n}\n`

      // 没有现存方法，直接拼接一个新的
      if (!method) {
        return defaultMethod
      }

      try {
        const magicStr = new MagicString(method)
        const astStr = string2Ast(method)

        // 解析出来不是函数声明，直接返回默认拼接的函数
        if (astStr?.program?.body[0]?.type !== 'FunctionDeclaration') {
          return defaultMethod
        }

        // 参数数量一致，不需要改写参数，直接返回
        // extraParams.length 是传入的参数数量，+1 是 event 参数
        if (astStr?.program?.body[0].params.length === extraParams.length + 1) {
          return method
        }

        // 参数数量不一致，需要改写参数
        const start = astStr?.program?.body[0].id.end
        const end = astStr?.program?.body[0].body.start
        magicStr.remove(start, end)
        magicStr.appendLeft(start, `(${finalParams})`)
        return magicStr.toString()
      } catch (e) {
        // 尝试改写失败了，直接返回拼接的
        return defaultMethod
      }
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
      const extraParams = getExtraParams()
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
      const { name } = state.bindMethodInfo
      const methodValue = getMethods()?.[state.bindMethodInfo.name]?.value
      const functionStr = rewriteMethodParams(methodValue, name, formatParams, extraParams, state.enableExtraParams)
      const method = {
        name,
        content: functionStr
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
  .tiny-alert.tiny-alert--normal {
    margin: 12px 0;
  }
}

.bind-event-dialog-content {
  display: flex;
  min-width: 700px;
}
</style>
