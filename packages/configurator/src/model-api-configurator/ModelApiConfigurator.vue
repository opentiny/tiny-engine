<template>
  <tiny-popover
    placement="bottom-start"
    trigger="manual"
    v-model="isShow"
    :visible-arrow="false"
    :popper-class="['option-popper', 'fixed-left']"
    :offset="isSecond ? 652 : 0"
    width="860"
  >
    <div class="model-function-wrap">
      <div class="model-title">
        <span>选择模型方法</span>
        <div class="right">
          <tiny-button @click="closePopover">取消</tiny-button>
          <tiny-button type="primary" @click="setModelFunction" :disabled="!selectedFunction">确定</tiny-button>
          <tiny-icon-close class="tiny-svg-size" @click="closePopover"></tiny-icon-close>
        </div>
      </div>
      <div class="model-set-wrap">
        <div class="model-wrap">
          <div class="model-groups">
            <model-select
              :model-page-size="5"
              @model-select="getModel"
              :meta="meta"
              :isShow="isShow"
              :isModelApi="true"
            ></model-select>
          </div>
          <div class="model-parameters">
            <tiny-grid
              :data="selectedModel?.method || []"
              min-height="116"
              max-height="330"
              @radio-change="selectModelFunction"
            >
              <tiny-grid-column type="radio" width="40"></tiny-grid-column>
              <tiny-grid-column field="name" title="方法名称" show-overflow></tiny-grid-column>
              <tiny-grid-column field="nameEn" title="英文名" show-overflow></tiny-grid-column>
            </tiny-grid>
          </div>
        </div>
        <div class="model-param-wrap" v-if="selectedFunction">
          <tiny-form
            ref="ruleFormRef"
            :model="methodBasicData"
            :rules="methodBasicData.rules"
            label-width="100px"
            label-position="left"
          >
            <tiny-form-item label="请求URL" prop="url">
              <tiny-input v-model="methodBasicData.url"></tiny-input>
            </tiny-form-item>
            <tiny-form-item label="请求方式" prop="method">
              <tiny-select v-model="methodBasicData.method" :options="methodBasicData.options"></tiny-select>
            </tiny-form-item>
          </tiny-form>
          <tiny-collapse v-model="activeNames">
            <tiny-collapse-item title="入参参考配置" name="request">
              <params-bind-grid :data="selectedFunction?.requestParameters || []" :type="'request'"></params-bind-grid>
            </tiny-collapse-item>
            <tiny-collapse-item title="出参参考配置" name="response">
              <params-bind-grid
                :data="selectedFunction?.responseParameters || []"
                :type="'response'"
              ></params-bind-grid>
            </tiny-collapse-item>
          </tiny-collapse>
        </div>
      </div>
    </div>
  </tiny-popover>
  <div class="model-api-wrap" v-if="modelValue.length">
    <div class="model-api-item" v-for="item in modelValue" :key="item.name">
      <span>{{ item.name }}</span>
      <tiny-icon-del @click="removeApi(item)"></tiny-icon-del>
    </div>
  </div>
  <tiny-button @click="openPopover">{{ modelValue?.name || buttonText }}</tiny-button>
</template>
<script setup>
import { ref, reactive, defineProps, defineEmits } from 'vue'
import {
  Button as TinyButton,
  Popover as TinyPopover,
  Collapse as TinyCollapse,
  CollapseItem as TinyCollapseItem,
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Input as TinyInput,
  Select as TinySelect,
  Notify
} from '@opentiny/vue'
import { iconClose, iconDel } from '@opentiny/vue-icon'
import ModelSelect from '../model-common/ModelSelect.vue'
import ParamsBindGrid from './ParamsBindGrid.vue'

