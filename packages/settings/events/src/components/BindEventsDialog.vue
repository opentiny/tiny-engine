<template>
  <tiny-dialog-box
    v-show="dialogVisible"
    title="事件绑定"
    width="50%"
    :append-to-body="true"
    @close="closeDialog"
    @opened="openedDialog"
  >
    <div class="bind-event-dialog-content">
      <component :is="BindEventsDialogSidebar" :eventBinding="eventBinding"></component>
      <component :is="BindEventsDialogContent" :dialogVisible="dialogVisible"></component>
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
import { ast2String, string2Ast } from '@opentiny/tiny-engine-common/js/ast'
import { getMergeMeta, useCanvas, useHistory, useLayout } from '@opentiny/tiny-engine-meta-register'
import { Button, DialogBox } from '@opentiny/vue'
import { nextTick, provide, reactive, ref } from 'vue'
import { METHOD_TIPS_MAP } from './constants'
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

    const { PLUGIN_NAME, getPluginApi, activePlugin } = useLayout()
    const { pageState } = useCanvas()
    const { getMethods, saveMethod, highlightMethod } = getPluginApi(PLUGIN_NAME.PageController)

    const state = reactive({
      editorContent: '',
      bindMethodInfo: {},
      tip: METHOD_TIPS_MAP.default,
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
      state.tip = METHOD_TIPS_MAP.default
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
.bind-event-dialog-content {
  display: flex;
  min-width: 700px;
}
</style>
