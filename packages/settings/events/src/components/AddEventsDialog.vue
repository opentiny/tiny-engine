<template>
  <tiny-dialog-box
    :visible="visible"
    title="添加自定义事件"
    width="400px"
    :append-to-body="true"
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <tiny-form
      ref="ruleForm"
      :model="formData"
      :rules="rules"
      label-width="100px"
      :inline-message="true"
      validate-type="text"
      label-position="left"
      class="add-custom-event-form"
    >
      <tiny-form-item label="事件函数名" prop="eventName" required>
        <tiny-input v-model="formData.eventName" placeholder="小驼峰格式，如：onDrag"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="事件描述" prop="eventDescription" required>
        <tiny-input v-model="formData.eventDescription"></tiny-input>
      </tiny-form-item>
    </tiny-form>
    <template #footer>
      <div class="footer">
        <tiny-button @click="closeDialog"> 取消</tiny-button>
        <tiny-button type="primary" @click="addMethod"> 确定</tiny-button>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script setup>
import { reactive, ref, defineProps, defineEmits } from 'vue'
import {
  Input as TinyInput,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Button as TinyButton,
  DialogBox as TinyDialogBox
} from '@opentiny/vue'
import { checkEvent } from '../commonjs/events.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  componentEvents: {
    type: Object,
    default: () => ({})
  }
})

const emits = defineEmits(['closeDialog', 'addEvent'])

const formData = reactive({
  eventDescription: '',
  eventName: ''
})

const ruleForm = ref(null)

const eventNameValidator = (rule, value, callback) => {
  if (props.componentEvents[formData.eventName]) {
    callback(new Error('事件名已存在'))

    return
  }

  if (!checkEvent(formData.eventName)) {
    callback(new Error('请输入正确的浏览器事件名'))

    return
  }

  callback()
}

const rules = {
  eventDescription: [
    {
      required: true,
      message: '必填'
    }
  ],
  eventName: [
    { required: true, message: '必填' },
    {
      validator: eventNameValidator
    }
  ]
}

const closeDialog = () => {
  emits('closeDialog')
}

const addMethod = () => {
  if (!ruleForm.value) {
    return
  }

  ruleForm.value.validate((valid) => {
    if (!valid) {
      return
    }

    const { eventName, eventDescription } = formData

    emits('addEvent', { eventName, eventDescription })
  })
}
</script>

<style lang="less" scoped>
.add-custom-event-form {
  :deep(.tiny-form-item__label) {
    padding-left: 0;
  }
}
.footer {
  display: flex;
  justify-content: flex-end;
}
</style>
