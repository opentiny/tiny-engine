<template>
  <div v-if="isOpen">
    <plugin-setting title="全局设置" @cancel="close" @save="saveGlobalDataHandle">
      <template #content>
        <tiny-collapse v-model="activeNames">
          <tiny-collapse-item title="请求参数处理函数（willFetch）" name="willFetch">
            <data-handler-editor v-model="state.willFetchValue"></data-handler-editor>
          </tiny-collapse-item>
          <tiny-collapse-item title="请求完成回调函数（dataHandler）" name="dataHandler">
            <data-handler-editor v-model="state.dataHandlerValue"></data-handler-editor>
          </tiny-collapse-item>
          <tiny-collapse-item title="请求失败后的回调函数（errorHandler）" name="errorHandler">
            <data-handler-editor v-model="state.errorHandlerValue"></data-handler-editor>
          </tiny-collapse-item>
        </tiny-collapse>
      </template>
    </plugin-setting>
  </div>
</template>

<script>
import DataHandlerEditor from './RemoteDataAdapterForm.vue'
import { watch, ref, nextTick, reactive } from 'vue'
import { requestGlobalDataHandler } from './js/http'
import { useApp, useModal, useResource } from '@opentiny/tiny-engine-controller'
import { PluginSetting } from '@opentiny/tiny-engine-common'
import { Collapse, CollapseItem } from '@opentiny/vue'
import { constants } from '@opentiny/tiny-engine-utils'

const { DEFAULT_INTERCEPTOR } = constants
const isOpen = ref(false)

export const open = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

export default {
  components: {
    DataHandlerEditor,
    PluginSetting,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem
  },
  setup() {
    const { confirm } = useModal()

    const state = reactive({
      dataHandlerValue: useResource().resState?.dataHandler?.value,
      willFetchValue: useResource().resState.willFetch?.value,
      errorHandlerValue: useResource().resState?.errorHandler?.value
    })

    const saveGlobalDataHandle = () => {
      const id = useApp().appInfoState.selectedId

      const handler = {
        dataHandler: { type: 'JSFunction', value: state.dataHandlerValue || DEFAULT_INTERCEPTOR.dataHandler.value },
        willFetch: { type: 'JSFunction', value: state.willFetchValue || DEFAULT_INTERCEPTOR.willFetch.value },
        errorHandler: { type: 'JSFunction', value: state.errorHandlerValue || DEFAULT_INTERCEPTOR.errorHandler.value }
      }

      requestGlobalDataHandler(id, { data_source_global: handler }).then((data) => {
        if (data) {
          useResource().resState.dataHandler = { type: 'JSFunction', value: state.dataHandlerValue }
          useResource().resState.willFetch = { type: 'JSFunction', value: state.willFetchValue }
          useResource().resState.errorHandler = { type: 'JSFunction', value: state.errorHandlerValue }
          confirm({
            title: '提示',
            message: '全局请求处理函数设置成功'
          })
        }
      })
    }

    watch(
      () => isOpen.value,
      (value) => {
        nextTick(() => {
          value && window.dispatchEvent(new Event('resize'))
        })
      }
    )

    return {
      isOpen,
      close,
      saveGlobalDataHandle,
      state
    }
  }
}
</script>
<style lang="less" scoped>
.plugin-setting :deep(.monaco-editor) {
  height: calc(100% - 54px);
}
.tiny-collapse {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.is-active {
  flex-grow: 2;
}
.tiny-collapse-item {
  margin-bottom: 3px;
  :deep(.tiny-collapse-item__wrap) {
    height: 100%;
    .tiny-collapse-item__content {
      height: 100%;
    }
  }
}
</style>
