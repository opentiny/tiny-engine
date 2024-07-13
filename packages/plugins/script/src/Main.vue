<template>
  <plugin-panel
    title="页面 JS"
    :fixed-panels="fixedPanels"
    :fixed-name="PLUGIN_NAME.Script"
    @close="$emit('close')"
    class="plugin-page-js-container"
  >
    <template #header>
      <link-button :href="docsUrl" class="head-left"></link-button>
      <tiny-button type="primary" class="save-btn" @click="saveMethods">
        <span>保存</span>
        <span v-show="state.isChanged" class="dots"></span>
      </tiny-button>
    </template>
    <template #content>
      <div class="code-edit-content">
        <monaco-editor
          ref="monaco"
          :value="state.script"
          :options="options"
          @change="change"
          @editorDidMount="editorDidMount"
        ></monaco-editor>
      </div>
    </template>
  </plugin-panel>
</template>

<script>
import { onBeforeUnmount, reactive, provide } from 'vue'
import { Button } from '@opentiny/vue'
import { PluginPanel } from '@opentiny/tiny-engine-common'
import { VueMonaco, CloseIcon, LinkButton } from '@opentiny/tiny-engine-common'
import { useHelp } from '@opentiny/tiny-engine-controller'
import { initCompletion } from '@opentiny/tiny-engine-controller/js/completion'
import { initLinter } from '@opentiny/tiny-engine-controller/js/linter'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import useMethod, { saveMethod, highlightMethod, getMethodNameList, getMethods } from './js/method'
import { useLayout } from '@opentiny/tiny-engine-controller'

export const api = {
  saveMethod,
  highlightMethod,
  getMethodNameList,
  getMethods
}

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyButton: Button,
    CloseIcon,
    LinkButton,
    PluginPanel
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  emits: ['close', 'fix-panel'],
  setup(props, { emit }) {
    const docsUrl = useHelp().getDocsUrl('script')
    const { state, monaco, change, close, saveMethods } = useMethod({ emit })

    const panelState = reactive({
      emitEvent: emit
    })
    provide('panelState', panelState)

    const options = {
      roundedSelection: true,
      automaticLayout: true,
      autoIndent: true,
      language: 'javascript',
      formatOnPaste: true,
      tabSize: 2,
      theme: theme(),
      minimap: {
        enabled: false
      },
      // 禁用滚动条边边一直显示的边框
      overviewRulerBorder: false,
      renderLineHighlightOnlyWhenFocus: true
    }

    const editorDidMount = (editor) => {
      if (!monaco.value) {
        return
      }

      // Lowcode API 提示
      state.completionProvider = initCompletion(monaco.value.getMonaco(), monaco.value.getEditor()?.getModel())

      // 初始化 ESLint worker
      state.linterWorker = initLinter(editor, monaco.value.getMonaco(), state)
    }

    onBeforeUnmount(() => {
      state.completionProvider?.forEach((provider) => {
        provider.dispose()
      })
      // 终止 ESLint worker
      state.linterWorker?.terminate?.()
    })

    const { PLUGIN_NAME } = useLayout()
    return {
      state,
      monaco,
      options,
      close,
      change,
      saveMethods,
      editorDidMount,
      docsUrl,
      PLUGIN_NAME
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-page-js-container {
  width: 50vw;
  height: 100%;
  background: var(--ti-lowcode-plugin-js-bg);
  box-shadow: 6px 0px 3px 0px rgba(0, 0, 0, 0.05);
  z-index: 999;
  box-sizing: border-box;

  .code-edit-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--ti-lowcode-plugin-js-head-border-bottom-color);
    padding: 10px 0;

    .head-left {
      padding-left: 15px;
      display: flex;
      align-items: center;
      .title {
        color: var(--ti-lowcode-plugin-panel-title-color);
        font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
      }

      .help-link {
        display: inline-block;
        margin-left: 20px;
        cursor: pointer;
        color: var(--ti-lowcode-plugin-js-help-link-color);
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .head-right {
      margin-right: 20px;
      display: flex;
      align-items: center;

      .save-btn {
        position: relative;
        overflow: visible;
        margin-right: 12px;
        .dots {
          width: 10px;
          height: 10px;
          background: var(--ti-lowcode-warning-color-1);
          border-radius: 50%;
          position: absolute;
          top: -4px;
          right: -4px;
        }
      }
    }
  }

  .code-edit-content {
    padding: 12px 20px;
    height: calc(100% - 54px);

    & > div {
      border: 1px solid var(--ti-lowcode-code-edit-content-border-color);
      height: 100%;
    }
  }
}
:deep(.help-box) {
  position: absolute;
  left: 65px;
  top: 3px;
}
</style>
