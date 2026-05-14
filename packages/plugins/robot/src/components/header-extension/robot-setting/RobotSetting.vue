<template>
  <div ref="robotSetting" :class="['robot-setting', { 'robot-setting-fullscreen': props.fullscreen }]">
    <div class="setting-header">
      <div class="header-left">
        <svg-icon v-if="!props.fullscreen" name="back" class="back-icon" @click="handleBack"></svg-icon>
      </div>
      <div class="header-title">设置</div>
      <div class="header-right">
        <svg-icon v-if="props.fullscreen" name="cross" class="close-icon" @click="handleBack"></svg-icon>
      </div>
    </div>

    <div class="setting-content">
      <tiny-tabs tab-style="button-card" class="full-width-tabs" v-model="state.activeTab">
        <!-- Tab 1: 模型选择 -->
        <tiny-tab-item title="模型选择" name="model-selection">
          <tiny-form ref="modelSelectionForm" label-position="top" :model="state.modelSelection" validate-type="text">
            <tiny-form-item prop="defaultModel" label="默认助手模型" label-width="150px">
              <tiny-select
                v-model="state.modelSelection.defaultModel"
                filterable
                placeholder="请选择"
                @change="handleModelChange"
                popper-class="model-select-popper"
              >
                <template v-for="item in allModelOptions" :key="item.value">
                  <tiny-option :label="item.label" :value="item.value">
                    <span class="left">{{ item.label }}</span>
                    <div>
                      <tiny-tag v-if="item.capabilities?.toolCalling" type="info" effect="light" size="small"
                        >工具</tiny-tag
                      >
                      <tiny-tag v-if="item.capabilities?.vision" size="mini" type="success">视觉</tiny-tag>
                    </div>
                  </tiny-option>
                </template>
              </tiny-select>
            </tiny-form-item>

            <tiny-form-item prop="quickModel" label-width="150px">
              <template #label>
                快速模型
                <tiny-tooltip
                  effect="light"
                  content="用于代码补全、话题命名等场景。建议选择轻量模型以实现更快的响应速度，例如flash类型或8b/14b模型。"
                  placement="top"
                >
                  <svg-icon class="help-link" name="plugin-icon-plugin-help"></svg-icon>
                </tiny-tooltip>
              </template>
              <tiny-select
                clearable
                v-model="state.modelSelection.quickModel"
                :options="compactModelOptions"
                filterable
                placeholder="请选择"
                @change="handleCompactModelChange"
              ></tiny-select>
            </tiny-form-item>

            <div v-if="selectedDefaultModelInfo" class="model-info">
              <div class="info-item">
                <span class="label">服务：</span>
                <span>{{ selectedDefaultModelInfo.serviceName }}</span>
              </div>
              <div class="info-item">
                <span class="label">API Key：</span>
                <tiny-tag :type="selectedDefaultModelInfo.hasApiKey ? 'success' : 'warning'" size="mini">
                  {{ selectedDefaultModelInfo.hasApiKey ? '已配置' : '未配置' }}
                </tiny-tag>
              </div>
            </div>
          </tiny-form>
        </tiny-tab-item>

        <!-- Tab 2: 模型服务 -->
        <tiny-tab-item title="模型服务" name="services">
          <div class="services-container">
            <div class="services-list">
              <div v-for="service in robotSettingState.services" :key="service.id" class="service-card">
                <div class="service-header">
                  <div class="service-title">
                    <h4>{{ service.label }}</h4>
                    <tiny-tag v-if="service.isBuiltIn" size="mini" type="info">内置</tiny-tag>
                  </div>
                  <div class="service-actions">
                    <tiny-button size="mini" @click="editService(service)">
                      {{ service.isBuiltIn ? '配置' : '编辑' }}
                    </tiny-button>
                    <tiny-popconfirm
                      v-if="!service.isBuiltIn"
                      :title="'确定删除' + service.label + '吗？'"
                      type="info"
                      trigger="click"
                      @confirm="handleDeleteService(service.id)"
                    >
                      <template #reference>
                        <tiny-button v-if="!service.isBuiltIn" size="mini" type="danger"> 删除 </tiny-button>
                      </template>
                    </tiny-popconfirm>
                  </div>
                </div>
                <div class="service-info">
                  <div class="info-row">
                    <span class="info-label">Base URL:</span>
                    <span class="info-value">{{ service.baseUrl }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">模型数量:</span>
                    <span class="info-value">{{ service.models.length }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">API Key:</span>
                    <tiny-tag :type="service.apiKey ? 'success' : 'warning'" size="mini">
                      {{ service.apiKey ? '已配置' : '未配置' }}
                    </tiny-tag>
                  </div>
                </div>
                <div v-if="!service.isBuiltIn" class="service-models">
                  <div class="models-header">包含模型：</div>
                  <div class="models-tags">
                    <tiny-tag v-for="model in service.models" :key="model.name" size="mini">
                      {{ model.label }}
                    </tiny-tag>
                  </div>
                </div>
              </div>
            </div>
            <tiny-button type="primary" @click="addService" class="add-service-btn"> + 添加自定义服务 </tiny-button>
          </div>
        </tiny-tab-item>
      </tiny-tabs>
    </div>

    <!-- 服务编辑对话框 -->
    <service-edit-dialog
      v-model:visible="state.showServiceDialog"
      :service="state.editingService"
      @confirm="handleServiceConfirm"
    ></service-edit-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import {
  TinyForm,
  TinyFormItem,
  TinyButton,
  TinySelect,
  TinyOption,
  TinyTooltip,
  TinyTabs,
  TinyTabItem,
  TinyTag,
  TinyPopconfirm
} from '@opentiny/vue'
import useModelConfig from '../../../composables/core/useConfig'
import type { ModelService } from '../../../types/setting.types'
import ServiceEditDialog from './ServiceEditDialog.vue'
import { useNotify } from '@opentiny/tiny-engine-meta-register'

const props = defineProps({
  fullscreen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const {
  robotSettingState,
  saveRobotSettingState,
  getAllAvailableModels,
  getCompactModels,
  addCustomService,
  updateService,
  deleteService,
  getServiceById
} = useModelConfig()

const modelSelectionForm = ref(null)

const getModelValue = (serviceId: string, modelName: string) => {
  return serviceId && modelName ? `${serviceId}::${modelName}` : ''
}

const state = reactive({
  activeTab: 'model-selection',
  modelSelection: {
    defaultModel: getModelValue(robotSettingState.defaultModel.serviceId, robotSettingState.defaultModel.modelName),
    quickModel: getModelValue(robotSettingState.quickModel.serviceId, robotSettingState.quickModel.modelName)
  },
  showServiceDialog: false,
  editingService: undefined as ModelService | undefined
})

// 获取所有可用模型选项
const allModelOptions = computed(() => {
  return getAllAvailableModels().map((model) => ({
    label: model.displayLabel,
    value: model.value,
    capabilities: model.capabilities
  }))
})

// 获取快速模型选项
const compactModelOptions = computed(() => {
  return getCompactModels().map((model) => ({
    label: model.displayLabel,
    value: model.value
  }))
})

// 获取当前选择的默认模型信息
const selectedDefaultModelInfo = computed(() => {
  const [serviceId] = state.modelSelection.defaultModel.split('::')
  const service = getServiceById(serviceId)
  if (!service) return null

  return {
    serviceName: service.label,
    hasApiKey: Boolean(service.apiKey)
  }
})

const handleBack = () => {
  state.showServiceDialog = false
  emit('close')
}

const handleModelChange = () => {
  const [defaultServiceId, defaultModelName] = state.modelSelection.defaultModel.split('::')

  // 检查API Key
  const defaultService = getServiceById(defaultServiceId)
  if (defaultService && !defaultService.apiKey && !defaultService.allowEmptyApiKey) {
    useNotify({
      type: 'warning',
      title: '未配置API Key',
      message: `请先为 ${defaultService.label} 配置API Key`
    })
    state.activeTab = 'services'
    return
  }

  const updatedState = {
    defaultModel: {
      serviceId: defaultServiceId,
      modelName: defaultModelName
    }
  }
  saveRobotSettingState(updatedState)
}

const handleCompactModelChange = () => {
  const [quickServiceId = '', quickModelName = ''] = (state.modelSelection.quickModel || '').split('::')
  const updatedState = {
    quickModel: {
      serviceId: quickServiceId,
      modelName: quickModelName
    }
  }
  saveRobotSettingState(updatedState)
}

const addService = () => {
  state.editingService = undefined
  state.showServiceDialog = true
}

const editService = (service: ModelService) => {
  state.editingService = JSON.parse(JSON.stringify(service))
  state.showServiceDialog = true
}

const handleDeleteService = (serviceId: string) => {
  deleteService(serviceId)
}

const handleServiceConfirm = (serviceData: Partial<ModelService>) => {
  if (serviceData.id) {
    // 更新现有服务
    updateService(serviceData.id, serviceData)
  } else {
    // 添加新服务
    addCustomService(serviceData as any)
  }
}
</script>

<style lang="less" scoped>
.robot-setting {
  width: 420px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;

  &.robot-setting-fullscreen {
    position: fixed;
    top: 90px;
    right: 0px;
    z-index: 200;
    height: calc(100vh - 90px);
  }

  .setting-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--te-base-color-border, #dcdcdc);
    background-color: #fff;
    flex-shrink: 0;

    .header-left,
    .header-right {
      width: 40px;
      display: flex;
      align-items: center;
    }

    .header-right {
      justify-content: flex-end;
    }

    .back-icon,
    .close-icon {
      font-size: 20px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--te-base-color-bg-2, #f5f5f5);
      }
    }

    .header-title {
      flex: 1;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .setting-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    :deep(.tiny-tabs) {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .tiny-tabs__header {
        padding: 16px 24px 0;
        background-color: #fff;
        flex-shrink: 0;
      }

      .tiny-tabs__content {
        flex: 1;
        overflow-y: auto;
        padding: 16px 24px;
      }
    }
  }

  .help-link {
    font-size: var(--te-base-font-size-1);
    vertical-align: sub;
    margin-left: 4px;
    cursor: pointer;
  }

  .model-info {
    margin-top: 16px;
    padding: 12px;
    background: var(--te-base-color-bg-2, #f5f5f5);
    border-radius: 4px;

    .info-item {
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-weight: 600;
        margin-right: 8px;
      }
    }
  }

  .services-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .services-list {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .service-card {
    padding: 16px;
    margin-bottom: 12px;
    background: #fff;
    border-radius: 4px;
    border: 1px solid var(--te-base-color-border, #dcdcdc);

    &:hover {
      border-color: var(--te-base-color-brand-6, #5e7ce0);
    }
  }

  .service-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .service-title {
    display: flex;
    align-items: center;
    gap: 8px;

    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .service-actions {
    display: flex;
    gap: 8px;
  }

  .service-info {
    margin-bottom: 12px;

    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .info-label {
      font-weight: 600;
      margin-right: 8px;
      min-width: 80px;
    }

    .info-value {
      color: var(--te-base-color-text-3, #575d6c);
      word-break: break-all;
    }
  }

  .service-models {
    padding-top: 12px;
    border-top: 1px solid var(--te-base-color-border, #dcdcdc);

    .models-header {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .models-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .add-service-btn {
    width: 100%;
    flex-shrink: 0;
  }

  .close {
    margin-right: 8px;
  }
}
</style>
<style lang="less">
.model-select-popper .tiny-option .tiny-option-wrapper {
  padding-right: 4px;
  display: flex;
  justify-content: space-between;
}
</style>
