<template>
  <div :class="['vue-repl-container', debugSwitch ? 'preview-debug-mode' : '']">
    <Repl
      :editor="editorComponent"
      :store="store"
      :sfcOptions="sfcOptions"
      :showCompileOutput="false"
      :showTsConfig="false"
      :showImportMap="true"
      :clearConsole="false"
      :autoResize="false"
    />
  </div>
</template>

<script>
import { defineComponent, computed, defineAsyncComponent, onMounted, onBeforeUnmount } from 'vue'
import { Repl, ReplStore } from '@vue/repl'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { injectDebugSwitch } from './debugSwitch'
import { usePreviewCommunication } from './usePreviewCommunication'
import { usePreviewData } from './usePreviewData'
import '@vue/repl/style.css'

const Monaco = defineAsyncComponent(() => import('@vue/repl/monaco-editor')) // 异步组件实现懒加载，打开debug后再加载

const EmptyEditor = defineComponent({
  setup() {
    return () => null
  }
})

export default {
  components: {
    Repl
  },
  setup() {
    const debugSwitch = injectDebugSwitch()
    const editorComponent = computed(() => (debugSwitch?.value ? Monaco : EmptyEditor))
    const store = new ReplStore()
    const sfcOptions = {
      script: {
        // scirpt setup 编译后注入 import { * } from "vue"
        inlineTemplate: false
      }
    }

    // 相比store.setFiles，只要少了state.activeFile = state.files[filename]，因为改变activeFile会触发多余的文件解析
    const setFiles = async (newFiles, mainFileName) => {
      await store.setFiles(newFiles, mainFileName)
      // 强制更新 codeSandbox
      store.state.resetFlip = !store.state.resetFlip
      store['initTsConfig']() // 触发获取组件d.ts方便调试
    }

    const queryParams = new URLSearchParams(location.search)
    document.documentElement?.setAttribute?.('data-theme', queryParams.get('theme') || 'light')

    const { loadInitialData, updateUrl, updatePreview } = usePreviewData({ setFiles, store })

    let cleanupCommunicationAction = null
    const onSchemaReceivedAction = async (data) => {
      updateUrl(data.currentPage, { scripts: data.scripts, styles: data.styles })
      const isHistory = new URLSearchParams(location.search).get('history')
      const previewHotReload = getMergeMeta('engine.config').previewHotReload
      // 如果是历史预览，则不需要实时预览，接收到消息之后直接取消监听(需要监听到第一次消息接受页面信息)
      // 如果预览热更新关闭，则不需要实时预览
      if (isHistory || previewHotReload === false) {
        cleanupCommunicationAction()
      }
      await updatePreview(data)
    }

    const { initCommunication, cleanupCommunication } = usePreviewCommunication({
      onSchemaReceived: onSchemaReceivedAction,
      loadInitialData
    })

    cleanupCommunicationAction = cleanupCommunication

    onMounted(initCommunication)
    onBeforeUnmount(cleanupCommunication)

    return {
      store,
      sfcOptions,
      editorComponent,
      debugSwitch
    }
  }
}
</script>

<style lang="less">
.vue-repl {
  height: 100%;

  .split-pane {
    .left {
      display: none;
    }

    .right {
      width: 100% !important;

      .output-container {
        height: 100%;

        .msg.warn {
          display: none;
        }
      }

      .tab-buttons {
        display: none;
      }
    }
  }
}
.vue-repl-container {
  height: calc(100vh - 48px);
  &.preview-debug-mode .vue-repl .split-pane {
    .left,
    .right .tab-buttons {
      display: block;
    }
    .right .output-container {
      height: calc(100% - 38px);
    }
  }
}
</style>
