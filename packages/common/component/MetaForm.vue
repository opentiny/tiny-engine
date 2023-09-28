<template>
  <div class="demo-form">
    <tiny-form label-position="left" label-width="53px">
      <template v-for="label in labelList" :key="label">
        <tiny-form-item v-if="labelTranslations[label]" :label="labelTranslations[label] || label">
          <tiny-input v-model="formData[label]"></tiny-input>
        </tiny-form-item>
      </template>
      <tiny-form-item :class="{ footerbtnHide: footerbtnHide }">
        <tiny-button @click="cancel">取消</tiny-button>
        <tiny-button @click="confirm">确定</tiny-button>
      </tiny-form-item>
    </tiny-form>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { Form, FormItem, Input, Button } from '@opentiny/vue'

export default {
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinyButton: Button
  },
  props: {
    option: {
      type: Object,
      default: () => ({})
    },
    footerbtnHide: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const labelList = Object.keys(props.option)
    const formData = reactive({ ...props.option })

    const labelTranslations = {
      label: '显示值',
      text: '展示值',
      zh_CN: '中文',
      en_US: '英文',
      field: 'field',
      title: 'title',
      description: '描述',
      defaultValue: '缺省值'
    }

    const cancel = () => {
      emit('cancel')
    }

    const confirm = () => {
      emit('confirm', formData)
    }

    return {
      labelList,
      formData,
      labelTranslations,
      cancel,
      confirm
    }
  }
}
</script>

<style lang="less" scoped>
.demo-form {
  .tiny-button {
    min-width: 50px;
    padding: 0 8px;
  }
  .footerbtnHide {
    display: none;
  }
}
</style>
