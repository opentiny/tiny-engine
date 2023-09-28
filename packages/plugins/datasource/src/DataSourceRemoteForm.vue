<template>
  <tiny-form
    ref="serviceFormRef"
    class="create-form"
    label-position="left"
    label-width="15%"
    :model="state.serviceForm"
    :rules="rules"
    validate-type="text"
  >
    <!-- <tiny-form-item label="名称" prop="name">
      <tiny-input v-model="state.serviceForm.name" placeholder="只能包含数字字母及下划线"></tiny-input>
    </tiny-form-item> -->

    <tiny-form-item label="描述" prop="description">
      <tiny-input v-model="state.serviceForm.description" placeholder="请输入"></tiny-input>
    </tiny-form-item>

    <tiny-form-item label="请求地址" prop="uri">
      <div class="textarea-warp">
        <tiny-input class="border-input" v-model="state.serviceForm.uri" resize="none" placeholder="请输入">
          <template #prepend>
            <tiny-select class="selectResType" v-model="state.serviceForm.method" placeholder="请选择">
              <tiny-option v-for="item in state.requestData" :key="item.value" :label="item.value" :value="item.value">
              </tiny-option>
            </tiny-select>
          </template>
          <template #append><a class="requestBtn" type="info" @click="$emit('sendRequest')">发送请求</a></template>
        </tiny-input>
      </div>
    </tiny-form-item>
  </tiny-form>
</template>

<script>
import { reactive, watchEffect, ref } from 'vue'
import { Form, FormItem, Input, Select, Option } from '@opentiny/vue'

const serviceFormRef = ref(null)

export const getServiceForm = () => {
  return serviceFormRef.value
}

export default {
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinySelect: Select,
    TinyOption: Option
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const state = reactive({
      serviceForm: {},
      requestData: [
        { text: 'JSONP', value: 'JSONP' },
        { text: 'GET', value: 'GET' },
        { text: 'POST', value: 'POST' },
        { text: 'PUT', value: 'PUT' },
        { text: 'DELETE', value: 'DELETE' }
      ]
    })

    watchEffect(() => {
      state.serviceForm = props.modelValue
    })

    const rules = {
      uri: [{ required: true, message: '必填', trigger: 'change' }],
      method: { required: true, message: '必选', trigger: 'change' }
    }

    return {
      state,
      rules,
      serviceFormRef
    }
  }
}
</script>

<style lang="less" scoped>
.create-form {
  padding: 12px 0;

  .error-tip {
    color: var(--ti-lowcode-datasource-error-tip-color);
    margin-top: 4px;
    font-size: 12px;
  }
  :deep(.tiny-form-item__label) {
    color: var(--ti-lowcode-datasource-label-color);
  }
  .textarea-warp {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    .selectResType {
      width: 100px;
      border: none;
    }
    :deep(.tiny-input-group__prepend) {
      background: var(--ti-lowcode-datasource-respones-select-color-bg);
      border-color: var(--ti-lowcode-datasource-select-border-color);
      .tiny-input-suffix {
        .tiny-input-display-only {
          .tiny-input__inner {
            border-color: var(--ti-lowcode-datasource-select-border-right-color-bg);
            border-left: none;
          }
        }
      }
    }
    :deep(.tiny-input-display-only) {
      .tiny-input__inner {
        border-left: none;
      }
    }
    :deep(.tiny-input-group__append) {
      border: none;
      background: var(--ti-lowcode-datasource-respones-color-bg);
    }
    .requestBtn {
      color: var(--ti-lowcode-datasource-respones-border-color-bg);
    }
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

  :deep(.tiny-form-item__label) {
    height: 30px;
    line-height: 30px;
  }
}
</style>
