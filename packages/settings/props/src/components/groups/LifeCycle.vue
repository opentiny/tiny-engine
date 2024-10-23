<template>
  <div class="popover-head">
    <span>生命周期</span>
    <tiny-popover v-model="showPopover" placement="bottom-start" trigger="hover">
      <template #reference>
        <icon-add class="add-life-cycle"></icon-add>
      </template>
      <div class="popover-list">
        <ul>
          <li v-for="(item, index) in state.lifeCycles" :key="index" @click="openDialog(item)">
            <div>{{ item }}</div>
          </li>
        </ul>
      </div>
    </tiny-popover>
  </div>

  <ul class="bind-life-cycle-list">
    <li v-for="(value, name, index) in state.bindLifeCycles" :key="index" class="life-cycle-item">
      <div>
        <tiny-tooltip class="item" effect="dark" content="编辑" placement="top">
          <icon-setting class="icon" @click="openDialog(name)"></icon-setting>
        </tiny-tooltip>
        <tiny-tooltip class="item" effect="dark" content="删除" placement="top">
          <icon-del class="icon" @click="confirmClick(name)"></icon-del>
        </tiny-tooltip>
      </div>
      <div>{{ name }}</div>
    </li>
  </ul>

  <tiny-dialog-box :visible="state.showDialog" :title="state.title" width="48%" :append-to-body="true"
    @update:visible="state.showDialog = $event" @close="cancel" @opened="open">
    <div class="dialog-content">
      <div class="dialog-content-left">
        <tiny-search v-model="value" placeholder="搜索" @update:modelValue="search"></tiny-search>
        <ul class="life-cycle-list">
          <li v-for="(item, index) in state.lifeCycles" :key="index" @click="openDialog(item)">
            <div class="life-cycle-name">
              <icon-yes v-if="item === state.title" class="life-cycle-selected"></icon-yes>
              <span>{{ item }}</span>
            </div>
          </li>
        </ul>
      </div>
      <div class="dialog-content-right">
        <monaco-editor v-if="state.showEditor" ref="editor" style="height: 100%" :options="state.options"
          :value="state.editorValue" />
      </div>
    </div>

    <template #footer>
      <div class="bind-dialog-footer">
        <tiny-button @click="cancel">取 消</tiny-button>
        <tiny-button type="info" @click="confirm">确 定</tiny-button>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script lang="jsx">
import { getCurrentInstance, reactive, toRefs } from 'vue'
import { Button, DialogBox, Modal, Popover, Search, Tooltip } from '@opentiny/vue'
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { useCanvas, getGlobalConfig } from '@opentiny/tiny-engine-controller'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import { iconAdd, IconDel, iconSetting, iconYes } from '@opentiny/vue-icon'

export default {
  components: {
    IconDel: IconDel(),
    IconSetting: iconSetting(),
    IconAdd: iconAdd(),
    IconYes: iconYes(),
    TinyTooltip: Tooltip,
    TinyPopover: Popover,
    TinyDialogBox: DialogBox,
    TinySearch: Search,
    TinyButton: Button,
    MonacoEditor: VueMonaco
  },

  setup() {
    const instance = getCurrentInstance()
    const SvgIcon = instance.appContext.components.SvgIcon
    const { pageState } = useCanvas()

    const state = reactive({
      showPopover: true,
      showDialog: false,
      title: '',
      showEditor: false,
      lifeCycles: getGlobalConfig()?.lifeCyclesOptions[getGlobalConfig()?.dslMode],
      bindLifeCycles: pageState.pageSchema?.lifeCycles || {},
      options: {
        roundedSelection: true,
        automaticLayout: true,
        autoIndent: true,
        language: 'javascript',
        formatOnPaste: true,
        tabSize: 2,
        theme: theme()
      },
      editorValue: '{}'
    })

    const search = (value) => {
      if (!value) {
        state.lifeCycles = getGlobalConfig()?.lifeCyclesOptions[getGlobalConfig()?.dslMode]
        return
      }

      state.lifeCycles = state.lifeCycles.filter((item) => item.indexOf(value) > -1)
    }

    const openDialog = (item) => {
      state.title = item
      state.editorValue =
        (state.bindLifeCycles[state.title] && state.bindLifeCycles[state.title].source) ||
        `${state.title} (() => {}, [])`
      state.showDialog = true
    }

    const del = (name) => {
      delete state.bindLifeCycles[name]
    }

    const confirmClick = (name) => {
      Modal.confirm({
        title: '提示',
        message: () => {
          return [
            <div class="modal-content">
              {
                <div class="wrap">
                  <SvgIcon name="warning"></SvgIcon>
                  <span>{`您确定要删除 ${name} 吗？`}</span>
                </div>
              }
            </div>
          ]
        }
      }).then((res) => {
        if (res === 'confirm') {
          del(name)
        }
      })
    }

    const open = () => {
      state.showEditor = true
    }

    const cancel = () => {
      state.showDialog = false
      state.showEditor = false
    }

    const confirm = () => {
      const editorValue = instance.refs.editor.getEditor().getValue()
      const value = {
        type: 'js',
        source: editorValue
      }

      if (!pageState.pageSchema.lifeCycles) {
        pageState.pageSchema.lifeCycles = {}
      }

      pageState.pageSchema.lifeCycles[state.title] = value
      state.showDialog = false
      state.showEditor = false
    }

    return {
      state,
      search,
      openDialog,
      confirmClick,
      cancel,
      confirm,
      open,
      ...toRefs(state)
    }
  }
}
</script>

<style lang="less" scoped>
.popover-head {
  display: flex;
  justify-content: space-between;

  svg {
    color: var(--ti-lowcode-toolbar-icon-color);
    outline: none;
  }
}

.add-life-cycle {
  cursor: pointer;
}

.popover-list {
  li {
    padding: 4px 12px;

    &:hover {
      background: var(--ti-lowcode-canvas-wrap-bg);
      cursor: pointer;
    }
  }
}

.bind-life-cycle-list {
  margin-top: 12px;

  .life-cycle-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    cursor: pointer;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);

    svg {
      color: var(--ti-lowcode-toolbar-breadcrumb-color);
    }

    .icon {
      margin-right: 8px;

      &:hover {
        cursor: pointer;
      }
    }

    &:hover {
      background: var(--ti-lowcode-canvas-wrap-bg);
    }
  }
}

.dialog-content {
  display: flex;

  .dialog-content-left {
    width: 180px;
    margin-right: 12px;

    .life-cycle-list {
      border: 1px solid var(--ti-lowcode-collapse-active-border-color);
      box-shadow: 0 -1px 4px 0 rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      height: 320px;
      margin-top: 8px;
      overflow: auto;
    }

    .life-cycle-name {
      padding: 8px 12px 8px 30px;
      cursor: pointer;
      position: relative;
      transition: 0.3s;

      .life-cycle-selected {
        font-size: 14px;
        color: var(--ti-lowcode-toolbar-icon-color);
        opacity: 0.8;
        position: absolute;
        top: 50%;
        left: 12px;
        transform: translateY(-50%);
      }

      &:hover {
        color: var(--ti-lowcode-toolbar-icon-color);
        background: var(--ti-lowcode-canvas-wrap-bg);

        .life-cycle-selected {
          opacity: 1;
        }
      }
    }
  }

  .dialog-content-right {
    flex: 1 1 0;
  }
}

.bind-dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
