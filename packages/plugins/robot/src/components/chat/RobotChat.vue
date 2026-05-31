<template>
  <tr-container
    v-if="robotVisible"
    v-model:fullscreen="fullscreen"
    v-model:show="robotVisible"
    title=""
    class="tiny-container"
  >
    <template #operations>
      <slot name="operations"></slot>
    </template>

    <div class="robot-chat-container-content" ref="chatContainerRef">
      <div v-if="messages.filter((item) => item.role !== 'system').length === 0">
        <tr-welcome title="AI助手" description="您好，我是您的开发小助手" :icon="welcomeIcon" class="robot-welcome">
        </tr-welcome>
        <tr-prompts
          :items="props.promptItems"
          :wrap="true"
          item-class="prompt-item"
          class="tiny-prompts"
          @item-click="handlePromptItemClick"
        ></tr-prompts>
      </div>
      <tr-bubble-provider v-else :content-renderer-matches="contentRendererMatches">
        <tr-bubble-list
          :messages="messages"
          :role-configs="roleConfigs"
          :content-resolver="resolveMessageContent"
          auto-scroll
          class="robot-bubble-list"
        >
          <template #content-footer="{ messages }">
            <div v-if="showAborted && messages[0]?.aborted" class="aborted">已中止</div>
          </template>
        </tr-bubble-list>
      </tr-bubble-provider>
    </div>

    <template #footer>
      <div class="chat-input">
        <tr-sender
          ref="senderRef"
          mode="multiple"
          v-model="inputMessage"
          :placeholder="GeneratingStatus.includes(props.status) ? '正在思考中...' : '请输入您的问题'"
          :clearable="true"
          :loading="GeneratingStatus.includes(props.status)"
          :showWordLimit="false"
          @submit="handleSendMessage"
          @cancel="handleAbortRequest"
        >
          <template #header v-if="selectedAttachments.length > 0">
            <div>
              <tr-attachments
                ref="singleAttachmentRef"
                v-model:items="selectedAttachments"
                variant="card"
                wrap
                @retry="handleSingleFileRetry"
              >
              </tr-attachments>
            </div>
          </template>
          <template #footer>
            <slot name="footer-left"></slot>
          </template>
          <template #footer-right>
            <VoiceButton :speech-config="{ lang: 'zh-CN', continuous: false }" />
            <UploadButton
              v-if="selectedAttachments.length < 1 && props.allowFiles"
              accept="image/*"
              :multiple="false"
              @select="handleSingleFilesSelected"
            />
          </template>
        </tr-sender>
      </div>
    </template>
  </tr-container>
</template>

<script setup lang="ts">
import { ref, computed, h, resolveComponent, type Component, type CSSProperties, type PropType, watch } from 'vue'
import {
  TrBubbleList,
  TrBubbleProvider,
  TrContainer,
  TrPrompts,
  TrSender,
  TrWelcome,
  TrAttachments,
  UploadButton,
  VoiceButton,
  BubbleRenderers,
  BubbleRendererMatchPriority,
  type BubbleRoleConfig,
  type PromptProps,
  type RawFileAttachment,
  type BubbleContentRendererMatch
} from '@opentiny/tiny-robot'
import { type ChatMessage } from '@opentiny/tiny-robot-kit'
import { GeneratingStatus } from '../../constants/status'
import { LoadingRenderer, MarkdownRenderer, ImgRenderer } from '../renderers'
import { useNotify } from '@opentiny/tiny-engine-meta-register'

const props = defineProps({
  promptItems: {
    type: Array as PropType<PromptProps[]>,
    default: () => []
  },
  promptClickHandler: {
    type: Function
  },
  status: { type: String },
  chatMode: { type: String },
  allowFiles: {
    type: Boolean,
    default: false
  },
  showAborted: {
    type: Boolean,
    default: true
  },
  bubbleRenderers: {
    type: Object as PropType<Record<string, Component>>,
    default: () => ({})
  },
  beforeSubmit: {
    type: Function,
    default: () => true
  }
})

