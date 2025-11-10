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
      <tr-icon-button :icon="IconNewSession" size="28" svgSize="20" @click="createConversation()" />
      <span style="display: inline-flex; line-height: 0; position: relative">
        <tr-icon-button :icon="IconHistory" size="28" svgSize="20" @click="showHistory = true" />
        <div v-show="showHistory" class="tr-history-container">
          <div><h3 style="padding-left: 12px">历史对话</h3></div>
          <tr-icon-button
            :icon="IconClose"
            size="28"
            svgSize="20"
            @click="showHistory = false"
            style="position: absolute; right: 14px; top: 14px"
          />
          <tr-history
            :selected="conversationState.currentId || undefined"
            :search-bar="true"
            :data="conversationState.conversations"
            @item-action="handleHistoryItemAction"
            @item-title-change="handleHistoryItemTitleChange"
            @item-click="handleHistoryItemClick"
          ></tr-history>
        </div>
      </span>
    </template>

    <div class="robot-chat-container-content" ref="chatContainerRef">
      <div v-if="messages.filter((item) => item.role !== 'system').length === 0">
        <tr-welcome title="AI助手" description="您好，我是您的开发小助手" :icon="welcomeIcon" class="robot-welcome">
        </tr-welcome>
        <tr-prompts
          :items="promptItems"
          :wrap="true"
          item-class="prompt-item"
          class="tiny-prompts"
          @item-click="handlePromptItemClick"
        ></tr-prompts>
      </div>
      <tr-bubble-provider v-else :content-renderers="contentRenderers">
        <tr-bubble-list :items="messages" :roles="roles" auto-scroll class="robot-bubble-list"> </tr-bubble-list>
      </tr-bubble-provider>
    </div>

    <template #footer>
      <div class="chat-input">
        <tr-sender
          ref="senderRef"
          mode="multiple"
          v-model="inputMessage"
          :placeholder="GeneratingStatus.includes(messageState.status) ? '正在思考中...' : '请输入您的问题'"
          :clearable="true"
          :loading="GeneratingStatus.includes(messageState.status)"
          :showWordLimit="true"
          :maxLength="4000"
          @submit="handleSendMessage"
          @cancel="handleAbortRequest"
          :allowFiles="singleAttachmentItems.length < 1 && allowFiles"
          uploadTooltip="支持上传1张图片"
          @files-selected="handleSingleFilesSelected"
        >
          <template #header v-if="singleAttachmentItems.length > 0">
            <div>
              <tr-attachments
                ref="singleAttachmentRef"
                v-model:items="singleAttachmentItems"
                variant="card"
                wrap
                @file-remove="handleSingleFileRemove"
                @file-retry="handleSingleFileRetry"
              >
              </tr-attachments>
            </div>
          </template>
          <template #footer-left>
            <slot name="footer-left"></slot>
          </template>
        </tr-sender>
      </div>
    </template>
  </tr-container>
</template>

<script setup lang="ts">
import type { BubbleRoleConfig, PromptProps } from '@opentiny/tiny-robot'
import {
  TrBubbleList,
  TrBubbleProvider,
  TrContainer,
  TrHistory,
  TrIconButton,
  TrPrompts,
  TrSender,
  TrWelcome,
  TrAttachments
} from '@opentiny/tiny-robot'
import { type ChatMessage, type Conversation, GeneratingStatus } from '@opentiny/tiny-robot-kit'
import { IconHistory, IconNewSession, IconClose } from '@opentiny/tiny-robot-svgs'
import {
  type Component,
  computed,
  type CSSProperties,
  h,
  nextTick,
  onMounted,
  type PropType,
  ref,
  resolveComponent
} from 'vue'
import { Notify } from '@opentiny/vue'
import useChat from '../../composables/useChat'
import LoadingRenderer from '../renderers/LoadingRenderer.vue'
import MarkdownRenderer from '../renderers/MarkdownRenderer.vue'
import ImgRenderer from '../renderers/ImgRenderer.vue'
import { serializeError } from '../../utils'

