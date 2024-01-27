<template>
  <div v-if="isPanelShow" class="data-source-right-panel">
    <div class="right-head">
      <span>{{ dataSourceTitle }}</span>
      <span class="btn">
        <tiny-button @click="cancel">取消</tiny-button>
        <tiny-button type="info" @click="confirm">保存</tiny-button>
      </span>
    </div>
    <create-variable
      v-if="activeId === 'VALUE'"
      ref="variableRef"
      :createData="state.createData"
      :errorMessage="errorMessage"
    />
    <create-remote
      v-else
      ref="remoteRef"
      :createData="createData"
      :errorMessage="errorMessage"
      :isFitShow="isFitShow"
      :isFetchShow="isFetchShow"
      @addFunction="addFunction"
      @removeFunction="removeFunction"
    />
  </div>
</template>

<script>
import { reactive, toRefs, getCurrentInstance } from 'vue'
import { Button } from '@opentiny/vue'
import CreateRemote from './CreateRemoteAPI.vue'
import CreateVariable from './CreateVariable.vue'

export default {
  components: {
    TinyButton: Button,
    CreateRemote,
    CreateVariable
  },
  props: {
    // 面板是否显示
    isPanelShow: {
      type: Boolean
    },
    // 面板的标题： 添加数据源 / 修改数据源
    dataSourceTitle: {
      type: String,
      default: '添加数据源'
    },
    // 显示模式：变量/远程API形式
    activeId: {
      type: String
    },
    // 远程数据源需要的配置数据
    createData: {
      type: Object
    },
    isFitShow: {
      type: Boolean,
      default: false
    },
    isFetchShow: {
      type: Boolean,
      default: false
    },
    addFunction: {
      type: Function
    },
    removeFunction: {
      type: Function
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const app = getCurrentInstance()
    const state = reactive({ ...props })
    const cancel = () => {
      emit('cancel')
    }
    const confirm = () => {
      const { getFetchEditor, getFitEditor, getParamsEditor } = app.refs.remoteRef
      const params = getParamsEditor()?.getEditor().getValue()
      const fitSource = getFitEditor()?.getEditor().getValue()
      const fetchSource = getFetchEditor()?.getEditor().getValue()

      const { options } = state.createData
      const newOption = {
        ...options,
        params,
        fit: { source: fitSource || '' },
        didFetch: { source: fetchSource || '' }
      }
      state.createData.options = newOption

      emit('confirm', state.createData)
    }

    return {
      ...toRefs(state),
      cancel,
      confirm
    }
  }
}
</script>

<style lang="less" scoped>
.data-source-right-panel {
  width: 442px;
  height: 100%;
  border-right: 1px solid var(--ti-lowcode-toolbar-border-color);
  background: var(--ti-lowcode-toolbar-bg);
  position: absolute;
  left: calc(var(--base-left-panel-width) - 6px);
  top: 0;

  .right-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 45px;
    padding: 0 12px;
    color: var(--ti-lowcode-toolbar-icon-color);
    background: var(--ti-lowcode-toolbar-view-hover-bg);
    border-bottom: 1px solid var(--ti-lowcode-tabs-border-color);
  }
}
</style>