const emit = defineEmits(['fileSelected', 'sendMessage', 'abort'])

const selectedAttachments = ref([])

const robotVisible = defineModel<boolean>('show', { required: true })
const fullscreen = defineModel<boolean>('fullscreen')
const inputMessage = defineModel<string>('input', { required: true })
const messages = defineModel<ChatMessage[]>('messages', { required: true })
const senderRef = ref<InstanceType<typeof TrSender> | null>(null)

watch(
  () => props.allowFiles,
  (value) => {
    if (!value) {
      selectedAttachments.value = []
    }
  }
)

const contentRendererMatches = computed<BubbleContentRendererMatch[]>(() => [
  {
    priority: BubbleRendererMatchPriority.LOADING,
    find: (message) => Boolean(message.loading),
    renderer: LoadingRenderer
  },
  ...Object.entries(props.bubbleRenderers).map(([type, renderer]) => ({
    priority: BubbleRendererMatchPriority.NORMAL,
    find: (_message: any, content: any) => content?.type === type,
    renderer
  })),
  {
    priority: BubbleRendererMatchPriority.NORMAL,
    find: (message: any, content: any) => content?.type === 'tool' && message.tool_calls?.length,
    renderer: BubbleRenderers.Tools
  },
  {
    priority: BubbleRendererMatchPriority.NORMAL,
    find: (message: any, content: any) =>
      !message.loading && message.content && (!content?.type || ['markdown', 'text'].includes(content.type)),
    renderer: MarkdownRenderer
  },
  {
    priority: BubbleRendererMatchPriority.NORMAL,
    find: (message: any) => message?.content?.[0]?.type === 'img' || message?.content?.[0]?.type === 'image',
    renderer: ImgRenderer
  }
])

const isAgentMessage = (message: any) => {
  const hasAgentContent = message.renderContent?.some((item: any) => {
    return item.type === 'agent-content' || item.type === 'agent-loading'
  })
  return message.metadata?.chatMode === 'agent' || hasAgentContent
}

const resolveAgentRenderContent = (message: any) => {
  if (!isAgentMessage(message) || message.role !== 'assistant') {
    return message.renderContent
  }

  const isLastMessage = messages.value.at(-1) === message
  const isGenerating = Boolean(message.loading) || (isLastMessage && GeneratingStatus.includes(props.status as any))
  const renderContent = isGenerating
    ? message.renderContent
    : message.renderContent.filter((item: any) => item.type !== 'agent-loading')
  const agentContents = renderContent.filter((item: any) => item.type === 'agent-content')
  const finalStatus = agentContents.findLast((item: any) => ['success', 'failed', 'fix'].includes(item.status))?.status

  return renderContent.map((item: any) => {
    if (item.type !== 'agent-content' || isGenerating) {
      return item
    }

    if (!item.status || item.status === 'loading') {
      return {
        ...item,
        status: finalStatus || message.metadata?.agentStatus || 'failed'
      }
    }

    return item
  })
}

// 处理文件选择事件
const handleSingleFilesSelected = (files: File[] | null, retry = false) => {
  if (!files?.length) return
  if (retry) {
    Object.assign(selectedAttachments.value[0], {
      status: 'uploading'
    })
  } else {
    if (files.length > 1) {
      useNotify({
        type: 'error',
        message: '当前仅支持上传一张图片'
      })
      return
    }

    // 将选中的文件转换为 Attachment 格式并添加到附件列表
    const newAttachments = Array.from(files).map((file) => ({
      size: file.size,
      rawFile: file
    }))
    selectedAttachments.value.push(...newAttachments)
  }

  // 开始上传
  const formData = new FormData()
  const fileData = files[0]
  formData.append('file', fileData)

  const updateAttachment = (resourceUrl: string) => {
    if (resourceUrl) {
      Object.assign(selectedAttachments.value[0], {
        status: 'success',
        url: resourceUrl
      })
    } else {
      Object.assign(selectedAttachments.value[0], {
        status: 'error'
      })
    }
  }

  emit('fileSelected', formData, updateAttachment)
}

