<template>
  <tiny-form ref="createData" class="create-form" label-position="left" label-width="20%">
    <tiny-form-item label="名称">
      <tiny-input v-model="state.createData.name" placeholder="只能包含数字字母及下划线"></tiny-input>
      <div v-if="errorMessage" class="error-tip">{{ errorMessage }}</div>
    </tiny-form-item>

    <tiny-form-item label="描述">
      <tiny-input v-model="state.createData.description" placeholder="请输入"></tiny-input>
    </tiny-form-item>

    <tiny-form-item label="请求地址">
      <div class="textarea-warp">
        <tiny-input
          v-model="state.createData.options.url"
          type="textarea"
          resize="none"
          placeholder="请输入"
        ></tiny-input>
      </div>
    </tiny-form-item>

    <tiny-form-item label="请求方式">
      <tiny-button-group v-model="state.createData.options.method" :data="state.requestData"></tiny-button-group>
    </tiny-form-item>
  </tiny-form>

  <div class="create-config">
    <div>
      <div class="title">请求参数</div>
      <monaco-editor
        ref="paramsEditor"
        class="monaco-editor"
        :value="JSON.stringify(state.createData.options.params, null, 2)"
        :options="state.options"
      />
    </div>
    <div>
      <div class="title">启用服务</div>
      <tiny-switch v-model="state.createData.options.isSync" class="send-request"></tiny-switch>
      <span class="use-service"><span>* </span> 页面初始化时是否加载该服务</span>
    </div>
    <div class="send-service">
      <tiny-button type="info">发送请求</tiny-button>
      <div class="use-service">
        <meta-description type="warning">
          <template #content>
            <div>
              <span>* </span>
              完善以上信息，点击按钮编辑器将自动发送该服务，服务响应的数据将填充至下面的编辑器中,否则需要手动将响应数据填充至下面的编辑器中
            </div>
          </template>
        </meta-description>
      </div>
    </div>
    <div>
      <div class="data-wrap title">
        <div>数据处理</div>
        <tiny-popover placement="bottom-start" trigger="hover" popperClass="data-source-popper data-remote-popper">
          <template #reference>
            <span class="icon">
              <icon-plus class="icon-plus"></icon-plus>
            </span>
          </template>

          <ul>
            <li v-for="(item, index) in state.datapool" :key="index" @click="addFunction(item)">
              {{ item.name }}
            </li>
          </ul>
        </tiny-popover>
      </div>

      <create-function
        v-if="isFetchShow"
        ref="fetchEditor"
        :name="state.datapool[0].name"
        :value="state.createData.options.didFetch?.source"
        @remove="removeFunction(state.datapool[0])"
      />
      <create-function
        v-if="isFitShow"
        ref="fitEditor"
        :name="state.datapool[1].name"
        :value="state.createData.options.fit?.source"
        @remove="removeFunction(state.datapool[1])"
      />
    </div>
  </div>
</template>

<script>
import { getCurrentInstance, reactive } from 'vue'
import { ButtonGroup, Form, FormItem, Input, Popover, Switch, Button } from '@opentiny/vue'
import { VueMonaco as MonacoEditor, MetaDescription } from '@opentiny/tiny-engine-common'
import { iconPlus } from '@opentiny/vue-icon'
import CreateFunction from './CreateRemoteFunction.vue'

export default {
  components: {
    MonacoEditor,
    CreateFunction,
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinySwitch: Switch,
    TinyButtonGroup: ButtonGroup,
    TinyPopover: Popover,
    IconPlus: iconPlus(),
    TinyButton: Button,
    MetaDescription
  },
  props: {
    createData: {
      type: Object,
      default: () => ({ options: {} })
    },
    errorMessage: {
      type: String
    },
    isFitShow: {
      type: Boolean
    },
    isFetchShow: {
      type: Boolean
    }
  },
  setup(props, { emit }) {
    const instance = getCurrentInstance()

    const state = reactive({
      createData: props.createData,
      options: {
        language: 'javascript',
        minimap: { enabled: false }
      },
      requestData: [
        { text: 'JSONP', value: 'JSONP' },
        { text: 'GET', value: 'GET' },
        { text: 'POST', value: 'POST' },
        { text: 'PUT', value: 'PUT' },
        { text: 'DELETE', value: 'DELETE' }
      ],
      datapool: [
        {
          id: 'didFetch',
          name: '请求完成回调函数（didFetch）'
        },
        {
          id: 'fit',
          name: '请求返回时的数据适配（fit）'
        }
      ]
    })

    const addFunction = (item) => {
      emit('addFunction', item)
    }

    const removeFunction = (item) => {
      emit('removeFunction', item)
    }

    const getParamsEditor = () => {
      return instance.refs.paramsEditor
    }

    const getFitEditor = () => {
      return instance.refs.fitEditor?.getEditor()
    }

    const getFetchEditor = () => {
      return instance.refs.fetchEditor?.getEditor()
    }

    return {
      state,
      addFunction,
      removeFunction,
      getParamsEditor,
      getFitEditor,
      getFetchEditor
    }
  }
}
</script>

<style lang="less" scoped>
.create-form {
  padding: 12px;

  .error-tip {
    color: var(--te-common-color-error);
    margin-top: 4px;
    font-size: 12px;
  }

  .textarea-warp {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .tiny-button-group {
    width: 100%;
  }

  :deep(.tiny-group-item) {
    display: flex;
    width: 100%;
    button {
      position: relative;
      min-width: inherit;
      padding: 0 4px;
      margin: 0;
      width: 100%;
    }
    li {
      flex: 1 1 0;
      &:not(:last-child) {
        button:before {
          content: '';
          display: inline-block;
          width: 1px;
          height: 100%;
          position: absolute;
          top: 0;
          right: 0;
          z-index: 99;
        }
      }
    }
  }
}

.create-config {
  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--ti-lowcode-toolbar-bg);
    border-top: 1px solid var(--te-common-border-default);
    border-bottom: 1px solid var(--te-common-border-default);
    color: var(--te-common-text-secondary);
  }

  .use-service {
    color: var(--te-common-text-secondary);
    font-size: 12px;
    margin-top: 10px;

    span {
      color: var(--te-common-color-error);
    }
  }

  .send-service {
    text-align: right;
    border-top: 1px solid var(--te-common-border-default);
    padding: 20px 10px;
    margin-bottom: 10px;

    .use-service {
      text-align: left;
      padding-top: 5px;

      div {
        margin-bottom: 5px;
      }
    }

    .title {
      margin-bottom: 10px;
    }
  }

  .send-request {
    margin: 12px;
  }

  .data-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;

    & > span {
      line-height: 1;
    }

    .icon-plus {
      cursor: pointer;
      color: var(--ti-lowcode-toolbar-icon-color);
      outline: none;
    }

    .icon {
      width: 20px;
      height: 20px;
      color: var(--te-common-text-secondary);
      font-size: 16px;
      border-radius: 2px;
      margin-right: 8px;
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

  .monaco-editor {
    height: 80px;
    margin-top: 8px;
  }
}
</style>
