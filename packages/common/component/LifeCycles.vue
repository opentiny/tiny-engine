<template>
  <tiny-alert type="info" :description="lifeCycleTips" :closable="false" class="life-cycle-alert"></tiny-alert>
  <div class="life-cycle">
    <tiny-popover v-model="state.showPopover" placement="bottom-end" trigger="hover" popperClass="option-popper">
      <template #reference>
        <div class="add-life-cycle-wrap">
          <svg-icon name="plus-circle"></svg-icon>
          <p class="desc">添加页面生命周期</p>
        </div>
      </template>
      <div class="popover-list">
        <ul>
          <li
            v-for="(item, index) in state.lifeCycles"
            :key="index"
            :class="{ existed: state.bindLifeCycles.hasOwnProperty(item) }"
            @click="openLifeCyclesPanel(item)"
          >
            <div>{{ item }}</div>
          </li>
        </ul>
      </div>
    </tiny-popover>
  </div>
  <meta-list-items :optionsList="Object.keys(state.bindLifeCycles)" :draggable="false">
    <template #content="{ data }">
      <div>
        {{ data }}
      </div>
    </template>
    <template #operate="{ data }">
      <svg-button name="setting-outline" tips="编辑" placement="top" @click="openLifeCyclesPanel(data)"></svg-button>
      <svg-button name="delete" tips="删除" placement="top" @click="deleteLifeCycle(data)"></svg-button>
    </template>
  </meta-list-items>
  <tiny-dialog-box v-model:visible="state.showLifeCyclesDialog" fullscreen :title="state.title" :append-to-body="true">
    <div v-if="state.showLifeCyclesDialog" class="dialog-content">
      <div class="dialog-content-left">
        <tiny-search placeholder="搜索" @update:modelValue="searchLifeCyclesList"></tiny-search>
        <ul class="life-cycle-list">
          <li v-for="(item, index) in state.lifeCycles" :key="index" @click="openLifeCyclesPanel(item)">
            <div class="life-cycle-name" :class="{ 'life-cycle-selected': item === state.title }">
              {{ item }}
              <icon-yes v-if="item === state.title" class="life-cycle-selected__icon"></icon-yes>
            </div>
          </li>
        </ul>
      </div>
      <div class="dialog-content-right">
        <monaco-editor
          ref="editorRef"
          class="life-cycle-editor"
          :options="{
            roundedSelection: true,
            automaticLayout: true,
            autoIndent: true,
            language: 'javascript',
            formatOnPaste: true,
            tabSize: 2,
            theme: theme()
          }"
          :value="state.editorValue"
          @change="handleEditorChange"
          @editorDidMount="editorDidMount"
        />
      </div>
    </div>

    <template #footer>
      <div class="bind-dialog-footer">
        <tiny-button @click="state.showLifeCyclesDialog = false">取 消</tiny-button>
        <tiny-button type="info" @click="editorConfirm">确 定</tiny-button>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script lang="jsx">
import { reactive, ref, watchEffect, onBeforeUnmount } from 'vue'
import { Button, DialogBox, Popover, Search, Alert } from '@opentiny/vue'
import { getGlobalConfig, useModal, usePage, useNotify, useCanvas } from '@opentiny/tiny-engine-controller'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import MetaListItems from './MetaListItems.vue'
import { iconYes } from '@opentiny/vue-icon'
import VueMonaco from './VueMonaco.vue'
import { initCompletion } from '@opentiny/tiny-engine-controller/js/completion'
import { initLinter, lint } from '@opentiny/tiny-engine-controller/js/linter'
import { SvgButton } from '../index'