const handleSingleFileRetry = (file: RawFileAttachment) => {
  handleSingleFilesSelected([file.rawFile], true)
}

const getSvgIcon = (name: string, style?: CSSProperties) => {
  return h(resolveComponent('svg-icon'), { name, style: { fontSize: '32px', ...style } })
}
const aiAvatar = getSvgIcon('AI')
const welcomeIcon = getSvgIcon('AI', { fontSize: '44px' })

const resolveMessageContent = (message: any) => {
  if (Array.isArray(message.renderContent) && message.renderContent.length > 0) {
    return resolveAgentRenderContent(message)
  }

  if (isAgentMessage(message) && message.role === 'assistant' && message.content) {
    const agentStatus = ['success', 'failed', 'fix'].includes(message.metadata?.agentStatus)
      ? message.metadata.agentStatus
      : 'failed'
    return [
      {
        type: 'agent-content',
        status: agentStatus,
        content: message.content
      }
    ]
  }

  return message.content
}

const roleConfigs: Record<string, BubbleRoleConfig> = {
  assistant: {
    placement: 'start',
    avatar: aiAvatar
  },
  user: {
    placement: 'end'
  },
  system: {
    hidden: true
  }
}

// 发送消息
const handleSendMessage = async (content: string) => {
  const messageContent = content || inputMessage.value
  if (!messageContent || (typeof messageContent === 'string' && !messageContent.trim())) {
    return
  }

  let result = props.beforeSubmit?.(content)
  if (result && typeof result.then === 'function') {
    result = await result
  }
  if (result !== true) {
    return
  }

  const userMessage: ChatMessage = {
    role: 'user',
    content: messageContent
  }
  const files = selectedAttachments.value.filter((item) => item.status === 'success')
  if (files.length > 0) {
    const fileMessages: ChatMessage[] = files.map((file) => ({
      role: 'user',
      content: '',
      renderContent: [
        {
          type: 'img',
          content: file.url
        }
      ]
    }))
    messages.value.push(...fileMessages)
    userMessage.content = files
      .map((item) => ({
        type: 'image_url',
        image_url: {
          url: item.url
        }
      }))
      .concat({
        type: 'text',
        text: messageContent
      })
    userMessage.renderContent = [
      {
        type: 'text',
        content: messageContent
      }
    ]
  }
  messages.value.push(userMessage)
  inputMessage.value = ''
  senderRef.value?.clear()
  selectedAttachments.value = []
  emit('sendMessage')
}

const handleAbortRequest = () => {
  emit('abort')
}

const handlePromptItemClick = (ev: unknown, item: { description?: string }) => {
  if (props.promptClickHandler && typeof props.promptClickHandler === 'function') {
    props.promptClickHandler(item)
  } else {
    handleSendMessage(item.description)
  }
}
</script>

<style scoped lang="less">
.welcome-footer {
  margin-top: 12px;
  color: rgb(128, 128, 128);
  font-size: 12px;
  line-height: 20px;
}

@container tiny-container (max-width: 640px) {
  .tr-bubble-list {
    --tr-bubble-max-width: 100%;
    :deep(.tr-bubble__avatar) {
      display: none;
    }
  }
}

