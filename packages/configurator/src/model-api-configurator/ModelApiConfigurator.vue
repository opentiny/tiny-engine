<template>
  <tiny-popover
    placement="bottom-start"
    trigger="manual"
    v-model="isShow"
    :visible-arrow="false"
    :popper-class="['option-popper', 'fixed-left', 'model-function-popper']"
    :offset="isSecond ? 652 : 0"
    width="600"
  >
    <div class="model-function-wrap">
      <div class="model-title">
        <span>选择模型方法</span>
        <div class="right">
          <button-group>
            <tiny-button type="primary" @click="setModelFunction" :disabled="!selectedFunction">确定</tiny-button>
            <tiny-icon-close class="tiny-svg-size" @click="closePopover"></tiny-icon-close>
          </button-group>
        </div>
      </div>
      <div class="model-set-wrap">
        <div class="model-param-wrap" v-if="selectedFunction">
          <tiny-form
            ref="ruleFormRef"
            :model="selectedFunction"
            :rules="methodBasicData.rules"
            label-width="100px"
            label-position="left"
          >
            <tiny-form-item label="请求URL" prop="url">
              <tiny-input v-model="selectedFunction.url"></tiny-input>
            </tiny-form-item>
            <tiny-form-item label="请求方式" prop="method">
              <tiny-select
                v-model="selectedFunction.method"
                :disabled="methodDisabled"
                :options="methodBasicData.options"
              ></tiny-select>
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
    <div class="model-api-item" v-for="(item, index) in apiList" :key="item.nameEn">
      <tiny-checkbox v-model="item.checked" @change="setModelApis">{{ item.name }}</tiny-checkbox>
      <tiny-icon-edit @click="openPopover(item, index)"></tiny-icon-edit>
    </div>
  </div>
  <div v-else class="model-api-empty">当前还未选择模型</div>
</template>
<script setup>
import { ref, reactive, computed, defineProps, defineEmits, watch, onMounted } from 'vue'
import {
  Button as TinyButton,
  Popover as TinyPopover,
  Collapse as TinyCollapse,
  CollapseItem as TinyCollapseItem,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Input as TinyInput,
  Select as TinySelect,
  Checkbox as TinyCheckbox
} from '@opentiny/vue'
import { iconClose, iconEdit } from '@opentiny/vue-icon'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { ButtonGroup } from '@opentiny/tiny-engine-common'
import { getModelDetail } from '../model-common/http'
import ParamsBindGrid from './ParamsBindGrid.vue'

const props = defineProps({
  meta: {
    type: Object,
    default: () => ({})
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
const TinyIconEdit = iconEdit()
const isShow = ref(false)
const modelValue = ref(props.meta.widget.props.modelValue || [])
const activeNames = ref(['request', 'response'])
const ruleFormRef = ref(null)
const methodBasicData = reactive({
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

const apiList = ref([])
const selectedApi = ref([])
const selectedModel = ref()
const selectedFunction = ref()
const selectedFunctionIndex = ref(null)

const methodDisabled = computed(
  () => selectedFunction.value.url === `${selectedModel.value.modelUrl}/${selectedFunction.value.nameEn}`
)

const getModel = async () => {
  const modelId = useCanvas().getCurrentSchema().props?.serviceModel?.id
  if (modelId) {
    selectedModel.value = await getModelDetail(modelId)
    apiList.value = selectedModel.value.method.map((item) => {
      return {
        ...item,
        checked: true,
        url: `${selectedModel.value.modelUrl}/${item.nameEn}`,
        method: 'post'
      }
    })
    selectedApi.value = selectedModel.value.method.map((api) => api.name)
  }
}

const openPopover = (editItem, editIndex) => {
  selectedFunction.value = { ...editItem }
  selectedFunctionIndex.value = editIndex
  isShow.value = true
}

const closePopover = () => {
  selectedFunction.value = null
  selectedFunctionIndex.value = null
  isShow.value = false
}

const setModelApis = () => {
  modelValue.value = apiList.value
    .map((item) => {
      return item.checked
        ? {
            url: item.url,
            method: item.method,
            name: item.name,
            nameEn: item.nameEn
          }
        : null
    })
    .filter((api) => api !== null)
  emit('update:modelValue', modelValue.value)
}

const setModelFunction = async () => {
  ruleFormRef.value.validate().then(() => {
    apiList.value[selectedFunctionIndex.value] = selectedFunction.value
    setModelApis()
    closePopover()
  })
}

watch(
  () => useCanvas().getCurrentSchema().props.serviceModel,
  async (model) => {
    if (model) {
      await getModel()
      modelValue.value = apiList.value.map((api) => {
        return {
          url: api.url,
          method: api.method,
          name: api.name,
          nameEn: api.nameEn
        }
      })
      emit('update:modelValue', modelValue.value)
    }
  }
)

onMounted(() => {
  getModel()
})
</script>

<style lang="less" scoped>
.model-function-wrap {
  overflow-y: scroll;
  height: 100%;
  .model-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 16px 20px 16px;
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
      .model-parameters {
        width: 100%;
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
        padding: 12px 28px;
      }
      .tiny-collapse.tiny-collapse .tiny-collapse-item {
        padding: 0 12px;
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
    height: 28px;
    line-height: 28px;
    align-items: center;
    padding: 0 8px;
    border-bottom: 1px solid var(--te-component-common-border-color-divider);

    svg {
      cursor: pointer;
      font-size: 16px;
      opacity: 0.4;
      color: var(--te-component-common-text-color-primary);
    }
  }
}

.model-api-empty {
  color: var(--te-common-text-secondary);
}
</style>
<style lang="less">
.model-function-popper.model-function-popper.model-function-popper.model-function-popper {
  border-radius: 0;
  box-shadow: -6px 0px 3px 0px var(--te-configurator-common-panel-shadow-color);
  padding: 0;
}
</style>