export default {
  components: {
    TinyPopover: Popover,
    TinyDialogBox: DialogBox,
    TinySearch: Search,
    TinyButton: Button,
    MonacoEditor: VueMonaco,
    SvgButton,
    TinyAlert: Alert,
    MetaListItems,
    IconYes: iconYes()
  },

  props: {
    bindLifeCycles: Object,
    isPage: {
      type: Boolean,
      default: true
    }
  },
  emits: ['updatePageLifeCycles', 'bind'],
  setup(props, { emit }) {
    const { confirm } = useModal()
    const { getPageContent } = usePage()

    const lifeCycles = getGlobalConfig()?.lifeCyclesOptions[getGlobalConfig()?.dslMode]

    const lifeCycleTips = getGlobalConfig()?.lifeCycleTips[getGlobalConfig()?.dslMode]

    const state = reactive({
      showPopover: true,
      showLifeCyclesDialog: false,
      title: '',
      lifeCycles,
      bindLifeCycles: {},
      editorValue: '{}',
      hasError: false,
      linterWorker: null,
      completionProvider: null
    })

    watchEffect(() => {
      state.bindLifeCycles = props.bindLifeCycles || useCanvas().canvasApi.value?.getSchema()?.lifeCycles || {}
    })

    const searchLifeCyclesList = (value) => {
      if (!value) {
        state.lifeCycles = lifeCycles
        return
      }
      state.lifeCycles = lifeCycles.filter((item) => item?.toLowerCase().indexOf(value.toLowerCase()) > -1)
    }

    const syncLifeCycle = () => {
      const currentSchema = useCanvas().canvasApi.value?.getSchema?.()
      const pageContent = getPageContent()
      const { id, fileName } = pageContent
      if (id === currentSchema.id || fileName === currentSchema.fileName) {
        currentSchema.lifeCycles = state.bindLifeCycles
      }
    }

    const deleteLifeCycle = (name) => {
      confirm({
        title: '提示',
        message: `您确定要删除 ${name} 吗？`,
        exec: () => {
          delete state.bindLifeCycles[name]
          syncLifeCycle()
        }
      })
    }

    const editorRef = ref(null)

    const openLifeCyclesPanel = (item) => {
      state.title = item
      const bindLifeCycleSource =
        props.bindLifeCycles?.[item] || useCanvas().canvasApi.value?.getSchema?.()?.lifeCycles?.[item]
      state.editorValue =
        bindLifeCycleSource?.value ||
        `function ${item} (${item === 'setup' ? '{ props, state, watch, onMounted }' : ''}) {} `
      state.showLifeCyclesDialog = true
      setTimeout(() => {
        editorRef.value.getEditor().trigger('anyString', 'editor.action.formatDocument')
      })
    }

    const editorConfirm = () => {
      if (state.hasError) {
        useNotify({
          type: 'error',
          message: '代码静态检查有错误，请先修改后再保存'
        })

        return
      }

      const editorValue = editorRef.value.getEditor().getValue()
      const value = {
        type: 'JSFunction',
        value: editorValue
      }

      if (!state.bindLifeCycles) {
        state.bindLifeCycles = {}
      }

      state.bindLifeCycles[state.title] = value
      state.showLifeCyclesDialog = false
      syncLifeCycle()

      if (!props.isPage) {
        emit('bind', state.bindLifeCycles)
      } else {
        emit('updatePageLifeCycles', state.bindLifeCycles)
      }
    }

    const editorDidMount = (editor) => {
      if (!editorRef.value) {
        return
      }
      // Lowcode API 提示
      state.completionProvider = initCompletion(editorRef.value.getMonaco(), editorRef.value.getEditor()?.getModel())

      // 初始化 ESLint worker
      state.linterWorker = initLinter(editor, editorRef.value.getMonaco(), state)
    }

    const handleEditorChange = () => {
      if (!editorRef.value) {
        return
      }
      // 用户在线编辑代码内容变化时，发起 ESLint 静态检查
      const monacoModel = editorRef.value.getEditor().getModel()
      lint(monacoModel, state.linterWorker)
    }

    onBeforeUnmount(() => {
      state.completionProvider?.forEach?.((provider) => {
        provider.dispose()
      })
      // 终止 ESLint worker
      state.linterWorker?.terminate?.()
    })

    return {
      state,
      lifeCycleTips,
      editorRef,
      searchLifeCyclesList,
      openLifeCyclesPanel,
      deleteLifeCycle,
      editorConfirm,
      theme,
      editorDidMount,
      handleEditorChange
    }
  }
}
</script>

<style lang="less" scoped>
.life-cycle {
  display: flex; // 决定了鼠标移入后的弹窗位置
  padding: 10px;
  margin-top: -10px;
  svg {
    outline: none;
  }
}
.popover-list {
  ul li:first-child {
    margin-top: 8px;
  }
  ul li:last-child {
    margin-bottom: 8px;
  }
}
.life-cycle-alert {
  color: var(--ti-lowcode-life-cycle-alert-color);
  margin-left: 20px;
  margin-right: 20px;
}
.add-life-cycle-wrap {
  display: flex;
  font-size: 16px;
  margin-left: 10px;
  align-items: center;
  .desc {
    margin: 0;
    margin-left: 8px;
  }
}

.popover-list {
  li {
    padding: 8px 30px 8px 16px;
    cursor: pointer;
    &:hover {
      background: var(--ti-lowcode-life-cycle-item-hover-bg);
    }
  }
  .existed {
    cursor: not-allowed;
    pointer-events: none;
    color: var(--ti-lowcode-life-cycle-item-disable-color);
  }
}

:deep(.tiny-dialog-box__body) {
  height: calc(100vh - 150px);
}

.dialog-content {
  display: flex;
  height: 100%;
  .dialog-content-left {
    width: 200px;
    margin-right: 20px;

    .life-cycle-list {
      border-radius: 4px;
      max-height: 500px;
      margin-top: 8px;
      overflow: auto;
    }

    .life-cycle-name {
      padding: 8px 12px 8px 30px;
      cursor: pointer;
      position: relative;
      transition: 0.3s;

      &.life-cycle-selected {
        background: var(--ti-lowcode-life-cycle-item-hover-bg);
      }

      .life-cycle-selected__icon {
        font-size: 16px;
        position: absolute;
        top: 50%;
        left: 12px;
        transform: translateY(-50%);
      }

      &:hover {
        background: var(--ti-lowcode-life-cycle-item-hover-bg);
      }
    }
  }

  .dialog-content-right {
    flex: 1;
    .life-cycle-editor {
      border: 1px solid var(--ti-lowcode-life-cycle-editor-border);
      height: 100%;
      box-sizing: border-box;
    }
  }
}

.bind-dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
}
</style>