.tiny-container {
  top: 0px;
  container-name: tiny-container;
  container-type: inline-size;
  --tv-size-scrollbar-width: 4px;
  &.fullscreen {
    --tv-size-scrollbar-width: 0px;
    --tv-size-scrollbar-height: 0px;
  }
  :deep(.tr-welcome__title-wrapper) {
    display: flex;
    align-items: center;
    justify-content: center;
    .tr-welcome__title {
      font-size: 30px;
    }
  }
  :deep(.tr-welcome__description) {
    font-size: 16px;
  }
  :deep(.tr-prompt__content-description) {
    font-size: 12px;
  }

  &.tr-container.tr-container {
    --tr-container-width: 420px;
    background-color: #f8f8f8;
    position: relative;
    height: 100%;
    border: 1px solid var(--te-layout-common-border-color);
    :deep(.tr-container__dragging-bar-wrapper) {
      display: none;
    }
    :deep(.tr-container__header) {
      padding: 16px 24px;
    }
  }

  :deep(button.icon-btn) {
    background-color: rgba(0, 0, 0, 0);
  }

  :deep(.robot-setting button) {
    margin-left: 10px;
  }

  .tr-bubble-list {
    font-size: 14px;
    --tr-bubble-text-font-size: 14px;
    flex: 1;
    .tr-bubble {
      word-break: break-word;
    }
    ul,
    ol {
      padding-left: 10px;
    }
    ul > li {
      list-style: disc;
    }
    ol > li {
      list-style: decimal;
    }
    table {
      border-collapse: collapse; // 合并边框
      border: 1px solid #ccc;
      width: 100%;
      margin: 1rem 0;
      th,
      td {
        border: 1px solid #ccc; /* 单元格边框 */
        padding: 8px;
      }
      tr:nth-child(even) {
        background-color: #f2f2f2;
      }
      tr:hover {
        background-color: #e6f7ff;
      }
    }
    :deep([data-role='user']) {
      --tr-bubble-box-bg: var(--tr-color-primary-light);
    }
  }

  &.fullscreen {
    :deep([data-role='assistant']) {
      --tr-bubble-box-bg: transparent;
      .tr-bubble__content {
        padding: 8px 0 0;
      }
    }
    :deep(.tr-welcome__title-wrapper) {
      .tr-welcome__title {
        font-size: 32px;
      }
    }
    :deep(.tr-prompt__content-description) {
      font-size: 14px;
    }
    :deep(.footer-button-wrapper) {
      padding: 0 12px;
    }
  }

  .robot-welcome > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tiny-prompts {
    padding: 16px 24px;

    :deep(.prompt-item) {
      width: 100%;
      box-sizing: border-box;

      @container (width >=64rem) {
        width: calc(50% - 8px);
      }

      .tr-prompt__content-label {
        font-size: 14px;
        line-height: 24px;
      }
    }
  }

  button.icon-btn {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    padding: 0;
    transition: background-color 0.3s;
    background-color: rgba(0, 0, 0, 0);

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    &:active {
      background-color: rgba(0, 0, 0, 0.15);
    }

    svg {
      font-size: 20px;
    }
  }
}

.tiny-sender__header-slot .tr-attachments .tr-attachments__file-list .tr-attachments__add-button {
  display: none;
}

:deep(.tr-bubble) {
  .tr-bubble__content:has(> .tr-bubble__content-items > [class*='img-renderer-container']) {
    padding: 0px;
    background-color: transparent;
  }
}

:deep(.tiny-sender) {
  margin: 20px;
  .tiny-sender__footer-slot.tiny-sender__bottom-row {
    justify-content: space-between !important;
  }
  .tiny-sender__upload-popup {
    .upload-options {
      height: 42px;

      .upload-option:first-child {
        display: none;
      }
    }
  }
  .tiny-sender__input-field-wrapper .tiny-textarea__inner {
    font-size: 14px;
  }
}
:deep(.action-buttons__icon) {
  width: 26px !important;
  height: 26px !important;
}
:deep(.tr-attachments) {
  .tr-attachments__file-list {
    .tr-file-card {
      margin-top: 10px;
      margin-left: 10px;
    }
  }
}

.robot-bubble-list {
  height: 100%;
}

.aborted {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.7;
}
</style>
