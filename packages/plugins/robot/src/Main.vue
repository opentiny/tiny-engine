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
          v-model:fullscreen="fullscreen"
          v-model:show="robotVisible"
          :prompt-items="promptItems"
          :bubble-renderers="bubbleRenderers"
          :allowFiles="isVisualModel && robotSettingState.chatMode === CHAT_MODE.Agent"
          :beforeSubmit="checkApiKey"
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
                @changeType="saveSettingState"
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
            <robot-type-select
              :chatMode="robotSettingState.chatMode"
              @typeChange="handleChatModeChange"
            ></robot-type-select>
            <mcp-server
              :position="mcpDrawerPosition"
              v-if="robotSettingState.chatMode === CHAT_MODE.Chat && isToolsModel"
            ></mcp-server>
            <footer-button
              :active="robotSettingState.enableThinking"
              tooltip-content="深度思考"
              @update:active="toggleActive"
            >
              <template #icon>
                <IconThink class="icon-think" />
              </template>
              <template #text>深度思考</template>
            </footer-button>
          </template>
        </robot-chat>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch, type Component } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { TinyNotify, TinyPopover } from '@opentiny/vue'
import { getMetaApi, META_APP, META_SERVICE, useLayout } from '@opentiny/tiny-engine-meta-register'
import type { PromptProps } from '@opentiny/tiny-robot'
import { IconThink } from '@opentiny/tiny-robot-svgs'
import RobotChat from './components/chat/RobotChat.vue'
import McpIconComponent from './components/icons/mcp-icon.vue'
import PageIconComponent from './components/icons/page-icon.vue'
import StudyIconComponent from './components/icons/study-icon.vue'
import RobotSettingPopover from './components/header-extension/RobotSettingPopover.vue'
import RobotTypeSelect from './components/footer-extension/RobotTypeSelect.vue'
import McpServer from './components/footer-extension/McpServer.vue'
import AgentRenderer from './components/renderers/AgentRenderer.vue'
import FooterButton from './components/chat/FooterButton.vue'
import useChat from './composables/useChat'
import useModelConfig from './composables/useConfig'

const { options } = defineProps({
  options: {
    type: Object,
    default: () => ({})
  }
})

const { robotSettingState, CHAT_MODE, getModelCapabilities, saveRobotSettingState, getAIModelOptions } =
  useModelConfig()

const robotVisible = ref(false)
const fullscreen = ref(false)

watch(robotVisible, (visible) => {
  useLayout().layoutState.toolbars.render = visible ? META_APP.Robot : ''
})

const toggleActive = () => {
  robotSettingState.enableThinking = !robotSettingState.enableThinking
  saveRobotSettingState({ enableThinking: robotSettingState.enableThinking })
}

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

const { inputMessage, changeChatMode } = useChat()

const isVisualModel = computed(() => {
  const modelCapabilities = getModelCapabilities(
    robotSettingState.selectedModel.baseUrl,
    robotSettingState.selectedModel.model
  )
  return modelCapabilities?.vision || false
})

const isToolsModel = computed(() => {
  const modelCapabilities = getModelCapabilities(
    robotSettingState.selectedModel.baseUrl,
    robotSettingState.selectedModel.model
  )
  return modelCapabilities?.toolCalling !== false
})

const handleChatModeChange = (type: string) => {
  changeChatMode(type)
  // singleAttachmentItems.value = []
  // imageUrl.value = ''
}

const saveSettingState = () => {}

const closePanel = () => {
  showSettingPopover.value = false
}

const openAIRobot = () => {
  robotVisible.value = true
  useLayout().closeSetting(true)
}

const bubbleRenderers = computed<Record<string, Component>>(() => {
  return robotSettingState.chatMode === CHAT_MODE.Agent
    ? { markdown: AgentRenderer, loading: AgentRenderer }
    : ({} as Record<string, Component>)
})

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

const checkApiKey = () => {
  const provider = getAIModelOptions().find((option) => option.baseUrl === robotSettingState.selectedModel.baseUrl)
  if (
    !robotSettingState.selectedModel.baseUrl ||
    (!robotSettingState.selectedModel.apiKey && provider && !provider.allowEmptyApiKey)
  ) {
    TinyNotify({
      type: 'warning',
      title: '未设置API Key，请检查设置',
      message: '请先设置大模型API Key后重试。',
      position: 'top-right',
      duration: 5000
    })
    setTimeout(() => {
      showSettingPopover.value = true
    }, 1000)
    return false
  }

  return true
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
