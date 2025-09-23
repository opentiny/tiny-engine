<template>
  <div ref="robotSetting" class="robot-setting">
    <div class="header">设置</div>
    <tiny-tabs tab-style="button-card" class="full-width-tabs" v-model="state.activeName">
      <tiny-tab-item title="可选模型" :name="EXISTING_MODELS">
        <tiny-form
          :rules="existFormRules"
          ref="robotSettingExistForm"
          label-position="top"
          :model="state.existFormData"
          validate-type="text"
        >
          <tiny-form-item prop="baseUrl" label="大模型平台" label-width="150px">
            <tiny-select
              v-model="state.existFormData.baseUrl"
              :options="AIModelOptions"
              placeholder="请选择"
              @change="changeBaseUrl"
            ></tiny-select>
          </tiny-form-item>
          <tiny-form-item prop="model" label="模型名称" label-width="150px">
            <tiny-select
              v-model="state.existFormData.model"
              :options="state.modelOptions"
              placeholder="请选择"
            ></tiny-select>
          </tiny-form-item>
          <tiny-form-item prop="completeModel" label="补全模型名称" label-width="150px">
            <tiny-select
              v-model="state.existFormData.completeModel"
              :options="state.modelOptions"
              placeholder="请选择"
            ></tiny-select>
          </tiny-form-item>
          <tiny-form-item prop="apiKey" label-width="150px">
            <template #label>
              大模型API Key
              <tiny-tooltip effect="light" :content="apiKeyTip" placement="top">
                <svg-icon class="help-link" name="plugin-icon-plugin-help"></svg-icon>
              </tiny-tooltip>
            </template>
            <tiny-input class="filedName" v-model="state.existFormData.apiKey" placeholder="请输入"></tiny-input>
          </tiny-form-item>
        </tiny-form>
      </tiny-tab-item>
      <tiny-tab-item title="自定义" :name="CUSTOMIZE">
        <tiny-alert size="normal" :closable="false" description="请使用兼容OpenAI SDK的平台模型服务"></tiny-alert>
        <tiny-form
          ref="robotSettingCustomizeForm"
          label-position="top"
          :rules="customizeFormRules"
          :model="state.customizeFormData"
          validate-type="text"
        >
          <tiny-form-item prop="baseUrl" label="大模型平台baseUrl" label-width="150px">
            <tiny-input
              class="filedName"
              v-model="state.customizeFormData.baseUrl"
              placeholder="例如：https://api.deepseek.com/v1"
            ></tiny-input>
          </tiny-form-item>
          <tiny-form-item prop="model" label="模型名称" label-width="150px">
            <tiny-input class="filedName" v-model="state.customizeFormData.model" placeholder="请输入"></tiny-input>
          </tiny-form-item>
          <tiny-form-item prop="completeModel" label="补全模型名称" label-width="150px">
            <tiny-input
              class="filedName"
              v-model="state.customizeFormData.completeModel"
              placeholder="请输入"
            ></tiny-input>
          </tiny-form-item>
          <tiny-form-item prop="apiKey" label-width="150px">
            <template #label>
              大模型API Key
              <tiny-tooltip effect="light" :content="apiKeyTip" placement="top">
                <svg-icon class="help-link" name="plugin-icon-plugin-help"></svg-icon>
              </tiny-tooltip>
            </template>
            <tiny-input class="filedName" v-model="state.customizeFormData.apiKey" placeholder="请输入"></tiny-input>
          </tiny-form-item>
        </tiny-form>
      </tiny-tab-item>
    </tiny-tabs>

    <div class="bottom-buttons">
      <tiny-button @click="closePanel" class="close">取消</tiny-button>
      <tiny-button type="primary" @click="confirm">确定</tiny-button>
    </div>
  </div>
