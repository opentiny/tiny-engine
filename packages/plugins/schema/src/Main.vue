<template>
  <div id="source-code">
    <div class="source-code-header">
      <div class="title">页面Schema</div>
      <div class="header-title">
        <!-- 暂时放开schema录入功能，等画布功能完善后，再打开下面一行的注释 -->
        <!-- <tiny-popover v-if="isEdit" placement="bottom" trigger="hover" append-to-body content="保存"> -->
        <span class="icon-wrap" @click="saveSchema">
          <i v-show="!showRed" class="red"></i>
          <tiny-button type="primary">保存</tiny-button>
        </span>
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
import { nextTick, reactive, getCurrentInstance, onActivated, ref, onDeactivated } from 'vue'
import { Popover, Button } from '@opentiny/vue'
import { VueMonaco, CloseIcon } from '@opentiny/tiny-engine-common'
import { useCanvas, useModal, useNotify, useMessage } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { iconDownloadLink } from '@opentiny/vue-icon'
import { useThrottleFn } from '@vueuse/core'

const { reactiveObj2String: obj2String, string2Obj } = utils

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyPopover: Popover,
    TinyButton: Button,
    CloseIcon,
    IconDownloadLink: iconDownloadLink()
  },
  setup(props, { emit }) {
    const app = getCurrentInstance()
    const { pageState } = useCanvas()
    const { confirm } = useModal()
    const state = reactive({
      pageData: obj2String(pageState.pageSchema)
    })
    const { subscribe, unsubscribe } = useMessage()

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

    onActivated(() => {
      state.pageData = obj2String(pageState.pageSchema)
      nextTick(() => {
        window.dispatchEvent(new Event('resize'))
        showRed.value = state.pageData === app.refs.container.getEditor().getValue()
      })

      subscribe({
        topic: 'schemaChange',
        subscriber: 'schema-plugin',
        callback: throttleUpdateData
      })
    })

    onDeactivated(() => {
      unsubscribe({
        topic: 'schemaChange',
        subscriber: 'schema-plugin'
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
  width: 50vw;
  height: calc(100% - var(--base-top-panel-height));
  padding: 12px 0;
  position: fixed;
  top: var(--base-top-panel-height);
  left: 41px;
  background: var(--te-schema-panel-bg-color);
  box-shadow: 6px 0px 3px 0px var(--te-schema-panel-shadow-color);
  z-index: 1000;
  .source-code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--te-schema-common-border-color);
    margin-bottom: 12px;
    padding: 0 12px 12px;
  }
  .title {
    color: var(--te-schema-panel-title-text-color);
    font-weight: var(--te-base-font-weight-bold);
  }
  .header-title {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    .icon-wrap {
      position: relative;
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
        right: -4px;
      }
    }
    & > span:not(:last-child) {
      margin-right: 8px;
    }
  }
  .source-code-content {
    height: calc(100% - 42px);
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
</style>