const props = defineProps({
  meta: {
    type: Object,
    default: () => ({})
  },
  buttonText: {
    type: String,
    default: '选择模型方法'
  },
  // 协议类型
  renderType: {
    type: String,
    default: 'JSExpression'
  },
  isFunction: {
    type: Boolean,
    default: true
  },
  // 是否是二级面板
  isSecond: {
    type: Boolean,
    default: false
  },
  // 是否引入model的url等
  isShowModelDetail: {
    type: Boolean,
    default: true
  }
})
const emit = defineEmits(['update:modelValue'])
const TinyIconClose = iconClose()
const TinyIconDel = iconDel()
const isShow = ref(false)
const modelValue = ref(props.meta.widget.props.modelValue || [])
const activeNames = ref(['request', 'response'])
const ruleFormRef = ref(null)
const methodBasicData = reactive({
  url: '',
  method: '',
  options: [
    {
      label: 'GET',
      value: 'get'
    },
    {
      label: 'POST',
      value: 'post'
    },
    {
      label: 'PUT',
      value: 'put'
    },
    {
      label: 'DELETE',
      value: 'delete'
    }
  ],
  rules: {
    url: [{ required: true, message: 'URL必填', trigger: 'change' }],
    method: [{ required: true, message: '请求方式必填', trigger: 'change' }]
  }
})

const selectedModel = ref()
const selectedFunction = ref()

const openPopover = () => {
  isShow.value = true
}

const closePopover = () => {
  isShow.value = false
}

const getModel = (data) => {
  selectedModel.value = data
  methodBasicData.url = data.baseUrl
}

const setModelFunction = async () => {
  ruleFormRef.value.validate().then(() => {
    if (modelValue.value.find((item) => item.name === selectedFunction.value.name)) {
      Notify({
        type: 'error',
        message: '当前模型方法已选择',
        position: 'top-right'
      })
    } else {
      modelValue.value.push({
        modelName: selectedModel.value.nameCn,
        url: methodBasicData.url,
        method: methodBasicData.method,
        name: selectedFunction.value.name,
        nameEn: selectedFunction.value.nameEn
      })
      emit('update:modelValue', modelValue.value)

      closePopover()
    }
  })
}

const removeApi = (apiItem) => {
  modelValue.value = modelValue.value.filter((item) => item.name !== apiItem.name)
  emit('update:modelValue', modelValue.value)
}

const selectModelFunction = (data) => {
  selectedFunction.value = data.row
}
</script>

<style lang="less" scoped>
.model-function-wrap {
  overflow-y: scroll;
  height: 100%;
  .model-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0 20px 0;
    .right {
      svg {
        margin-left: 10px;
      }
    }
    span {
      font-weight: 600;
    }

    .tiny-svg {
      cursor: pointer;
    }
  }
  .model-set-wrap {
    .model-wrap {
      display: flex;
      min-height: 140px;
      max-height: 355px;
      border: 1px solid #e6e6e6;
      border-radius: 4px;
      .model-groups {
        width: 410px;
        padding: 12px;
        border-right: 1px solid #e6e6e6;
        :deep(.tiny-tree) {
          .tiny-tree-node__content .tiny-tree-node__content-left {
            padding: 0;
            .tiny-tree-node__label {
              color: #191919;
            }
          }
          .tiny-tree-node__children .tiny-tree-node__content {
            padding: 0;
            .tiny-tree-node__content-left .tiny-tree-node__label {
              color: #595959;
            }
          }
        }
        .search {
          margin-bottom: 12px;
        }
      }
      .model-parameters {
        width: 412px;
        padding: 12px;
        overflow-y: scroll;
        &::-webkit-scrollbar {
          display: none;
        }
        div {
          border-bottom: 1px solid #f5f5f5;
        }
        span {
          padding-left: 12px;
          display: inline-block;
          width: 180px;
        }
        .title {
          height: 24px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          span:first-child {
            border-right: 1px solid #dbdbdb;
          }
        }
        .list-items {
          height: 30px;
          line-height: 30px;
          display: flex;
          align-items: center;
        }
      }
    }

    .model-param-wrap {
      .tiny-form {
        padding: 12px;
      }
    }
  }
}

.model-api-wrap {
  border-top: 1px solid var(--te-component-common-border-color-divider);
  color: var(--te-component-common-text-color-primary);
  margin-bottom: 10px;
  .model-api-item {
    display: flex;
    justify-content: space-between;
    height: 24px;
    align-items: center;
    padding: 2px;
    border-bottom: 1px solid var(--te-component-common-border-color-divider);

    svg {
      cursor: pointer;
    }
  }
}
</style>