</template>
<script lang="ts">
/* metaService: engine.plugins.robot.RobotSettingPopover */
import { ref, reactive } from 'vue'
import type { Component } from 'vue'
import {
  TinyForm,
  TinyFormItem,
  TinyInput,
  TinyButton,
  TinySelect,
  TinyTooltip,
  TinyTabs,
  TinyTabItem,
  TinyAlert
} from '@opentiny/vue'
import { useRobot } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyForm,
    TinyFormItem,
    TinyInput,
    TinyButton,
    TinySelect,
    TinyTooltip: TinyTooltip as Component,
    TinyTabs,
    TinyTabItem,
    TinyAlert
  },
  setup(props, { emit }) {
    const { EXISTING_MODELS, CUSTOMIZE, getAIModelOptions, robotSettingState } = useRobot()
    const robotSettingExistForm = ref(null)
    const robotSettingCustomizeForm = ref(null)
    const apiKeyTip =
      'API Key 是用于身份验证和权限控制的密钥，允许开发者通过API访问云服务商提供的大模型（如通义千问、deepseek等）。'
    const AIModelOptions = getAIModelOptions()

    const state = reactive({
      activeName: EXISTING_MODELS,
      modelOptions: [],
      existFormData: {
        label: '',
        baseUrl: '',
        model: '',
        completeModel: '',
        apiKey: ''
      },
      customizeFormData: {
        baseUrl: '',
        model: '',
        completeModel: '',
        apiKey: ''
      }
    })

    const customizeFormRules = {
      baseUrl: [{ required: true, message: '必填', trigger: 'blur' }],
      apiKey: [{ required: true, message: '必填', trigger: 'blur' }]
    }

    const existFormRules = {
      apiKey: [{ required: true, message: '必填', trigger: 'blur' }]
    }

    const closePanel = () => {
      emit('close')
    }

    const changeBaseUrl = () => {
      state.existFormData.apiKey = ''
      const options = AIModelOptions.find((option) => option.value === state.existFormData.baseUrl)
      state.modelOptions = options?.model
      state.existFormData.label = options?.label
      state.existFormData.model = state.modelOptions[0]?.value || ''
      state.existFormData.completeModel = state.modelOptions[0]?.value || ''
    }

    const confirm = () => {
      let formData = {}
      let form = null
      if (state.activeName === EXISTING_MODELS) {
        formData = { ...state.existFormData }
        form = robotSettingExistForm
      } else {
        formData = { ...state.customizeFormData }
        form = robotSettingCustomizeForm
      }

      form.value.validate((valid) => {
        if (!valid) {
          return
        }

        robotSettingState.selectedModel.completeModel = formData.completeModel
        localStorage.setItem(
          'AICompleteModel',
          JSON.stringify({
            existModel: state.existFormData.completeModel,
            customizeModel: state.customizeFormData.completeModel
          })
        )
        emit('changeType', {
          activeName: state.activeName,
          ...formData
        })
        closePanel()
      })
    }

    const initFormData = () => {
      const smallModel = JSON.parse(localStorage.getItem('AICompleteModel')) || null
      const initModel = robotSettingState.selectedModel
      const data = {
        baseUrl: initModel.baseUrl,
        model: initModel.model,
        apiKey: initModel.apiKey
      }
      state.activeName = initModel.activeName

      if (state.activeName === EXISTING_MODELS) {
        state.existFormData = {
          label: initModel.label,
          completeModel: smallModel?.existModel ? smallModel.existModel : initModel.completeModel,
          ...data
        }
        const options = AIModelOptions.find((option) => option.value === state.existFormData.baseUrl)
        state.modelOptions = options?.model
      }
      if (state.activeName === CUSTOMIZE) {
        state.customizeFormData = { ...data }
        state.customizeFormData.completeModel = smallModel?.customizeModel
          ? smallModel.customizeModel
          : initModel.completeModel
      }
    }

    initFormData()

    return {
      AIModelOptions,
      EXISTING_MODELS,
      CUSTOMIZE,
      robotSettingExistForm,
      robotSettingCustomizeForm,
      state,
      customizeFormRules,
      existFormRules,
      confirm,
      closePanel,
      changeBaseUrl,
      apiKeyTip
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

  .close {
    margin-right: 8px;
  }

  :deep(.tiny-alert.tiny-alert--normal) {
    height: 32px;
    margin: 0;
    margin-bottom: 8px;
    padding: 6px;

    .tiny-alert__content .tiny-alert__description {
      font-size: 12px;
      margin-right: 0;
    }

    .tiny-alert__icon {
      margin-top: 0;
    }
  }
}
</style>
