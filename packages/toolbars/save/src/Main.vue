<template>
  <div class="toolbar-save">
    <tiny-button class="save-button" @click="openApi">
      <svg-icon :name="icon"></svg-icon>
      <span class="save-title">{{ isLoading ? '保存中' : '保存' }}</span>
      <span @click.stop="state.saveVisible = !state.saveVisible">
        <tiny-popover v-model="state.saveVisible" :visible-arrow="false" width="203" trigger="manual">
          <template #reference>
            <svg-icon :name="iconExpand"></svg-icon>
          </template>
          <div class="save-style">
            <div class="save-setting">保存设置</div>
            <tiny-checkbox v-model="state.checked" name="tiny-checkbox">自动保存</tiny-checkbox>
            <div class="save-time">
              <div>保存间隔</div>
              <tiny-select v-model="state.timeValue" :options="options" :disabled="!state.checked" autocomplete>
              </tiny-select>
            </div>
            <div class="save-button-group">
              <tiny-button @click="cancel">取消</tiny-button>
              <tiny-button type="primary" @click="autoSave">设置并保存</tiny-button>
            </div>
          </div>
        </tiny-popover>
      </span>
    </tiny-button>
  </div>
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
import { reactive, ref, onUnmounted } from 'vue'
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { Button, Popover, DialogBox, Checkbox, Select } from '@opentiny/vue'
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
    TinyDialogBox: DialogBox,
    TinyCheckbox: Checkbox,
    TinySelect: Select
  },
  props: {
    icon: {
      type: String,
      default: 'save'
    },
    iconExpand: {
      type: String,
      default: 'down-arrow'
    }
  },
  setup() {
    const options = [
      { value: 5, label: '5分钟' },
      { value: 10, label: '10分钟' },
      { value: 15, label: '15分钟' }
    ]
    const state = reactive({
      visible: false,
      code: '',
      originalCode: '',
      disabled: false,
      timeValue: 5,
      saveVisible: false,
      checked: false,
      preservationTime: null
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
      language: 'json',
      lineNumbers: true,
      minimap: {
        enabled: false
      }
    }
    const saveSetTimeout = () => {
      clearTimeout(state.preservationTime)
      state.preservationTime = setTimeout(() => {
        openApi()
        saveSetTimeout()
      }, state.timeValue * 60 * 1000)
    }
    const autoSave = () => {
      if (state.checked) {
        saveSetTimeout()
      } else {
        clearTimeout(state.preservationTime)
      }
      state.saveVisible = false
    }

    const cancel = () => {
      state.saveVisible = false
    }

    onUnmounted(() => {
      clearTimeout(state.preservationTime)
    })

    return {
      state,
      editor,
      editorOptions,
      isLoading,
      close,
      openApi,
      saveApi,
      options,
      cancel,
      autoSave
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

.toolbar-save {
  .save-button {
    background-color: var(--ti-lowcode-toolbar-button-bg);
    border: none;
    min-width: 70px;
    height: 26px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-radius: 4px;
    &:not(.disabled):hover {
      background-color: var(--ti-lowcode-toolbar-button-bg);
    }

    .save-title {
      margin: 0 6px;
    }
  }

  :deep(.icon-down-arrow:focus) {
    outline: none;
  }
}

.save-style {
  padding: 14px;
  font-size: 12px;

  .save-button-group {
    text-align: right;

    :deep(.tiny-button) {
      min-width: 40px;
      padding: 0 8px;
      height: 26px;
      line-height: 24px;
      border-radius: 4px;
    }
  }
}

.save-time {
  line-height: 24px;
  font-size: 12px;
  margin: 13px 0 14px 0;
  display: flex;

  .tiny-select {
    width: 103px;
    margin-left: 12px;

    :deep(.tiny-input__suffix) {
      width: 12px;
      top: 12px;
    }
  }
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
