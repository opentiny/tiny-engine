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
          v-model:messages="messages"
          v-model:fullscreen="fullscreen"
          v-model:show="robotVisible"
          v-model:input="inputMessage"
          :status="messageState.status"
          :prompt-items="promptItems"
          :bubble-renderers="bubbleRenderers"
          :allowFiles="isVisualModel && robotSettingState.chatMode === CHAT_MODE.Agent"
          :beforeSubmit="checkApiKey"
          :promptClickHandler="promptClickHandler"
          @fileSelected="handleFileSelected"
          @sendMessage="sendUserMessage"
          @abort="handleAbortRequest"
        >
          <template #history-list-prefix="{ item }">
            <svg-icon v-if="item?.metadata?.chatMode === 'agent'" name="intelligent-construction"></svg-icon>
            <svg-icon v-else name="chat"></svg-icon>
          </template>
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
            <robot-history
              :conversation-state="conversationState"
              @item-click="(item) => switchConversation(item.id!)"
              @item-action="handleDeleteConversation"
              @item-title-change="(title, item) => updateTitle(item.id!, title)"
            >
              <template #history-list-prefix="{ item }">
                <svg-icon v-if="item?.metadata?.chatMode === 'agent'" name="intelligent-construction"></svg-icon>
                <svg-icon v-else name="chat"></svg-icon>
              </template>
            </robot-history>
            <tr-icon-button :icon="IconNewSession" size="28" svgSize="20" @click="createConversation()" />
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
import { computed, h, onMounted, ref, watch } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { TinyNotify, TinyPopover } from '@opentiny/vue'
import { META_APP, useLayout } from '@opentiny/tiny-engine-meta-register'
import { type PopupConfig, type PromptProps, TrIconButton } from '@opentiny/tiny-robot'
import { IconThink, IconNewSession } from '@opentiny/tiny-robot-svgs'
import RobotChat from './components/chat/RobotChat.vue'
import FooterButton from './components/chat/FooterButton.vue'
import { IconMcp, IconPage, IconStudy } from './components/icons'
import { History as RobotHistory, RobotSettingPopover } from './components/header-extension'
import { RobotTypeSelect, McpServer } from './components/footer-extension'
import { AgentRenderer } from './components/renderers'
import useChat from './composables/useChat'
import useModelConfig from './composables/core/useConfig'
import apiService from './services/api'

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

const mcpDrawerPosition = computed<PopupConfig>(() => {
  return {
    type: 'fixed',
    position: {
      top: 'var(--base-top-panel-height)',
      bottom: 0,
      ...(fullscreen.value ? { left: 0 } : { right: 'var(--tr-container-width)' })
    }
  }
})

const promptItems: Array<PromptProps & { mode?: 'chat' | 'agent' }> = [
  {
    label: '页面搭建场景',
    description: '在当前页面中生成一个满意度调查表单',
    mode: 'agent',
    icon: h(IconPage),
    badge: 'NEW'
  },
  {
    label: 'MCP工具',
    description: '帮我查询当前的页面列表',
    mode: 'chat',
    icon: h(IconMcp),
    badge: 'NEW'
  },
  {
    label: '日常开发问答',
    description: '如何实现前端节流与防抖？',
    mode: 'chat',
    icon: h(IconStudy)
  }
]

const showTeleport = ref(false)
const showSettingPopover = ref(false)

const {
  inputMessage,
  messages,
  messageState,
  changeChatMode,
  abortRequest,
  initChatClient,
  sendUserMessage,
  conversationState,
  createConversation,
  switchConversation,
  deleteConversation,
  updateTitle
} = useChat()

const toggleActive = () => {
  robotSettingState.enableThinking = !robotSettingState.enableThinking
  saveRobotSettingState({ enableThinking: robotSettingState.enableThinking })
}

const handleDeleteConversation = (action: any, item: any) => {
  if (action.id === 'delete') deleteConversation(item.id!)
}

const handleAbortRequest = () => {
  abortRequest()
  messages.value.at(-1)!.aborted = true
}

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

const promptClickHandler = (item: PromptProps & { mode?: 'chat' | 'agent' }) => {
  if (!checkApiKey() || !item.mode) {
    return
  }
  if (item.mode !== robotSettingState.chatMode) {
    changeChatMode(item.mode)
  }
  messages.value.push({
    role: 'user',
    content: item.description || '',
    renderContent: [{ type: 'text', content: item.description }]
  })
  sendUserMessage()
}

const saveSettingState = () => {}

const closePanel = () => {
  showSettingPopover.value = false
}

const openAIRobot = () => {
  createConversation()
  robotVisible.value = true
  useLayout().closeSetting(true)
}

// 当前Robot的bubbleRenderers无法做到响应式更新，因此Agent模式的type要与Chat模式不同
const bubbleRenderers = { 'agent-content': AgentRenderer, 'agent-loading': AgentRenderer }

const handleFileSelected = (formData: FormData, updateAttachment: (resourceUrl: string) => void) => {
  try {
    apiService.uploadFile(formData).then((res: any) => {
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
  initChatClient()
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
