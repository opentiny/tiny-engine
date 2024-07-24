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
    dialogVisible: Boolean
  },
  emits: ['dialog-status'],
  setup(props, { emit }) {
    const keyFormVisible = ref(props.dialogVisible)
    const keyFormRef = ref(null)
    const keyForm = ref({
      accessToken: ''
    })
    const accessTokenReg = /^[A-Za-z0-9\-.]+$/
    const accessTokenValidate = (rule, value, callback) => {
      if (value.length > 100 || !accessTokenReg.test(value)) {
        callback(new Error('参数错误，请输入小于100位的英文数字字符串'))
      } else {
        callback()
      }
    }
    const rules = ref({
      accessToken: [
        { required: true, message: '你的ACCESS_TOKEN不能为空', trigger: 'blur' },
        { validator: accessTokenValidate, trigger: 'blur' }
      ]
    })

    watch(
      () => props.dialogVisible,
      (newValue) => {
        keyFormVisible.value = newValue
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
          localStorage.setItem('accessToken', keyForm.value.accessToken)
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
        description="当前AI大模型为使用文心一言：ERNIE-Bot-turbo"
      ></tiny-alert>
      <tiny-alert
        :icon="TinyIconCommission"
        :closable="false"
        description="尝试用自己的ACCESS_TOKEN开启AI对话功能吧！"
      ></tiny-alert>
      <tiny-form-item label="" prop="accessToken">
        <tiny-input
          v-model="keyForm.accessToken"
          placeholder="点击这里输入你的access_token"
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
