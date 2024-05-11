<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    :content="isLoading ? '保存中' : '保存'"
  >
    <template #reference>
      <span :id="`${isLoading ? 'saving' : ''}`" class="icon" @click="openApi">
        <span v-show="!isSaved()" class="dots"></span>
        <svg-icon :name="icon"></svg-icon>
      </span>
    </template>
  </tiny-popover>
  <tiny-dialog-box
    class="dialog-box"
    :modal="false"
    :fullscreen="true"
    :append-to-body="true"
    :visible="state.visible"
    title="Schema 本地与线上差异"
    @update:visible="state.visible = $event"
  >
    <vue-monaco
      v-if="state.visible"
      ref="editor"
      class="monaco-editor"
      :diffEditor="true"
      :options="editorOptions"
      :value="state.code"
      :original="state.originalCode"
    ></vue-monaco>
    <template #footer>
      <tiny-button @click="close">取 消</tiny-button>
      <tiny-button type="primary" @click="saveApi">保 存</tiny-button>
    </template>
  </tiny-dialog-box>
</template>

<script>
import { reactive, ref, onBeforeMount } from 'vue'
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { Button, Popover, DialogBox } from '@opentiny/vue'
import { useCanvas } from '@opentiny/tiny-engine-controller'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import { openCommon, saveCommon } from './js/index'
import { isLoading } from './js/index'
export const api = {
  saveCommon,
  openCommon
}
export default {
  components: {
    VueMonaco,
    TinyButton: Button,
    TinyPopover: Popover,
    TinyDialogBox: DialogBox
  },
  props: {
    icon: {
      type: String,
      default: 'save'
    }
  },
  setup() {
    // 获取当前页面的全量信息
    const { isSaved } = useCanvas()

    const state = reactive({
      visible: false,
      code: '',
      originalCode: '',
      disabled: false,
      timer: null
    })

    const editor = ref(null)

    const close = () => {
      state.visible = false
      state.originalCode = ''
    }
    const openApi = () => {
      if (!isLoading.value) {
        openCommon()
      }
    }
    const saveApi = () => {
      saveCommon()
    }
    // 保存或新建区块
    const editorOptions = {
      theme: theme(),
      tabSize: 2,
      language: 'json',
      autoIndent: true,
      lineNumbers: true,
      formatOnPaste: true,
      automaticLayout: true,
      roundedSelection: true,
      minimap: {
        enabled: false
      }
    }

    onBeforeMount(() => {
      clearTimeout(state.timer)
    })

    return {
      state,
      editor,
      editorOptions,
      isLoading,
      close,
      isSaved,
      openApi,
      saveApi
    }
  }
}
</script>

<style lang="less" scoped>
.dots {
  width: 6px;
  height: 6px;
  background: var(--ti-lowcode-toolbar-dot-color);
  border-radius: 50%;
  display: inline-block;
  position: absolute;
  top: 4px;
  right: 3px;
  z-index: 100;
}
#saving {
  cursor: not-allowed;
  color: var(--ti-lowcode-disabled-color);
  :deep(svg) {
    color: var(--ti-lowcode-disabled-color);
  }
}

.dialog-box {
  :deep(.tiny-dialog-box) {
    display: flex;
    flex-direction: column;

    .tiny-dialog-box__body {
      flex: 1;
    }
  }

  .monaco-editor {
    width: 100%;
    height: 100%;
  }
}
</style>

<style>
.changeRole a {
  color: var(--ti-lowcode-canvas-handle-hover-bg);
  padding: 0 5px;
}
</style>
