<template>
  <div v-if="isOpen" class="global-data-handler">
    <plugin-setting title="全局设置" @cancel="close" @save="saveGlobalDataHandle">
      <template #content>
        <tiny-collapse v-model="activeNames">
          <tiny-collapse-item title="跨域代理配置（proxy）" name="proxy">
            <data-handler-editor v-model="state.proxy" :options="options"></data-handler-editor>
          </tiny-collapse-item>
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
import { useModal, useResource, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
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
    const {
      appSchemaState: { proxy, willFetch, dataHandler, errorHandler }
    } = useResource()
    const options = reactive({
      language: 'json',
      minimap: { enabled: true },
      placeholder: `// ✅ 空或匹配不上则无代理；示例：
      {
      \u200B \u200B "proxy": {
      \u200B \u200B \u200B \u200B "/mock": {
      \u200B \u200B \u200B \u200B \u200B \u200B "target": "https://mock.apipost.net",
      \u200B \u200B \u200B \u200B \u200B \u200B "changeOrigin": true
      \u200B \u200B }
      } \n
      `
    })
    const state = reactive({
      proxy: JSON.stringify(proxy || DEFAULT_PROXY, null, 2),
      willFetchValue: willFetch?.value,
      dataHandlerValue: dataHandler?.value,
      errorHandlerValue: errorHandler?.value
    })

    const saveGlobalDataHandle = () => {
      const id = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

      const handler = {
        proxy: JSON.parse(state.proxy || JSON.stringify(DEFAULT_PROXY)),
        willFetch: { type: 'JSFunction', value: state.willFetchValue || DEFAULT_INTERCEPTOR.willFetch.value },
        dataHandler: {
          type: 'JSFunction',
          value: state.dataHandlerValue || DEFAULT_INTERCEPTOR.globalDataHandler.value
        },
        errorHandler: { type: 'JSFunction', value: state.errorHandlerValue || DEFAULT_INTERCEPTOR.errorHandler.value }
      }

      requestGlobalDataHandler(id, { data_source_global: handler }).then((data) => {
        if (data) {
          useResource().appSchemaState.proxy = JSON.parse(state.proxy || JSON.stringify(DEFAULT_PROXY))
          useResource().appSchemaState.willFetch = { type: 'JSFunction', value: state.willFetchValue }
          useResource().appSchemaState.dataHandler = { type: 'JSFunction', value: state.dataHandlerValue }
          useResource().appSchemaState.errorHandler = { type: 'JSFunction', value: state.errorHandlerValue }
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
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          value && window.dispatchEvent(new Event('resize'))
        })
      }
    )

    return {
      isOpen,
      close,
      saveGlobalDataHandle,
      options,
      state
    }
  }
}
</script>
<style lang="less" scoped>
.global-data-handler {
  :deep(.plugin-setting) {
    .monaco-editor {
      height: calc(100% - 54px);
    }
    .plugin-setting-content {
      padding: 0;
    }
    .tiny-collapse-item__wrap {
      padding: 0 12px;
    }
  }
}
.tiny-collapse {
  height: 100%;
  display: flex;
  flex-direction: column;
  .tiny-collapse-item:first-child {
    border-top: 0;
  }
  :deep(.tiny-collapse-item__content) {
    padding: 0 0 12px;
  }
}
</style>
