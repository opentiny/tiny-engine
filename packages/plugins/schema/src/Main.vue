<template>
  <div id="source-code">
    <div class="source-code-header">
      <div class="title">页面Schema</div>
      <div class="header-title">
        <!-- 暂时放开schema录入功能，等画布功能完善后，再打开下面一行的注释 -->
        <!-- <tiny-popover v-if="isEdit" placement="bottom" trigger="hover" append-to-body content="保存"> -->
        <tiny-popover placement="bottom" trigger="hover" append-to-body content="保存">
          <template #reference>
            <span class="icon-wrap" @click="saveSchema">
              <i v-show="!showRed" class="red"></i>
              <icon-save></icon-save>
            </span>
          </template>
        </tiny-popover>
        <tiny-popover v-show="false" placement="bottom" trigger="hover" append-to-body content="导入 Schema">
          <template #reference>
            <span class="icon-wrap">
              <icon-download-link></icon-download-link>
            </span>
          </template>
        </tiny-popover>
        <close-icon @close="close"></close-icon>
      </div>
    </div>
    <div class="source-code-content">
      <monaco-editor
        ref="container"
        class="code-edit-content"
        :value="state.pageData"
        :options="options"
        @change="editorChange"
      ></monaco-editor>
    </div>
    <div class="source-code-footer">
      <button>导入 Schema</button>
    </div>
  </div>
</template>

<script lang="jsx">
import { nextTick, reactive, getCurrentInstance, onActivated, ref } from 'vue'
import { Popover } from '@opentiny/vue'
import { VueMonaco, CloseIcon } from '@opentiny/tiny-engine-common'
import { useCanvas, useModal, useHistory, useNotify } from '@opentiny/tiny-engine-controller'
import { obj2String, string2Obj, theme } from '@opentiny/tiny-engine-controller/adapter'
import { iconSave, iconDownloadLink } from '@opentiny/vue-icon'

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyPopover: Popover,
    CloseIcon,
    IconSave: iconSave(),
    IconDownloadLink: iconDownloadLink()
  },
  setup(props, { emit }) {
    const app = getCurrentInstance()
    const { pageState } = useCanvas()
    const { confirm } = useModal()
    const state = reactive({
      pageData: obj2String(pageState.pageSchema)
    })

    const isEdit = false
    const showRed = ref(true)

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

      useCanvas().initData(value, pageState.currentPage)
      useHistory().addHistory()
      state.pageData = ''

      nextTick(() => {
        state.pageData = obj2String(value)
        emit('close')
      })
    }

    onActivated(() => {
      pageState.pageSchema = useCanvas().canvasApi.value?.getSchema?.() || {}
      state.pageData = obj2String(pageState.pageSchema)
      nextTick(() => {
        window.dispatchEvent(new Event('resize'))
        showRed.value = state.pageData === app.refs.container.getEditor().getValue()
      })
    })

    return {
      state,
      isEdit,
      saveSchema,
      editorChange,
      close,
      showRed,
      options: {
        roundedSelection: true,
        automaticLayout: true,
        autoIndent: true,
        language: 'json',
        // readOnly: !pageState.isLock,  暂时放开schema录入功能，等画布功能完善后，再打开此注释
        readOnly: false,
        formatOnPaste: true,
        tabSize: 2,
        theme: theme(),
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
  width: 45vw;
  height: calc(100% - var(--base-top-panel-height));
  padding: 12px;
  position: fixed;
  top: var(--base-top-panel-height);
  left: 41px;
  background: var(--ti-lowcode-common-component-bg);
  box-shadow: 2px 2px 6px rgb(0 0 0 / 60%);
  z-index: 1000;
  .source-code-header {
    display: flex;
    justify-content: space-between;
  }
  .title {
    color: var(--ti-lowcode-plugin-panel-title-color);
    font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
  }
  .header-title {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 4px 0 8px 0;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--ti-lowcode-toolbar-border-color);
    .icon-wrap {
      width: 20px;
      height: 20px;
      color: var(--ti-lowcode-text-color);
      font-size: 16px;
      border-radius: 2px;
      cursor: pointer;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      transition: 0.3s;
      position: relative;
      &:hover {
        color: var(--ti-lowcode-toolbar-icon-color);
      }
      .red {
        width: 5px;
        height: 5px;
        border-radius: 3px;
        background-color: #f00;
        display: block;
        z-index: 100;
        position: absolute;
        top: 1px;
        right: 1px;
      }
    }
    & > span:not(:last-child) {
      margin-right: 8px;
    }
  }
  .source-code-content {
    height: calc(100% - 42px);
    border: 1px solid var(--ti-lowcode-toolbar-border-color);
    box-shadow: 0px 0px 4px rgb(0 0 0 / 20%);
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
      color: var(--ti-lowcode-toolbar-icon-color);
      background: var(--ti-lowcode-icon-bind-color);
      cursor: pointer;
    }
  }
}
</style>
