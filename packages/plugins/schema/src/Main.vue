<template>
  <plugin-panel
    id="source-code"
    title="页面 Schema"
    class="plugin-schema"
    :fixed-name="PLUGIN_NAME.Schema"
    :fixedPanels="fixedPanels"
    @close="close"
  >
    <template #header>
      <div class="schema-scroll-switch">
        <tiny-checkbox v-model="enableSchemaScroll" @change="schemaScrollControl"></tiny-checkbox>
        <span>跟随画布</span>
      </div>
      <span class="icon-wrap">
        <i v-show="!showRed" class="red"></i>
        <tiny-button type="primary" @click="saveSchema">保存</tiny-button>
      </span>
      <tiny-popover v-show="false" placement="bottom" trigger="hover" append-to-body content="导入 Schema">
        <template #reference>
          <span class="icon-wrap">
            <icon-download-link></icon-download-link>
          </span>
        </template>
      </tiny-popover>
    </template>

    <template #content>
      <div class="source-code-content">
        <monaco-editor
          ref="container"
          class="code-edit-content"
          :value="state.pageData"
          :options="options"
          @change="editorChange"
          @shortcutSave="saveSchema"
        ></monaco-editor>
      </div>
      <div class="source-code-footer">
        <button>导入 Schema</button>
      </div>
    </template>
  </plugin-panel>
</template>

<script lang="tsx">
/* metaService: engine.plugins.schema.Main */
import { nextTick, reactive, getCurrentInstance, onActivated, ref, onDeactivated, provide, watch } from 'vue'
import type { Component } from 'vue'
import { Popover, Button, Checkbox as TinyCheckbox } from '@opentiny/vue'
import { VueMonaco, PluginPanel } from '@opentiny/tiny-engine-common'
import { useCanvas, useModal, useNotify, useMessage, useLayout } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { iconDownloadLink } from '@opentiny/vue-icon'
import { useThrottleFn } from '@vueuse/core'

