<template>
  <div class="robot">
    <toolbar-base
      content="AI对话框"
      :icon="props.options.icon?.default || props.options?.icon"
      :options="props.options"
      @click-api="openAIRobot"
    >
    </toolbar-base>
    <Teleport v-if="showTeleport" defer :to="fullscreen ? 'body' : '.tiny-engine-right-robot'">
      <div
        class="robot-chat-container"
        :class="{ 'robot-chat-container-fullscreen': fullscreen, 'fullscreen-with-setting': fullscreen && showSetting }"
      >
        <robot-chat
          v-show="!showSetting || fullscreen"
          v-model:messages="messages"
          v-model:fullscreen="fullscreen"
          v-model:show="robotVisible"
          v-model:input="inputMessage"
          :status="messageState.status"
          :prompt-items="promptItems"
          :bubble-renderers="bubbleRenderers"
          :allowFiles="isVisualModel && robotSettingState.chatMode === ChatMode.Agent"
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
            <span class="setting-icon" @click.stop="handleOpenSetting">
              <svg-icon name="setting" class="operations-setting ml8"> </svg-icon>
            </span>
            <tr-icon-button :icon="IconNewSession" size="28" svgSize="20" @click="createConversation()" />
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
          </template>
          <template #footer-left>
            <robot-type-select
              :chatMode="robotSettingState.chatMode"
              @typeChange="handleChatModeChange"
            ></robot-type-select>
            <mcp-server
              :position="mcpDrawerPosition"
              v-if="robotSettingState.chatMode === ChatMode.Chat && isToolsModel"
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
        <robot-setting v-if="showSetting" :fullscreen="fullscreen" @close="handleCloseSetting"></robot-setting>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { META_APP, useLayout, useNotify } from '@opentiny/tiny-engine-meta-register'
import { type PopupConfig, type PromptProps, TrIconButton } from '@opentiny/tiny-robot'
import { IconThink, IconNewSession } from '@opentiny/tiny-robot-svgs'
import RobotChat from './components/chat/RobotChat.vue'
import FooterButton from './components/chat/FooterButton.vue'
import { IconMcp, IconPage, IconStudy } from './components/icons'
import { History as RobotHistory, RobotSetting } from './components/header-extension'
import { RobotTypeSelect, McpServer } from './components/footer-extension'
import { AgentRenderer } from './components/renderers'
import useChat from './composables/useChat'
import useModelConfig from './composables/core/useConfig'
import { ChatMode } from './types/mode.types'
import apiService from './services/api'

const props = defineProps({
  options: {
    type: Object,
    default: () => ({})
  }
})

const { robotSettingState, getModelCapabilities, updateThinkingState, getSelectedModelInfo } = useModelConfig()

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
const showSetting = ref(false)

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
  updateThinkingState(!robotSettingState.enableThinking)
}

const handleDeleteConversation = (action: any, item: any) => {
  if (action.id === 'delete') deleteConversation(item.id!)
}

const handleAbortRequest = () => {
  abortRequest()
  if (messages.value.at(-1)) {
    messages.value.at(-1)!.aborted = true
  }
}

const isVisualModel = computed(() => {
  const modelCapabilities = getModelCapabilities(
    robotSettingState.defaultModel.serviceId,
    robotSettingState.defaultModel.modelName
  )
  return modelCapabilities?.vision || false
})

const isToolsModel = computed(() => {
  const modelCapabilities = getModelCapabilities(
    robotSettingState.defaultModel.serviceId,
    robotSettingState.defaultModel.modelName
  )
  return modelCapabilities?.toolCalling !== false
})

const handleChatModeChange = (type: string) => {
  changeChatMode(type)
}

const checkApiKey = () => {
  const provider = getSelectedModelInfo().service

  if (!provider?.baseUrl || (!provider?.apiKey && !provider?.allowEmptyApiKey)) {
    useNotify({
      type: 'warning',
      title: '未设置API Key，请检查设置',
      message: '请先设置大模型API Key后重试。'
    })
    setTimeout(() => {
      showSetting.value = true
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

const handleOpenSetting = () => {
  showSetting.value = true
}

const handleCloseSetting = () => {
  showSetting.value = false
}

const openAIRobot = () => {
  createConversation()
  robotVisible.value = true
  useLayout().closeSetting(true)
}

// 当前Robot的bubbleRenderers无法做到响应式更新，因此Agent模式的type要与Chat模式不同
const bubbleRenderers = { 'agent-content': AgentRenderer, 'agent-loading': AgentRenderer }

const handleFileSelected = async (formData: FormData, updateAttachment: (resourceUrl: string) => void) => {
  try {
    const { resourceUrl } = await apiService.uploadFile(formData)
    updateAttachment(resourceUrl)
    if (!inputMessage.value) {
      inputMessage.value = '生成图片中UI效果'
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('上传失败', error)
    updateAttachment('')
    useNotify({
      message: '文件上传失败，请重试',
      type: 'error'
    })
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

  &.fullscreen-with-setting {
    display: flex;

    :deep(.tiny-container) {
      flex: 1;
      width: auto;
    }
  }
}

.robot-setting {
  height: 100%;
  background-color: #fff;
  border-left: 1px solid var(--te-layout-common-border-color);
}
</style>
