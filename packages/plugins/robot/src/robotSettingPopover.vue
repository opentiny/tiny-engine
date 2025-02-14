<template>
  <div ref="robotSetting" class="robot-setting">
    <div class="header">设置</div>
    <tiny-form ref="robotSettingForm" label-position="top" :rules="formRules" :model="formData" validate-type="text">
      <tiny-form-item prop="type" label="大模型类型" label-width="150px">
        <tiny-select v-model="formData.type" placeholder="请选择" @change="changeModelType">
          <tiny-option v-for="item in AIModelOptions" :key="item.label" :label="item.label" :value="item.value">
          </tiny-option>
        </tiny-select>
      </tiny-form-item>
      <tiny-form-item prop="tokenVal" label-width="150px">
        <template #label>
          大模型API Token
          <tiny-tooltip effect="light" :content="helpTip" placement="top">
            <svg-icon class="help-link" name="plugin-icon-plugin-help"></svg-icon>
          </tiny-tooltip>
        </template>
        <tiny-input class="filedName" v-model="formData.tokenVal" placeholder="请输入"></tiny-input>
      </tiny-form-item>
    </tiny-form>
    <div class="bottom-buttons">
      <tiny-button @click="closePanel">取消</tiny-button>
      <tiny-button type="primary" @click="confirm">确定</tiny-button>
    </div>
  </div>
</template>
<script>
import { ref, reactive } from 'vue'
import { Form, FormItem, Input, Button, Select, Option, Tooltip } from '@opentiny/vue'
import { AIModelOptions } from './js/robotSetting'

export default {
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinyButton: Button,
    TinySelect: Select,
    TinyOption: Option,
    TinyTooltip: Tooltip
  },
  props: {
    typeValue: {
      type: Object,
      default: () => ({})
    },
    tokenValue: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const robotSettingForm = ref(null)

    const formData = reactive({
      type: props.typeValue.value,
      tokenVal: props.tokenValue
    })

    const formRules = {
      type: [{ required: true, message: '必选', trigger: 'change' }],
      tokenVal: [{ required: true, message: '必填', trigger: 'blur' }]
    }

    const active = ref('props')

    const closePanel = () => {
      emit('active', 'props')
    }

    const changeModelType = () => {
      formData.tokenVal = ''
    }

    const confirm = () => {
      robotSettingForm.value.validate((valid) => {
        if (!valid) {
          return
        }
        emit('changeType', formData)
        closePanel()
      })
    }

    return {
      active,
      confirm,
      closePanel,
      robotSettingForm,
      AIModelOptions,
      formData,
      helpTip:
        'API Token是访问大模型API的密钥，需要登录平台(如OpenAI、百度智能云)控制台，【API管理】或【安全设置】页面点击“生成新Token”生成。示例：sk-xxxxxxxxxx。',
      formRules,
      changeModelType
    }
  }
}
</script>
<style lang="less" scoped>
.robot-setting {
  .header {
    font-size: var(--te-base-font-size-1);
    font-weight: var(--te-base-font-weight-7);
    margin-bottom: 12px;
  }
  .help-link {
    font-size: var(--te-base-font-size-1);
    vertical-align: sub;
    margin-left: 4px;
  }
  .bottom-buttons {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    .tiny-button {
      min-width: 40px;
    }
  }
}
</style>