const { reactiveObj2String: obj2String, string2Obj } = utils

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyPopover: Popover as Component,
    TinyButton: Button as Component,
    TinyCheckbox: TinyCheckbox as Component,
    PluginPanel,
    IconDownloadLink: iconDownloadLink()
  },
  inheritAttrs: false,
  props: {
    fixedPanels: {
      type: Array
    }
  },
  setup(props, { emit }) {
    const app = getCurrentInstance()
    const { pageState } = useCanvas()
    const { confirm } = useModal()
    const state = reactive({
      pageData: obj2String(pageState.pageSchema)
    })
    const { subscribe, unsubscribe } = useMessage()

    const { PLUGIN_NAME } = useLayout()

    const panelState = reactive({
      emitEvent: emit
    })
    provide('panelState', panelState)

    const isEdit = false
    const showRed = ref(true)

    const enableSchemaScroll = ref(false)
    const isSchemaScrollActive = ref(false)
    const highlightField = ref([])

    const close = () => {
      const strs = app.refs.container.getEditor().getValue()
      const isChanged = state.pageData === strs

      if (!isChanged) {
        confirm({
          title: '提示',
          message: '有改动未保存，您确定关闭吗？',
          exec: () => emit('close')
        })
      } else {
        emit('close')
      }
    }
    const editorChange = (val) => {
      showRed.value = val === obj2String(state.pageData)
    }

    const saveSchema = () => {
      const editorValue = string2Obj(app.refs.container.getEditor().getValue())
      if (!editorValue) {
        // schema 解析不正确，作废此次保存
        useNotify({
          type: 'error',
          title: 'schema 保存失败',
          message: 'schema 解析异常，请确保格式正确'
        })

        return
      }

      // 不允许修改 componentName，因为修改 componentName 等同于修改页面类型
      const value = {
        ...editorValue,
        componentName: pageState.pageSchema.componentName
      }

      const { importSchema, setSaved } = useCanvas()

      importSchema(value)
      setSaved(false)

      // TODO: 历史堆栈
      // useHistory().addHistory()
      state.pageData = ''

      nextTick(() => {
        state.pageData = obj2String(value)
        emit('close')
      })
    }

    const throttleUpdateData = useThrottleFn(
      () => {
        state.pageData = obj2String(pageState.pageSchema)
      },
      100,
      true
    )

    const getCurrentSchemaLine = () => {
      const currentSchema = pageState.currentSchema
      if (state.pageData && currentSchema) {
        // 获取currentSchema的id行到首行的距离
        const currentSchemaString = obj2String(currentSchema)
        const index = currentSchemaString!.indexOf(`"id": "${currentSchema.id}"`)
        const currentSchemaIdLineNumber = currentSchemaString!.substring(0, index).match(/\n/g)?.length
        // 获取页面schema首行到currentSchema的id行的距离
        const currentSchemaIndex = state.pageData.indexOf(`"id": "${currentSchema.id}"`)
        const schemaIdLineNumber = state.pageData.substring(0, currentSchemaIndex).match(/\n/g)?.length
        return schemaIdLineNumber && currentSchemaIdLineNumber
          ? schemaIdLineNumber - currentSchemaIdLineNumber + 1
          : null
      }
      return null
    }

    const clearHighlight = () => {
      highlightField.value = app.refs.container.getEditor().deltaDecorations(highlightField.value, [])
    }

    const highlightFirstLine = () => {
      if (!isSchemaScrollActive.value || !enableSchemaScroll.value) {
        clearHighlight()
        return
      }
      const startLine = getCurrentSchemaLine()
      if (!startLine) {
        return
      }
      const editor = app.refs.container.getEditor()
      const monaco = app.refs.container.getMonaco()
      // 清除上次的高亮行
      clearHighlight()
      highlightField.value = editor.deltaDecorations(highlightField.value, [
        {
          range: new monaco.Range(startLine + 1, 1, startLine + 1, editor.getModel().getLineMaxColumn(startLine + 1)),
          options: {
            inlineClassName: 'current-code-highlight'
          }
        }
      ])
      editor.revealLineInCenter(startLine)
    }

    const schemaScrollControl = () => {
      if (enableSchemaScroll.value) {
        highlightFirstLine()
      } else {
        clearHighlight()
      }
    }

    onActivated(() => {
      state.pageData = obj2String(pageState.pageSchema)
      isSchemaScrollActive.value = true
      nextTick(() => {
        window.dispatchEvent(new Event('resize'))
        showRed.value = state.pageData === app.refs.container.getEditor().getValue()
        // 高亮当前行
        highlightFirstLine()
      })

      subscribe({
        topic: 'schemaChange',
        subscriber: 'schema-plugin',
        callback: throttleUpdateData
      })
    })

    onDeactivated(() => {
      isSchemaScrollActive.value = false
      clearHighlight()
      unsubscribe({
        topic: 'schemaChange',
        subscriber: 'schema-plugin'
      })
    })

    watch(
      () => pageState.currentSchema,
      () => {
        highlightFirstLine()
      }
    )

    return {
      PLUGIN_NAME,
      state,
      isEdit,
      enableSchemaScroll,
      schemaScrollControl,
      saveSchema,
      editorChange,
      close,
      showRed,
      options: {
        language: 'json',
        // readOnly: !pageState.isLock,  暂时放开schema录入功能，等画布功能完善后，再打开此注释
        readOnly: false,
        minimap: {
          enabled: false
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
#source-code {
  border-right: none;
  box-shadow: 6px 0px 3px 0px var(--te-schema-panel-shadow-color);
  z-index: 1000;
  .schema-scroll-switch {
    display: flex;
    align-items: center;
    margin-right: 12px;
    font-weight: normal;
  }

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
      background-color: var(--te-schema-dot-color);
      display: block;
      z-index: 100;
      position: absolute;
      top: -3px;
      right: -1px;
    }
  }

  .source-code-content {
    height: calc(100% - 12px);
    border: 1px solid var(--te-schema-common-border-color);
    border-radius: 4px;
    margin: 0 12px;
  }
  .code-edit-content {
    height: 100%;
  }
  .source-code-footer {
    display: none;
    justify-content: flex-end;
    padding: 12px 0;
    button {
      padding: 12px;
      border: none;
      border-radius: 4px;
      color: var(--te-schema-btn-color);
      background: var(--te-schema-btn-bg-color);
      cursor: pointer;
    }
  }
}
:deep(.current-code-highlight) {
  background: var(--te-common-bg-info);
}
</style>
