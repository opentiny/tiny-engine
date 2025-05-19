<template>
  <plugin-panel
    title="页面 JS"
    :fixed-name="PLUGIN_NAME.Page"
    :fixedPanels="fixedPanels"
    :docsUrl="docsUrl"
    :docsContent="docsContent"
    :isShowDocsIcon="true"
    @close="$emit('close')"
    class="plugin-page-js-container plugin-script"
  >
    <template #header>
      <span class="icon-wrap">
        <i v-show="state.isChanged" class="red"></i>
        <tiny-button type="primary" @click="saveMethods">保存</tiny-button>
      </span>
    </template>
    <template #content>
      <div class="code-edit-content">
        <monaco-editor
          ref="monaco"
          :value="state.script"
          :options="options"
          @change="change"
          @editorDidMount="editorDidMount"
          @shortcutSave="saveMethods"
        ></monaco-editor>
      </div>
    </template>
  </plugin-panel>
</template>

<script lang="ts">
/* metaService: engine.plugins.pagecontroller.Main */
import { onBeforeUnmount, reactive, provide } from 'vue'
import { Button } from '@opentiny/vue'
import { VueMonaco, PluginPanel } from '@opentiny/tiny-engine-common'
import { useHelp, useLayout } from '@opentiny/tiny-engine-meta-register'
import { initCompletion } from '@opentiny/tiny-engine-common/js/completion'
import { initLinter } from '@opentiny/tiny-engine-common/js/linter'
import useMethod, { saveMethod, highlightMethod, getMethodNameList, getMethods } from './js/method'

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
    PluginPanel
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const docsUrl = useHelp().getDocsUrl('script')
    const docsContent = '同一页面/区块的添加事件会统一保存到对应的页面JS中。'
    const { state, monaco, change, close, saveMethods } = useMethod({ emit })

    const { PLUGIN_NAME } = useLayout()

    const panelState = reactive({
      emitEvent: emit
    })
    provide('panelState', panelState)

    const options = {
      language: 'javascript',
      minimap: {
        enabled: false
      },
      placeholder: `// ✅ 函数声明可以保存
       function topLevelFunction(){ 
      \u200B \u200B const message = 'hello tiny-engine.' 
      \u200B \u200B console.log(message) 
      } \n 
      // ❌ 顶层/常规 变量声明 \n const someVariable = 42 
      // ❌ 表达式 \n const result = someVariable + 10`,

      // 禁用滚动条边边一直显示的边框
      overviewRulerBorder: false,
      renderLineHighlightOnlyWhenFocus: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      autoIndent: 'full',
      newLineCharacter: '\n',
      convertTabsToSpaces: true,
      trimAutoWhitespace: true,
      wordWrap: 'on',
      wordWrapColumn: 120,
      wordWrapMinChars: 10,
      wordWrapStrategy: 'advanced'
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

    return {
      PLUGIN_NAME,
      state,
      monaco,
      options,
      close,
      change,
      saveMethods,
      editorDidMount,
      docsUrl,
      docsContent
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-page-js-container {
  border-right: none;
  box-shadow: 6px 0px 3px 0px var(--te-plugin-js-panel-shadow-color);
  z-index: 999;

  .icon-wrap {
    position: relative;
    margin-right: 6px;

    .tiny-button {
      min-width: 40px;
      margin-right: 2px;
      height: 24px;
      line-height: 24px;
    }

    .red {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--te-plugin-js-dot-color);
      display: block;
      z-index: 100;
      position: absolute;
      top: -3px;
      right: -1px;
    }
  }

  .code-edit-content {
    padding: 0 12px;
    height: calc(100% - 12px);

    & > div {
      border: 1px solid var(--te-plugin-js-common-border-color);
      border-radius: 4px;
      height: 100%;
    }
  }
}

:deep(.help-box) {
  height: auto;
  #help-icon {
    margin-left: 5px;
  }
}

:deep(.monaco-editor .editorPlaceholder) {
  font-size: 12px !important;
}
</style>
