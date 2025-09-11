<template>
  <tiny-form :model="variableForm" :inline="true" :rules="rules" label-width="0px" ref="ruleFormRef">
    <tiny-form-item prop="variableName">
      <div class="variable-set-wrap">
        <tiny-input v-model="variableForm.variableName" type="text" placeholder="请输入变量名"></tiny-input>
        <tiny-button type="text" @click="bindVariable">绑定</tiny-button>
      </div>
    </tiny-form-item>
  </tiny-form>
</template>

<script>
import { ref, reactive } from 'vue'
import { Form, FormItem, Input, Button, Notify } from '@opentiny/vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

export default {
  name: 'BindVariableConfigurator',
  components: {
    TinyInput: Input,
    TinyButton: Button,
    TinyForm: Form,
    TinyFormItem: FormItem
  },
  props: {
    modelValue: {
      type: String
    },
    isValueArray: {
      type: Boolean,
      default: false
    },
    defaultValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { getPageSchema, getCurrentSchema } = useCanvas()
    const pageSchema = getPageSchema()

    const variableForm = reactive({
      variableName: ''
    })
    const ruleFormRef = ref()

    const rules = ref({
      variableName: [{ required: true, message: '必填', trigger: 'blur' }]
    })

    const bindVariable = () => {
      const currentSchema = getCurrentSchema()
      ruleFormRef.value.validate().then(() => {
        if (!currentSchema.props?.serviceModel) {
          Notify({
            type: 'error',
            message: '请先选择模型',
            position: 'top-right'
          })
          return
        }
        if (props.isValueArray) {
          pageSchema.state[variableForm.variableName] =
            pageSchema.state?.[variableForm.variableName] ?? props.defaultValue
        } else {
          pageSchema.state[variableForm.variableName] =
            pageSchema.state[variableForm.variableName] ??
            Object.fromEntries(
              (currentSchema.props.serviceModel.parameters || []).map((item) => {
                return [
                  item.prop,
                  item?.isModel
                    ? Object.fromEntries(
                        item.defaultValue.map((insideItem) => [insideItem.prop, insideItem.defaultValue || null])
                      )
                    : item.defaultValue || null
                ]
              })
            )
        }

        emit('update:modelValue', {
          type: 'JSExpression',
          value: `this.state.${variableForm.variableName}`,
          model: true
        })
      })
    }

    return {
      variableForm,
      ruleFormRef,
      rules,
      bindVariable
    }
  }
}
</script>

<style lang="less" scoped>
.variable-set-wrap {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
