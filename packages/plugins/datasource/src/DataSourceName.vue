<template>
  <div class="right-item">
    <tiny-form
      ref="dataSourceNameRef"
      :rules="rules"
      label-position="top"
      label-width="55%"
      validate-type="text"
      :model="state.dataSource"
    >
      <tiny-form-item prop="name" label="数据源名称">
        <tiny-input v-model="state.dataSource.name" placeholder="请输入数据源名称" @input="modifyName"></tiny-input>
      </tiny-form-item>
    </tiny-form>
  </div>
</template>

<script>
import { reactive, watchEffect, ref } from 'vue'
import { Form, FormItem, Input } from '@opentiny/vue'

const dataSourceNameRef = ref(null)

export const getDataSourceName = () => {
  return dataSourceNameRef.value
}

export default {
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const state = reactive({
      dataSource: {
        name: null
      }
    })

    const rules = {
      name: [
        { required: true, message: '必填', trigger: 'change' },
        {
          type: 'string',
          message: '数据源名称最少2个字符，只能包含字母、数字、下划线，开头必须字母',
          pattern: /^[a-zA-Z][_a-zA-Z0-9]+$/,
          trigger: 'change'
        }
      ]
    }

    watchEffect(() => {
      state.dataSource.name = props.modelValue || ''
    })

    const modifyName = (e) => {
      emit('update:modelValue', e.target.value)
    }

    return {
      state,
      rules,
      modifyName,
      dataSourceNameRef
    }
  }
}
</script>
