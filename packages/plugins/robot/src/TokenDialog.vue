<script>
import { onMounted, ref, watch } from 'vue'
import { DialogBox, Button, Input, Alert, Form, FormItem } from '@opentiny/vue'
import { iconCommission, iconAssociation } from '@opentiny/vue-icon'
import { submitHandle } from '@opentiny/vue-renderless/wizard'

export default {
  methods: { submitHandle },
  components: {
    TinyDialogBox: DialogBox,
    TinyButton: Button,
    TinyInput: Input,
    TinyAlert: Alert,
    TinyForm: Form,
    TinyFormItem: FormItem
  },
  props: {
    dialogVisible: Boolean,
    currentModel: Object
  },
  emits: ['dialog-status', 'token-status'],
  setup(props, { emit }) {
    const model = ref(props.currentModel)
    const modelName = props.currentModel.label.split('：')[0]
    const keyFormVisible = ref(props.dialogVisible)
    const keyFormRef = ref(null)
    const keyForm = ref({
      token: ''
    })
    const tokenReg = /^[A-Za-z0-9\-.]+$/
    const tokenValidate = (rule, value, callback) => {
      if (value.length > 100 || !tokenReg.test(value)) {
        callback(new Error('参数错误，请输入小于100位的英文、数字、连字符或点号的字符串'))
      } else {
        callback()
      }
    }
    const rules = {
      token: [
        { required: true, message: '该项不能为空', trigger: 'blur' },
        { validator: tokenValidate, trigger: 'blur' }
      ]
    }

    watch(
      () => props.dialogVisible,
      (newVisibleState) => {
        keyFormVisible.value = newVisibleState
        model.value = props.currentModel
      }
    )

    onMounted(() => {
      keyFormVisible.value = props.dialogVisible
    })

    const closeKeyFormDialog = () => {
      keyFormVisible.value = false
      emit('dialog-status', false)
    }

    const submitKeyForm = () => {
      keyFormRef.value.validate((valid) => {
        if (valid) {
          localStorage.setItem(props.currentModel.modelKey, keyForm.value.token)
          emit('token-status', true)
          closeKeyFormDialog()
        }
      })
    }

    return {
      keyFormRef,
      keyForm,
      rules,
      closeKeyFormDialog,
      submitKeyForm,
      keyFormVisible,
      model,
      modelName,
      TinyIconAssociation: iconAssociation(),
      TinyIconCommission: iconCommission()
    }
  }
}
</script>

<template>
  <tiny-dialog-box :modal="false" v-model:visible="keyFormVisible" title="欢迎使用AI对话功能">
    <tiny-form :model="keyForm" :rules="rules" ref="keyFormRef" label-width="0" class="demo-form">
      <tiny-alert
        :icon="TinyIconAssociation"
        :closable="false"
        :description="`当前AI大模型为使用 ${modelName}`"
      ></tiny-alert>
      <tiny-alert
        :icon="TinyIconCommission"
        :closable="false"
        :description="`尝试用自己的 ${model.modelKey} 开启AI对话功能吧！`"

      ></tiny-alert>
      <tiny-form-item label="" prop="token">
        <tiny-input
          v-model="keyForm.token"
          :placeholder="`点击这里输入你的 ${model.modelKey}`"
          validate-event
        ></tiny-input>
      </tiny-form-item>
    </tiny-form>
    <template #footer>
      <tiny-button type="primary" @click="submitKeyForm"> 确定 </tiny-button>
      <tiny-button @click="closeKeyFormDialog"> 取消 </tiny-button>
    </template>
  </tiny-dialog-box>
</template>