const { promptItems, allowFiles, bubbleRenderers, beforeSubmit } = defineProps({
  promptItems: {
    type: Array as PropType<PromptProps[]>,
    default: () => []
  },
  allowFiles: {
    type: Boolean,
    default: false
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

const emit = defineEmits(['fileSelected'])

const singleAttachmentItems = ref([])

const fullscreen = ref(false)
const robotVisible = ref(false)

const {
  messages,
  messageState,
  inputMessage,
  abortRequest,
  send,
  removeLoading,
  conversationState,
  createConversation,
  switchConversation,
  deleteConversation,
  updateTitle
} = useChat()

const imageUrl = ref('')

// 处理文件选择事件
const handleSingleFilesSelected = (files: FileList | null, retry = false) => {
  if (retry) {
    singleAttachmentItems.value[0].status = 'uploading'
    singleAttachmentItems.value[0].isUploading = true
    singleAttachmentItems.value[0].messageType = 'uploading'
  } else {
    if (!files.length) return

    if (files && files.length > 1) {
      Notify({
        type: 'error',
        message: '当前仅支持上传一张图片',
        position: 'top-right',
        duration: 5000
      })
      return
    }

    if (files && files.length > 0) {
      // 将选中的文件转换为 Attachment 格式并添加到附件列表
      const newAttachments = Array.from(files).map((file) => ({
        size: file.size,
        rawFile: file
      }))
      singleAttachmentItems.value.push(...newAttachments)
    }
  }

  // 开始上传
  const formData = new FormData()
  const fileData = retry ? files : files[0]
  formData.append('file', fileData)

  const updateAttachment = (resourceUrl: string) => {
    if (resourceUrl) {
      singleAttachmentItems.value[0].status = 'done'
      singleAttachmentItems.value[0].isUploading = false
      singleAttachmentItems.value[0].messageType = 'success'
      singleAttachmentItems.value[0].url = resourceUrl
    } else {
      singleAttachmentItems.value[0].status = 'error'
      singleAttachmentItems.value[0].isUploading = false
      singleAttachmentItems.value[0].messageType = 'error'
    }
  }

  emit('fileSelected', formData, updateAttachment)
}

const handleSingleFileRemove = () => {
  imageUrl.value = ''
}

const handleSingleFileRetry = (file: any) => {
  handleSingleFilesSelected(file.file, true)
}

const openAIRobot = () => {
  robotVisible.value = !robotVisible.value
}

const getSvgIcon = (name: string, style?: CSSProperties) => {
  return h(resolveComponent('svg-icon'), { name, style: { fontSize: '32px', ...style } })
}
const aiAvatar = getSvgIcon('AI')
const welcomeIcon = getSvgIcon('AI', { fontSize: '48px' })

const contentRenderers = computed(() => ({
  markdown: MarkdownRenderer,
  loading: LoadingRenderer,
  img: ImgRenderer,
  ...bubbleRenderers
}))

const roles: Record<string, BubbleRoleConfig> = {
  assistant: {
    placement: 'start',
    avatar: aiAvatar,
    contentRenderer: MarkdownRenderer,
    customContentField: 'renderContent'
  },
  user: {
    placement: 'end',
    contentRenderer: MarkdownRenderer,
    customContentField: 'renderContent'
  },
  system: {
    hidden: true
  }
}
const showHistory = ref(false)

const handleHistoryItemClick = (item: Conversation) => {
  switchConversation(item.id)
  showHistory.value = false
}

const handleHistoryItemAction = (action: { id: string }, item: Conversation) => {
  if (action.id === 'delete') {
    deleteConversation(item.id)
  }
}

const handleHistoryItemTitleChange = (title: string, item: Conversation) => {
  updateTitle(item.id, title)
}

const senderRef = ref<InstanceType<typeof TrSender> | null>(null)

// 发送消息
const handleSendMessage = async (content: string) => {
  const messageContent = content || inputMessage.value
  if (!messageContent || (typeof messageContent === 'string' && !messageContent.trim())) {
    return
  }

  let result = beforeSubmit?.()
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
  const files = singleAttachmentItems.value.filter((item) => item.status === 'done')
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
  singleAttachmentItems.value = []
  try {
    nextTick(() => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        renderContent: [{ type: 'loading' }]
      }
      messages.value.push(assistantMessage)
    })
    await send()
    const currentTitle = conversationState.conversations.find(
      (conversation) => conversation.id === conversationState.currentId
    )?.title
    const DEFAULT_TITLE = '新会话'
    if (currentTitle === DEFAULT_TITLE && conversationState.currentId) {
      const contentStr = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent)
      updateTitle(conversationState.currentId, contentStr.substring(0, 20))
    }
  } catch (error) {
    removeLoading(messages.value)
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage) {
      lastMessage.renderContent.push({ type: 'text', content: serializeError(error) })
    }
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

const handleAbortRequest = () => {
  abortRequest()
  messages.value.at(-1)!.aborted = true
}

const handlePromptItemClick = (ev: unknown, item: { description?: string }) => {
  handleSendMessage(item.description)
}

onMounted(() => {
  createConversation()
})

defineExpose({
  openAIRobot,
  fullscreen,
  createConversation
})
</script>

<style scoped lang="less">
.welcome-footer {
  margin-top: 12px;
  color: rgb(128, 128, 128);
  font-size: 12px;
  line-height: 20px;
}

.tr-history-container {
  position: absolute;
  right: 100%;
  top: 100%;
  z-index: var(--tr-z-index-popover);
  width: 300px;
  height: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  background-color: white;
  padding: 16px;
  border-radius: 16px;
  --tr-history-group-space-y: 0px;
  :deep(.tr-history) {
    height: calc(100% - 36px);
    overflow-y: auto;
  }
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
      --tr-bubble-content-bg: var(--tr-color-primary-light);
    }
  }

  &.fullscreen {
    :deep([data-role='assistant']) {
      --tr-bubble-content-bg: transparent;
      .tr-bubble__content {
        padding: 8px 0 0;
      }
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
    font-size: 20px;
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
</style>
