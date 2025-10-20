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
          ref="robotChatRef"
          :prompt-items="promptItems"
          :bubbleRenderers="
            aiMode === CHAT_MODE.Agent ? { markdown: BuildLoadingRenderer, loading: BuildLoadingRenderer } : {}
          "
          :allowFiles="isVisualModel() && aiMode === CHAT_MODE.Agent"
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
                @changeType="handleChatModeChange"
                @close="closePanel"
              ></robot-setting-popover>
              <template #reference>
                <span class="setting-icon" @click.stop="showSettingPopover = !showSettingPopover">
                  <svg-icon name="setting" class="operations-setting ml8"> </svg-icon>
                </span>
              </template>
            </tiny-popover>
          </template>
          <template #footer-left>
            <robot-type-select :aiMode="aiMode" @typeChange="typeChange"></robot-type-select>
            <mcp-server :position="mcpDrawerPosition" v-if="aiMode === CHAT_MODE.Chat"></mcp-server>
          </template>
        </robot-chat>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import RobotChat from './components/RobotChat.vue'
import RobotSettingPopover from './components/RobotSettingPopover.vue'
import { TinyPopover } from '@opentiny/vue'
import { useRobot, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import McpIconComponent from './icons/mcp-icon.vue'
import PageIconComponent from './icons/page-icon.vue'
import StudyIconComponent from './icons/study-icon.vue'
import type { PromptProps } from '@opentiny/tiny-robot'
import RobotTypeSelect from './components/RobotTypeSelect.vue'
import McpServer from './mcp/McpServer.vue'
import BuildLoadingRenderer from './BuildLoadingRenderer.vue'
import { updateLLMConfig } from './client'
import useChat from './composables/useChat'

const { options } = defineProps({
  options: {
    type: Object,
    default: () => ({})
  }
})

const robotChatRef = ref(null)

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
    label: '页面搭建场景',
    description: '在当前页面中生成一个满意度调查表单',
    icon: h(PageIconComponent),
    badge: 'NEW'
  },
  {
    label: 'MCP工具',
    description: '帮我查询当前的页面列表',
    icon: h(McpIconComponent),
    badge: 'NEW'
  },
  {
    label: '日常开发问答',
    description: '如何实现前端节流与防抖？',
    icon: h(StudyIconComponent)
  }
]

const showTeleport = ref(false)
const showSettingPopover = ref(false)

const { robotSettingState, CHAT_MODE, AIModelOptions, aiMode } = useRobot()
const { inputMessage } = useChat()

const isVisualModel = () => {
  const platform = AIModelOptions.find((option) => option.value === robotSettingState.selectedModel.baseUrl)
  const modelAbility = platform?.model.find((item) => item.value === robotSettingState.selectedModel.model)
  return modelAbility?.ability?.includes('visual') || false
}

const typeChange = (type: string) => {
  aiMode.value = type
  robotChatRef.value?.createConversation()
  updateLLMConfig({
    apiUrl: type === CHAT_MODE.Agent ? '/app-center/api/ai/chat' : '/app-center/api/chat/completions'
  })
}

const handleChatModeChange = () => {
  // singleAttachmentItems.value = []
  // imageUrl.value = ''
  // endContent()
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
        if (!inputMessage.value) {
          inputMessage.value = '生成图片中UI效果'
        }
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

.setting-icon {
  cursor: pointer;
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
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  @media (min-width: 1080px) {
    :deep(.robot-chat-container-content) {
      width: 1080px;
      margin: 0 auto;
    }
    :deep(.tiny-sender) {
      width: 1080px;
      margin: 0 auto;
      padding: 20px 15px;
    }
    :deep(.tr-prompts) {
      padding: 0px 136px;
    }
  }
}
</style>
