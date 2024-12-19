<template>
  <div class="editorWarp">
    <tiny-button @click="open">{{ buttonText }}</tiny-button>
    <teleport to="body">
      <div v-if="editorState.show" class="source-code">
        <div class="source-code-header">
          <span class="header-text">{{ title }}</span>
          <span class="icon-wrap">
            <icon-close class="header-icon" @click="close"></icon-close>
          </span>
        </div>
        <tiny-tabs v-model="editorMode" tab-style="card" style="height: 650px" @click="tabClick">
          <tiny-tab-item title="monaco编辑" name="monaco" style="height: 650px">
            <monaco-editor ref="editor" class="source-code-content" :value="value" :options="options"></monaco-editor>
            <div class="source-code-footer">
              <tiny-button @click="close">关闭</tiny-button>
              <tiny-button type="info" @click="save">保存</tiny-button>
            </div>
          </tiny-tab-item>
          <tiny-tab-item title="列编辑" name="column">
            <div>
              <tiny-button-group
                v-model="editorState.checkedVal"
                :data="editorState.groupData"
                @click="changeColumnConfig"
              ></tiny-button-group>
            </div>
            <div class="column-config-list">
              <div v-for="(item, index) in editorState.columnData" :key="index" class="config-list-item">
                <label>{{ item.title }}</label>
                <component :is="editorState.components[item.component]" v-model="item.value" :options="item.options" />
                <div></div>
              </div>
            </div>
          </tiny-tab-item>
        </tiny-tabs>
      </div>
    </teleport>
  </div>
</template>

<script>
import { getCurrentInstance, reactive, ref, watchEffect } from 'vue'
import { Button, Tabs, TabItem, Input, ButtonGroup, Switch, Select } from '@opentiny/vue'
import { IconClose } from '@opentiny/vue-icon'
import { VueMonaco } from '@opentiny/tiny-engine-common'

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyButton: Button,
    IconClose: IconClose(),
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    TinyInput: Input,
    TinyButtonGroup: ButtonGroup
  },
  props: {
    buttonText: {
      type: String,
      default: '编辑代码'
    },
    modelValue: {
      type: [String, Object, Array],
      default: ''
    },
    title: String,
    language: {
      type: String,
      default: 'javascript'
    },
    single: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save'],
  setup(props, { emit }) {
    const editorState = reactive({
      show: false,
      created: false,
      groupData: [
        { text: '商品编号', value: '商品编号' },
        { text: '项目名称', value: '项目名称' },
        { text: '生命状态', value: '生命状态' },
        { text: '流程状态', value: '流程状态' },
        { text: '客户名称', value: '客户名称' },
        { text: '客户账户', value: '客户账户' },
        { text: '产业目录', value: '产业目录' },
        { text: '伙伴名称', value: '伙伴名称' }
      ],
      checkedVal: '商品编号',
      columnData: [
        {
          title: '列表题',
          component: 'input',
          value: '商品编号'
        },
        {
          title: '开启搜索',
          component: 'switch',
          value: false
        },
        {
          title: '开启排序',
          component: 'switch',
          value: false
        },
        {
          title: '隐藏',
          component: 'switch',
          value: false
        },
        {
          title: '显示位置',
          component: 'select',
          value: 'left',
          options: [
            {
              label: 'left',
              value: 'left'
            },
            {
              label: 'right',
              value: 'right'
            }
          ]
        }
      ],
      components: { input: Input, switch: Switch, select: Select }
    })

    const value = ref('')

    watchEffect(() => {
      value.value = typeof props.modelValue === 'string' ? props.modelValue : JSON.stringify(props.modelValue, null, 2)
    })

    // 关闭编辑器
    const close = () => {
      editorState.show = false
      emit('close')
    }

    // 打开编辑器
    const open = () => {
      if (!editorState.created) {
        editorState.created = true
      }

      editorState.show = true
    }

    // 保存编辑器内容
    const app = getCurrentInstance()
    const save = () => {
      const content = app.refs.editor.getEditor().getValue()
      emit('save', { content })

      if (!props.single) {
        const value = typeof props.modelValue === 'string' ? content : JSON.parse(content)
        emit('update:modelValue', value)
      }

      close()
    }

    const editorMode = ref('monaco')

    const tabClick = (e) => {
      editorMode.value = e.name
    }

    return {
      save,
      close,
      open,
      tabClick,
      confirm,
      editorState,
      value,
      editorMode,
      options: {
        language: props.language,
        minimap: {
          enabled: false
        }
      },
      changeColumnConfig: (e) => {
        const value = e.target.textContent
        editorState.columnData[0].value = value
      }
    }
  }
}
</script>

<style lang="less" scoped>
.mt10 {
  margin-top: 10px;
}
.source-code {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 9999;
  width: 50vw;
  height: 90vh;
  padding: 0 16px;
  margin: auto;
  border-radius: 4px;
  border: 1px solid var(--ti-lowcode-tabs-border-color);
  background-color: var(--ti-lowcode-toolbar-bg);
  box-shadow: rgb(0 0 0 / 30%) 0px 1px 15px 0px;

  .source-code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    color: var(--te-common-text-secondary);

    .header-title {
      font-size: 14px;
    }

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
      &:hover {
        color: var(--ti-lowcode-toolbar-icon-color);
        background: var(--ti-lowcode-icon-hover-bg);
      }
    }
  }

  .source-code-content {
    height: calc(100% - 86px);
    box-shadow: 0px 0px 4px rgb(0 0 0 / 20%);
  }

  .source-code-footer {
    display: flex;
    justify-content: flex-end;
    padding: 10px 0;
  }

  .dataList {
    flex-grow: 1;
    .table-title,
    .table-list {
      align-items: center;
      display: grid;
      grid-template-columns: 2fr 3fr 3fr 1fr;
      padding-left: 4px;
      padding-right: 12px;
      position: relative;
      color: var(--ti-lowcode-toolbar-more-hover-color);
      height: 38px;
      border-bottom: 1px solid var(--ti-lowcode-tabs-border-color);
      box-shadow: var(--ti-lowcode-tabs-border-color) 0, -1px;
      font-size: 13px;
      font-weight: 600;
    }
    .table-list {
      div {
        font-size: 10px;
        font-weight: normal;
        color: rbg(217, 217, 217);
      }
      &:hover {
        background: var(--ti-lowcode-toolbar-bg);
      }
    }
  }

  .column-config-list {
    padding: 10px;
    .config-list-item {
      display: grid;
      grid-template-columns: 80px auto 6fr;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
  }
}
</style>
