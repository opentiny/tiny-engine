<template>
  <div class="toolbar-save">
    <toolbar-base
      :content="isLoading ? '保存中' : '保存'"
      :icon="options.icon.default || options.icon"
      :options="{ ...options, showDots: !isSaved() }"
      @click-api="openApi"
    >
      <template #button>
        <tiny-popover :visible-arrow="false" width="203" trigger="click" :open-delay="OPEN_DELAY.Default">
          <template #reference>
            <svg-icon :name="iconExpand"></svg-icon>
          </template>
          <div class="save-style">
            <div class="save-setting">保存设置</div>
            <tiny-checkbox v-model="state.checked" name="tiny-checkbox">自动保存</tiny-checkbox>
            <div class="save-time">
              <div class="save-time-label">保存间隔</div>
              <tiny-select v-model="state.timeValue" :options="delayOptions" :disabled="!state.checked" autocomplete>
              </tiny-select>
            </div>
            <div class="save-button-group">
              <tiny-button type="primary" @click="saveConfig">设置并保存</tiny-button>
            </div>
          </div>
        </tiny-popover>
      </template>
      <template #default>
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
    </toolbar-base>
  </div>
</template>

<script>
import { reactive, ref, onUnmounted, onMounted } from 'vue'
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { Button, Popover, DialogBox, Checkbox, Select } from '@opentiny/vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { openCommon, saveCommon } from './js/index'
import { isLoading, setAutoSaveStatus, getAutoSaveStatus } from './js/index'
import { constants } from '@opentiny/tiny-engine-utils'
const { OPEN_DELAY } = constants

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
    TinySelect: Select,
    ToolbarBase
  },
  props: {
    iconExpand: {
      type: String,
      default: 'down-arrow'
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const { isSaved } = useCanvas()

    const delayOptions = [
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
    const saveConfig = () => {
      setAutoSaveStatus(state.checked)
      if (state.checked) {
        saveSetTimeout()
      } else {
        clearTimeout(state.preservationTime)
      }
    }

    onMounted(() => {
      state.checked = getAutoSaveStatus()
      if (state.checked) {
        saveSetTimeout()
      }
    })

    onUnmounted(() => {
      clearTimeout(state.preservationTime)
    })

    return {
      state,
      editor,
      editorOptions,
      isLoading,
      isSaved,
      close,
      openApi,
      saveApi,
      delayOptions,
      saveConfig,
      OPEN_DELAY
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
  .icon-down-arrow.icon-down-arrow {
    margin-left: var(--te-base-space-2x);
    margin-right: var(--te-base-space-0);
  }
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
  }

  :deep(.icon-down-arrow:focus) {
    outline: none;
  }
}

.save-style {
  padding: 8px 4px;
  font-size: 12px;

  .save-setting {
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    height: 20px;
    margin-bottom: 16px;
  }

  .save-time {
    line-height: 24px;
    font-size: 12px;
    margin: 12px 0 16px 0;
    display: flex;
    .save-time-label {
      width: 60px;
      color: var(--te-common-text-secondary);
    }

    .tiny-select {
      width: 103px;
      margin-left: 12px;

      :deep(.tiny-input__suffix) {
        width: 12px;
      }
    }
  }

  .save-button-group {
    text-align: right;
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
.save-style .save-time .tiny-input__inner {
  height: 24px !important;
}
</style>
