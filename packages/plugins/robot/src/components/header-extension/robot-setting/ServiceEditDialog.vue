<template>
  <tiny-dialog-box
    v-model:visible="dialogVisible"
    append-to-body
    :title="isEdit ? '编辑模型服务' : '添加自定义服务'"
    width="600px"
    @close="handleClose"
  >
    <tiny-form
      ref="formRef"
      validate-on-rule-change
      :model="formData"
      :rules="rules"
      class="model-form"
      label-position="top"
      validate-type="text"
    >
      <tiny-form-item prop="label" label="服务名称">
        <tiny-input v-model="formData.label" placeholder="例如：DeepSeek" :disabled="isBuiltIn"></tiny-input>
      </tiny-form-item>

      <tiny-form-item prop="baseUrl" label="Base URL">
        <template #label>
          Base URL
          <tiny-tooltip effect="light" content="支持末尾缺省/chat/completions，# 结尾强制使用输入地址" placement="top">
            <svg-icon class="help-link" name="plugin-icon-plugin-help"></svg-icon>
          </tiny-tooltip>
        </template>
        <tiny-input
          v-model="formData.baseUrl"
          placeholder="例如：https://api.deepseek.com/v1"
          :disabled="isBuiltIn"
        ></tiny-input>
      </tiny-form-item>

      <tiny-form-item prop="apiKey" label="API Key">
        <tiny-input type="password" v-model="formData.apiKey" placeholder="请输入API Key"></tiny-input>
      </tiny-form-item>

      <tiny-divider v-if="!isBuiltIn">模型配置</tiny-divider>

      <div v-if="!isBuiltIn" class="models-section">
        <div v-for="(model, index) in formData.models" :key="index" class="model-item">
          <div class="model-header">
            <span class="model-title">模型 {{ index + 1 }}</span>
            <tiny-button v-if="formData.models && formData.models.length > 1" type="text" @click="removeModel(index)">
              删除
            </tiny-button>
          </div>

          <tiny-form-item :prop="`models[${index}].name`" label="模型名称">
            <tiny-input v-model="model.name" placeholder="例如：deepseek-chat"></tiny-input>
          </tiny-form-item>

          <tiny-form-item :prop="`models[${index}].label`" label="显示名称">
            <tiny-input v-model="model.label" placeholder="例如：DeepSeek Chat"></tiny-input>
          </tiny-form-item>

          <tiny-form-item label="模型能力">
            <div class="capabilities-group">
              <tiny-checkbox v-model="model.capabilities!.toolCalling">工具调用</tiny-checkbox>
              <tiny-checkbox v-model="model.capabilities!.vision">视觉理解</tiny-checkbox>
              <tiny-checkbox v-model="model.capabilities!.compact">快速模型</tiny-checkbox>
            </div>
          </tiny-form-item>
        </div>

        <tiny-button type="text" @click="addModel" class="add-model-btn"> + 添加模型 </tiny-button>
      </div>
    </tiny-form>

    <template #footer>
      <tiny-button @click="handleClose" style="margin: 0px 10px">取消</tiny-button>
      <tiny-button type="primary" @click="handleConfirm">确定</tiny-button>
    </template>
  </tiny-dialog-box>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed } from 'vue'
import {
  TinyDialogBox,
  TinyForm,
  TinyFormItem,
  TinyInput,
  TinyButton,
  TinyTooltip,
  TinyDivider,
  TinyCheckbox
} from '@opentiny/vue'
import type { ModelService, ModelConfig } from '../../../types/setting.types'

const props = defineProps<{
  visible: boolean
  service?: ModelService
}>()

const emit = defineEmits<{
  (e: 'confirm', service: Partial<ModelService>): void
}>()

const dialogVisible = defineModel<boolean>('visible', {
  required: true
})

const formRef = ref<any>(null)
const isEdit = computed(() => Boolean(props.service))
const isBuiltIn = computed(() => props.service?.isBuiltIn ?? false)

const createEmptyModel = (): ModelConfig => ({
  name: '',
  label: '',
  capabilities: {
    toolCalling: false,
    vision: false,
    reasoning: false,
    compact: false
  }
})

const formData = reactive<Partial<ModelService>>({
  label: '',
  baseUrl: '',
  apiKey: '',
  provider: 'custom',
  allowEmptyApiKey: true,
  models: [createEmptyModel()]
})

const baseRules = {
  label: [{ required: true, type: 'string', message: '请输入服务名称' }],
  baseUrl: [{ required: true, type: 'url', message: '请输入正确的模型服务Base URL' }]
}

const rules = computed(() => {
  return formData.models?.reduce((rules: Record<string, any>, _model, index) => {
    rules[`models[${index}].name`] = [{ required: true, type: 'string', message: '请输入模型名称' }]
    rules[`models[${index}].label`] = [{ required: true, type: 'string', message: '请输入显示名称' }]
    return rules
  }, baseRules)
})

const resetForm = () => {
  formData.label = ''
  formData.baseUrl = ''
  formData.apiKey = ''
  formData.provider = 'custom'
  formData.allowEmptyApiKey = true
  formData.models = [createEmptyModel()]
  formRef.value?.clearValidate()
}

const updateForm = (service?: ModelService) => {
  // 先重置为初始状态
  resetForm()

  if (service) {
    formData.label = service.label
    formData.baseUrl = service.baseUrl
    formData.apiKey = service.apiKey
    formData.provider = service.provider
    formData.allowEmptyApiKey = service.allowEmptyApiKey
    formData.models = service.isBuiltIn ? [] : JSON.parse(JSON.stringify(service.models))
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      updateForm(props.service)
    }
  }
)

const addModel = () => {
  formData.models!.push(createEmptyModel())
}

const removeModel = (index: number) => {
  formData.models!.splice(index, 1)
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      return
    }

    const serviceData: Partial<ModelService> = {
      label: formData.label,
      baseUrl: formData.baseUrl,
      apiKey: formData.apiKey,
      provider: formData.provider,
      allowEmptyApiKey: formData.allowEmptyApiKey
    }

    // 内置服务只更新API Key
    if (!isBuiltIn.value) {
      serviceData.models = JSON.parse(JSON.stringify(formData.models))
    }

    if (isEdit.value && props.service) {
      serviceData.id = props.service.id
    }

    emit('confirm', serviceData)
    handleClose()
  })
}
</script>

<style lang="less" scoped>
.model-form {
  overflow-y: auto;
  max-height: calc(70vh);
}

.help-link {
  font-size: var(--te-base-font-size-1);
  vertical-align: sub;
  margin-left: 4px;
  cursor: pointer;
}

.models-section {
  margin-top: 16px;
}

.model-item {
  padding: 16px;
  background: var(--te-base-color-bg-2, #f5f5f5);
  border-radius: 4px;
  margin-bottom: 12px;
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.model-title {
  font-weight: 600;
  font-size: 14px;
}

.capabilities-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.add-model-btn {
  width: 100%;
  margin-top: 8px;
}
</style>
