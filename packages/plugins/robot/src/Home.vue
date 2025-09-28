<template>
  <div class="robot">
    <toolbar-base
      content="AI对话框"
      :icon="options.icon?.default || options?.icon"
      :options="options"
      @click-api="openAIRobot"
    >
    </toolbar-base>
    <Teleport v-if="showTeleport" defer :to="fullscreen ? 'body' : '.tiny-engine-right-robot'">
      <div class="robot-chat-container" :class="{ 'robot-chat-container-fullscreen': fullscreen }">
        <robot-chat
          :ref="robotChatRef"
          :prompt-items="promptItems"
          :allowFiles="isVisualModel() && aiType === AI_MODES.Agent"
          @fileSelected="handleFileSelected"
        >
          <template #operations>
            <tiny-popover
              width="290"
              trigger="manual"
              v-model="showSettingPopover"
              :visible-arrow="false"
              popper-class="setting-popover"
            >
              <robot-setting-popover
                v-if="showSettingPopover"
                @changeType="changeModel"
                @close="closePanel"
              ></robot-setting-popover>
              <template #reference>
                <span class="chat-title-dropdown" @click.stop="showSettingPopover = true">
                  <svg-icon name="setting" class="operations-setting ml8"> </svg-icon>
                </span>
              </template>
            </tiny-popover>
          </template>
          <template #footer-left>
            <robot-type-select :aiType="aiType" @typeChange="typeChange"></robot-type-select>
            <mcp-server :position="mcpDrawerPosition" v-if="aiType === AI_MODES.Chat"></mcp-server>
          </template>
        </robot-chat>
        <tiny-dialog-box v-model:visible="showPreview" title="当前AI渲染效果" width="80%">
          <schema-renderer v-if="showPreview" :schema="currentSchema"></schema-renderer>
        </tiny-dialog-box>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import RobotChat from './components/RobotChat.vue'
import RobotSettingPopover from './components/RobotSettingPopover.vue'
import { TinyPopover, TinyDialogBox } from '@opentiny/vue'
import { useRobot, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import McpIconComponent from './icons/mcp-icon.vue'
import PageIconComponent from './icons/page-icon.vue'
import StudyIconComponent from './icons/study-icon.vue'
import type { PromptProps } from '@opentiny/tiny-robot'
import SchemaRenderer from '@opentiny/tiny-schema-renderer'
import RobotTypeSelect from './components/RobotTypeSelect.vue'
import McpServer from './mcp/McpServer.vue'
import { updateLLMConfig } from './client'

const { options } = defineProps({
  options: {
    type: Object,
    default: () => ({})
  }
})

const robotChatRef = ref('robotChatRef')

const fullscreen = computed(() => {
  return robotChatRef.value?.fullscreen
})

const mcpDrawerPosition = computed(() => {
  return {
    type: 'fixed',
    position: {
      top: 'var(--base-top-panel-height)',
      bottom: 0,
      ...(fullscreen.value ? { left: 0 } : { right: 'var(--tr-container-width)' })
    }
  }
})

const promptItems: PromptProps[] = [
  {
    label: 'MCP工具',
    description: '帮我查询当前的页面列表',
    icon: h(McpIconComponent),
    badge: 'NEW'
  },
  {
    label: '页面搭建场景',
    description: '给当前页面中添加一个问卷调查表单',
    icon: h(PageIconComponent)
  },
  {
    label: '学习/知识型场景',
    description: 'Vue3 和 React 有什么区别？',
    icon: h(StudyIconComponent)
  }
]

const showPreview = ref(false)
const currentSchema = ref(null)
const showTeleport = ref(false)
const showSettingPopover = ref(false)

const { robotSettingState, AI_MODES, AIModelOptions } = useRobot()

const isVisualModel = () => {
  const platform = AIModelOptions.find((option) => option.value === robotSettingState.selectedModel.baseUrl)
  const modelAbility = platform.model.find((item) => item.value === robotSettingState.selectedModel.model)
  return modelAbility?.ability?.includes('visual') || false
}

const aiType = ref(AI_MODES.Agent)

const typeChange = (type: string) => {
  aiType.value = type
  robotChatRef.value?.createConversation()
  updateLLMConfig({
    apiUrl: type === AI_MODES.Agent ? '/app-center/api/ai/chat' : '/app-center/api/chat/completions'
  })
}

const changeApiKey = () => {
  localStorage.removeItem('aiChat')
}

const changeModel = (model) => {
  robotSettingState.selectedModel = {
    label: model.label || model.model,
    activeName: model.activeName,
    baseUrl: model.baseUrl,
    model: model.model,
    completeModel: model.completeModel,
    apiKey: model.apiKey
  }
  // singleAttachmentItems.value = []
  // imageUrl.value = ''
  // endContent()

  if (
    robotSettingState.selectedModel.apiKey !== model.apiKey &&
    robotSettingState.selectedModel.baseUrl === model.baseUrl &&
    robotSettingState.selectedModel.model === model.model
  ) {
    robotSettingState.selectedModel.apiKey = model.apiKey
    changeApiKey()
  }
}

const closePanel = () => {
  showSettingPopover.value = false
}

const openAIRobot = () => {
  robotChatRef.value?.openAIRobot()
}

const handleFileSelected = (formData: unknown, updateAttachment: (resourceUrl: string) => void) => {
  try {
    getMetaApi(META_SERVICE.Http)
      .post('/material-center/api/resource/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then((res: any) => {
        updateAttachment(res?.resourceUrl)
      })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('上传失败', error)
    updateAttachment('')
  }
}

onMounted(async () => {
  setTimeout(() => {
    showTeleport.value = true
  }, 1000)
})
</script>

<style scoped lang="less">
.robot {
  margin-right: 8px;
}
.robot-chat-container {
  height: 100%;
}
.setting-popover {
  .robot-setting .bottom-buttons .tiny-button {
    margin-left: 10px;
  }
}

.operations-setting {
  font-size: 28px;
  padding: 4px;
}

.robot-chat-container-fullscreen {
  :deep(.tiny-container) {
    container-type: inline-size;

    &.tr-container.tr-container {
      top: var(--base-top-panel-height);
      position: fixed;
      height: auto;
    }
  }
  .operations-setting {
    font-size: 20px;
  }
  @media (min-width: 1280px) {
    :deep(.robot-chat-container-content) {
      width: 1280px;
      margin: 0 auto;
    }
    :deep(.footer-sender) {
      width: 1280px;
      margin: 0 auto;
      padding: 20px 15px;
    }
  }
}
</style>
