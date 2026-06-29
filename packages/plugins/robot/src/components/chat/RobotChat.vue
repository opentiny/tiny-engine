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
      <div v-if="messages.filter((item) => item.role !== RobotMessageRole.System).length === 0">
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
import { GeneratingStatus } from '../../constants/status'
import { LoadingRenderer, MarkdownRenderer, ImgRenderer } from '../renderers'
import { useNotify } from '@opentiny/tiny-engine-meta-register'
import {
  RobotMessageContentType,
  RobotMessageRole,
  type MessageContentResolver,
  type RobotInputContentPart,
  type RobotMessage,
  type RobotRenderContentItem
} from '../../types'
import { extractMessageText } from '../../utils'

const props = defineProps({
  promptItems: {
    type: Array as PropType<PromptProps[]>,
    default: () => []
  },
  promptClickHandler: {
    type: Function
  },
  status: { type: String },
  messageContentResolver: {
    type: Function as PropType<MessageContentResolver>
  },
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
const messages = defineModel<RobotMessage[]>('messages', { required: true })
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
    find: (_message: RobotMessage, content: RobotRenderContentItem) => content?.type === type,
    renderer
  })),
  {
    priority: BubbleRendererMatchPriority.NORMAL,
    find: (message: RobotMessage, content: RobotRenderContentItem) =>
      content?.type === RobotMessageContentType.Tool && Boolean(message.tool_calls?.length),
    renderer: BubbleRenderers.Tools
  },
  {
    priority: BubbleRendererMatchPriority.NORMAL,
    find: (_message: RobotMessage, content: RobotRenderContentItem) =>
      !content?.type || [RobotMessageContentType.Markdown, RobotMessageContentType.Text].includes(content.type as any),
    renderer: MarkdownRenderer
  },
  {
    priority: BubbleRendererMatchPriority.NORMAL,
    find: (_message: RobotMessage, content: RobotRenderContentItem) =>
      [RobotMessageContentType.Img, RobotMessageContentType.Image].includes(content?.type as any),
    renderer: ImgRenderer
  }
])

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

const resolveMessageContent = (message: RobotMessage) => {
  if (props.messageContentResolver) {
    return props.messageContentResolver(message, {
      messages: messages.value,
      status: props.status
    })
  }

  if (Array.isArray(message.renderContent) && message.renderContent.length > 0) {
    return message.renderContent.map((item) => {
      if (item?.type === RobotMessageContentType.Img || item?.type === RobotMessageContentType.Image) {
        return {
          type: RobotMessageContentType.Img,
          content: item.content || item.url || item.image_url?.url || ''
        }
      }
      if (item?.type === RobotMessageContentType.Text) {
        return {
          type: RobotMessageContentType.Text,
          content: item.content ?? item.text ?? ''
        }
      }
      return item
    })
  }

  if (Array.isArray(message.content) && message.content.length > 0) {
    const textContent = extractMessageText(message.content)
    if (textContent) {
      return textContent
    }
  }

  const textContent = extractMessageText(message.content)
  if (textContent) {
    return textContent
  }

  return message.content
}

const roleConfigs: Record<string, BubbleRoleConfig> = {
  [RobotMessageRole.Assistant]: {
    placement: 'start',
    avatar: aiAvatar
  },
  [RobotMessageRole.User]: {
    placement: 'end'
  },
  [RobotMessageRole.System]: {
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

  const userMessage: RobotMessage = {
    role: RobotMessageRole.User,
    content: messageContent
  }
  const files = selectedAttachments.value.filter((item) => item.status === 'success')
  if (files.length > 0) {
    userMessage.content = [
      {
        type: RobotMessageContentType.Text,
        text: messageContent
      },
      ...files.map((item) => ({
        type: RobotMessageContentType.ImageUrl,
        image_url: {
          url: item.url
        }
      }))
    ] as RobotInputContentPart[]
    userMessage.renderContent = [
      {
        type: RobotMessageContentType.Text,
        content: messageContent
      },
      ...files.map((item) => ({
        type: RobotMessageContentType.Img,
        content: item.url
      }))
    ]
  } else {
    userMessage.renderContent = [
      {
        type: RobotMessageContentType.Text,
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
