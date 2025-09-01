<template>
  <div class="robot">
    <div title="AI对话框" class="robot-img">
      <svg-icon name="AI" @click="openAIRobot"></svg-icon>
    </div>
    <Teleport to="body">
      <div class="robot-chat-container">
        <tr-container
          v-if="robotVisible"
          v-model:fullscreen="fullscreen"
          v-model:show="robotVisible"
          class="tiny-container"
        >
          <template #operations>
            <tiny-popover
              width="290"
              trigger="manual"
              v-model="showPopover"
              :visible-arrow="false"
              popper-class="chat-popover"
            >
              <robot-setting-popover
                v-if="showPopover"
                :typeValue="selectedModel"
                @changeType="changeModel"
                @close="closePanel"
              ></robot-setting-popover>
              <template #reference>
                <span class="chat-title-dropdown" @click.stop="showPopover = true">
                  <svg-icon name="setting" class="operations-setting ml8"> </svg-icon>
                </span>
              </template>
            </tiny-popover>
            <button class="icon-btn" @click="endContent">
              <icon-new-session />
            </button>
          </template>
          <div class="robot-chat-container-content" ref="chatContainerRef">
            <div v-if="activeMessages.length === 0">
              <tr-welcome
                title="AI助手"
                description="您好，我是您的开发小助手"
                :icon="welcomeIcon"
                class="robot-welcome"
              >
              </tr-welcome>
              <tr-prompts
                :items="promptItems"
                :wrap="true"
                item-class="prompt-item"
                class="tiny-prompts"
                @item-click="handlePromptItemClick"
              ></tr-prompts>
            </div>
            <tr-bubble-provider :content-renderers="contentRenderers" v-else>
              <tr-bubble-list :items="activeMessages" :roles="roles" autoScroll></tr-bubble-list>
            </tr-bubble-provider>
          </div>
          <template #footer>
            <tr-sender
              :maxlength="4000"
              mode="multiple"
              :autoSize="{ minRows: 1, maxRows: 5 }"
              :loading="requestLoading"
              class="footer-sender"
              ref="senderRef"
              v-model="inputContent"
              placeholder="请输入问题或“/”唤起指令，支持粘贴文档"
              :clearable="true"
              :showWordLimit="true"
              :allowFiles="
                singleAttachmentItems.length < 1 && VISUAL_MODEL.includes(selectedModel.model) && aiType === BUILD_TYPE
              "
              uploadTooltip="支持上传1张图片"
              @submit="sendContent(inputContent, false)"
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
                <mcp-server :position="mcpDrawerPosition" v-if="aiType === MCP_TYPE"></mcp-server>
                <robot-type-select :aiType="aiType" @typeChange="typeChange"></robot-type-select>
              </template>
            </tr-sender>
          </template>
        </tr-container>
        <tiny-dialog-box v-model:visible="showPreview" title="当前AI渲染效果" width="80%">
          <schema-renderer v-if="showPreview" :schema="currentSchema"></schema-renderer>
        </tiny-dialog-box>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
/* metaService: engine.plugins.robot.Main */
import {
  ref,
  onMounted,
  watchEffect,
  type CSSProperties,
  h,
  resolveComponent,
  computed,
  watch,
  nextTick,
  type Component
} from 'vue'
import { Notify, Loading, TinyPopover, TinyDialogBox } from '@opentiny/vue'
import { useCanvas, useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import {
  TrContainer,
  TrWelcome,
  TrPrompts,
  TrBubbleList,
  TrSender,
  TrFeedback,
  TrAttachments,
  TrBubbleProvider
} from '@opentiny/tiny-robot'
import type { BubbleRoleConfig, PromptProps } from '@opentiny/tiny-robot'
import { IconNewSession } from '@opentiny/tiny-robot-svgs'
import SchemaRenderer from '@opentiny/tiny-schema-renderer'
import RobotSettingPopover from './RobotSettingPopover.vue'
import {
  getBlockContent,
  initBlockList,
  getAIModelOptions,
  defaultSelectedModel,
  isValidFastJsonPatch,
  VISUAL_MODEL,
  TALK_TYPE,
  MCP_TYPE,
  BUILD_TYPE
} from './js/robotSetting'
import { PROMPTS } from './js/prompts'
import * as jsonpatch from 'fast-json-patch'
import { chatStream } from './js/utils'
import McpServer from './mcp/McpServer.vue'
import useMcpServer from './mcp/useMcp'
import MarkdownRenderer from './mcp/MarkdownRenderer.vue'
import LoadingRenderer from './mcp/LoadingRenderer.vue'
import { sendMcpRequest, serializeError } from './mcp/utils'
import type { RobotMessage } from './mcp/types'
import RobotTypeSelect from './RobotTypeSelect.vue'

export default {
  components: {
    TinyPopover: TinyPopover as unknown,
    TinyDialogBox: TinyDialogBox as unknown,
    RobotSettingPopover,
    TrContainer,
    TrWelcome,
    TrPrompts,
    TrBubbleList,
    TrSender,
    TrAttachments,
    IconNewSession,
    SchemaRenderer,
    McpServer,
    TrBubbleProvider,
    RobotTypeSelect
  },
  emits: ['close-chat'],
  setup() {
    const { pageState, importSchema, setSaved } = useCanvas()
    const AIModelOptions = getAIModelOptions()
    const robotVisible = ref(false)
    const avatarUrl = ref('')
    const chatWindowOpened = ref(true)
    let sessionProcess = null
    const messages = ref<RobotMessage[]>([])
    const activeMessages = ref([])
    const connectedFailed = ref(false)
    const inputContent = ref('')
    const inProcesing = ref(false)
    const selectedModel = ref(defaultSelectedModel)
    const { confirm } = useModal()
    const showPopover = ref(false)
    const searchContent = ref('')
    const currentSchema = ref(null)
    const showPreview = ref(false)
    const singleAttachmentItems = ref([])
    const imageUrl = ref('')
    const MESSAGE_TIP = '已生成新的页面效果，请点击下方按钮应用schema'
    const aiType = ref(TALK_TYPE)
    const chatContainerRef = ref(null)
    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
    watchEffect(() => {
      avatarUrl.value = 'img/defaultAvator.png'
    })

    const setContextSession = () => {
      localStorage.setItem(
        'aiChat',
        sessionProcess
          ? JSON.stringify(sessionProcess)
          : JSON.stringify({
              foundationModel: {
                ...selectedModel.value
              },
              messages: [],
              displayMessages: [], // 专门用来进行展示的消息，非原始消息，仅作为展示但是不作为请求的发送
              aiType: aiType.value
            })
      )
    }

    const scrollContent = async () => {
      await nextTick()
      const el = chatContainerRef.value as HTMLElement | null
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    }

    const codeRules = `
    请扮演一名前端开发专家，生成代码时遵从以下几点要求：
    ###
    1.只使用element-ui组件库完成代码编写
    2.使用vue2技术栈
    3.回复中只能有一个代码块
    4.el-table标签内不得出现el-table-column
    ###
    `

    // 在每一次发送请求之前，都把提示词，给放到第一条消息中
    // 为了不污染存储在localstorage里的用户的原始消息，这里进行了简单的对象拷贝
    // 引入区块不存放在localstorage的原因：因为区块是可以变化的，用户可能在同一个会话中，对区块进行了删除和创建。那么存放的数据就不是即时数据了。
    const getSendSeesionProcess = () => {
      const sendProcess = { ...sessionProcess }
      const firstMessage = sendProcess.messages[0]
      let firstContent = firstMessage.content
      if (aiType.value === BUILD_TYPE) {
        firstContent = firstMessage.content.map((item) => {
          if (item.type === 'text') {
            item.text = `[指令] ${PROMPTS}\n[知识] ${searchContent.value}\n[当前schema] ${JSON.stringify(
              pageState.pageSchema
            )}`
          }
          return item
        })
      }
      if (aiType.value === MCP_TYPE) {
        firstContent = `${getBlockContent()}\n${codeRules}\n${firstMessage.content[0]?.text || ''}`
      }

      sendProcess.messages = [
        {
          ...firstMessage,
          content: firstContent
        },
        ...sendProcess.messages.slice(1)
      ]
      delete sendProcess.displayMessages
      return sendProcess
    }

    const getAiRespMessage = (content, role = 'assistant') => ({
      role,
      content
    })

    const getAiDisplayMessage = (content, role = 'assistant', schema = {}, id = null) => ({
      role,
      content,
      name: 'AI',
      schema,
      id
    })

    const setSchema = () => {
      const value = {
        ...pageState.pageSchema,
        ...currentSchema.value,
        componentName: pageState.pageSchema.componentName
      }
      importSchema(value)
      setSaved(false)
      showPreview.value = false
    }

    // 处理响应
    const handleResponse = ({ id, chatMessage }: { id: string; chatMessage: any }) => {
      try {
        if (aiType.value === BUILD_TYPE) {
          const regex = /```json([\s\S]*?)```/
          const match = chatMessage?.content.match(regex)

          if (match && match[1] && JSON.parse(match[1]) && isValidFastJsonPatch(JSON.parse(match[1]))) {
            const newValue = JSON.parse(match[1])
            // 使用 applyPatch 修改 Schema
            const result = newValue.reduce(jsonpatch.applyReducer, pageState.pageSchema)

            sessionProcess.messages.push(getAiRespMessage(JSON.stringify(result, null, 2), chatMessage.role))
            sessionProcess.displayMessages.push(getAiDisplayMessage(MESSAGE_TIP, chatMessage.role, result, id))
            messages.value[messages.value.length - 1].content = MESSAGE_TIP
            messages.value[messages.value.length - 1].schema = result
            messages.value[messages.value.length - 1].id = id
          } else {
            sessionProcess.messages.push(getAiRespMessage(chatMessage?.content))
            sessionProcess.displayMessages.push(getAiRespMessage(chatMessage?.content))
            messages.value[messages.value.length - 1].content = chatMessage?.content
          }
          setContextSession()
          inProcesing.value = false
          connectedFailed.value = false
        }
        if (aiType.value === TALK_TYPE) {
          sessionProcess.messages.push(getAiRespMessage(chatMessage?.content))
          sessionProcess.displayMessages.push(getAiRespMessage(chatMessage?.content))
          messages.value[messages.value.length - 1].content = chatMessage?.content
        }
      } catch (e) {
        messages.value[messages.value.length - 1].content = '处理响应时出错'
        inProcesing.value = false
        connectedFailed.value = false
      }
    }

    const requestLoading = ref(false)
    // 发送流式请求
    const sendStreamRequest = async () => {
      const requestData = getSendSeesionProcess()
      if (useMcpServer().isToolsEnabled && aiType.value === MCP_TYPE) {
        try {
          requestLoading.value = true
          await scrollContent()
          await sendMcpRequest(messages.value, {
            model: selectedModel.value.model,
            headers: {
              Authorization: `Bearer ${selectedModel.value.apiKey || import.meta.env.VITE_API_TOKEN}`
            }
          })
        } catch (error) {
          const { renderContent } = messages.value.at(-1)!
          if (renderContent?.length) {
            if (renderContent.at(-1)!.type === 'loading') {
              renderContent.pop()
            }
            renderContent.push({
              type: 'text',
              content: `连接失败, 请稍后重试: ${serializeError(error)}`
            })
          } else {
            messages.value.at(-1)!.content = `连接失败, 请稍后重试: ${serializeError(error)}`
          }
        } finally {
          inProcesing.value = false
          requestLoading.value = false
          await scrollContent()
        }
        return
      } else {
        if (requestData.foundationModel) {
          requestData.foundationModel.stream = true
        }

        let streamContent = ''
        const chatId = Date.now().toString()
        await chatStream(
          {
            requestUrl: '/app-center/api/ai/chat',
            requestData: { ...requestData.foundationModel, messages: requestData.messages }
          },
          {
            onData: (data) => {
              const choice = data.choices?.[0]
              if (choice && choice.delta.content) {
                if (messages.value.length === 0 || messages.value[messages.value.length - 1].role !== 'assistant') {
                  messages.value.push(getAiDisplayMessage('', 'assistant', {}, chatId))
                }
                if (streamContent !== messages.value[messages.value.length - 1].content) {
                  messages.value[messages.value.length - 1].content = ''
                }
                streamContent += choice.delta.content
                messages.value[messages.value.length - 1].content += choice.delta.content
              }
            },
            onError: (error) => {
              messages.value[messages.value.length - 1].content = '连接失败'
              localStorage.removeItem('aiChat')
              inProcesing.value = false
              connectedFailed.value = false
              // eslint-disable-next-line no-console
              console.error('Stream error:', error)
            },
            onDone: () => {
              handleResponse({
                id: chatId,
                chatMessage: {
                  role: 'assistant',
                  content: streamContent || '没有返回内容',
                  name: 'AI'
                }
              })
            }
          },
          {
            Authorization: `Bearer ${selectedModel.value.apiKey || import.meta.env.VITE_API_TOKEN}`
          }
        )
      }
    }

    const resetContent = async () => {
      activeMessages.value = messages.value
      await scrollContent()
    }

    const resizeChatWindow = async () => {
      chatWindowOpened.value = !chatWindowOpened.value
      showPopover.value = false
      await resetContent()
    }

    const search = async (content) => {
      try {
        const res = await getMetaApi(META_SERVICE.Http).post('/app-center/api/ai/search', { content })

        res.forEach((item) => {
          searchContent.value += item.content
        })
      } catch (error) {
        // error
      }
    }

    const getMessage = (content) => ({
      role: 'user',
      content
    })

    const getSessionMessage = (text) => {
      const content = [
        {
          type: 'text',
          text
        }
      ]
      if (singleAttachmentItems.value.length > 0 && aiType.value === BUILD_TYPE) {
        content.push({
          type: 'image_url',
          image_url: {
            url: imageUrl.value
          }
        })
      }
      return {
        role: 'user',
        content,
        name: 'John'
      }
    }

    const sendContent = async (content, isModel) => {
      if (inProcesing.value) {
        Notify({
          type: 'error',
          message: '请等待当前会话完成后再试!',
          position: 'top-right',
          duration: 5000
        })
        return
      }
      const realContent = content.trim()
      if (realContent) {
        if (chatWindowOpened.value === false) {
          await resizeChatWindow()
        }
        if (!sessionProcess?.messages?.length && aiType.value !== TALK_TYPE) {
          sessionProcess?.messages.push({
            role: 'system',
            content: [
              {
                type: 'text',
                text: ''
              }
            ]
          })
        }
        const message = getMessage(realContent)
        inProcesing.value = true
        messages.value.push(message)
        sessionProcess?.messages.push(getSessionMessage(realContent))
        sessionProcess?.displayMessages.push(message)
        if (aiType.value === BUILD_TYPE && (!searchContent.value || !sessionProcess.messages?.length)) {
          await search(realContent)
        }

        singleAttachmentItems.value = []
        imageUrl.value = ''
        if (!isModel) {
          inputContent.value = ''
        }
        await scrollContent()
        await sleep(1000)
        messages.value.push(getAiDisplayMessage('好的，正在执行相关操作，请稍等片刻...'))
        await scrollContent()
        await sendStreamRequest()
      }
    }

    // 根据localstorage初始化AI大模型
    const initCurrentModel = (aiSession) => {
      selectedModel.value = {
        ...JSON.parse(aiSession)?.foundationModel
      }
      aiType.value = JSON.parse(aiSession)?.aiType
    }

    const initChat = () => {
      const aiChatSession = localStorage.getItem('aiChat')
      if (!aiChatSession) {
        setContextSession()
      } else {
        initCurrentModel(aiChatSession) // 如果当前缓存有值，那么则需要根据缓存里的内容去初始化当前选择的模型
      }
      sessionProcess = JSON.parse(localStorage.getItem('aiChat'))
      messages.value = [...(sessionProcess?.displayMessages || [])]
      resetContent()
    }

    onMounted(async () => {
      const loadingInstance = Loading.service({
        text: '初始化中，请稍等...',
        customClass: 'chat-loading',
        background: 'rgba(0, 0, 0, 0.15)',
        target: '#bind-chatgpt',
        size: 'large'
      })

      await initBlockList()
      loadingInstance.close()
      initChat()
    })

    const endContent = () => {
      localStorage.removeItem('aiChat')
      sessionProcess = null
      inProcesing.value = false
      initChat()
    }

    const changeApiKey = () => {
      localStorage.removeItem('aiChat')
      sessionProcess = null
      setContextSession()
      sessionProcess = JSON.parse(localStorage.getItem('aiChat'))
    }

    const changeModel = (model) => {
      if (selectedModel.value.baseUrl !== model.baseUrl || selectedModel.value !== model.model) {
        confirm({
          title: '切换AI大模型',
          message: '切换AI大模型将导致当前会话被清空，重新开启新会话，是否继续？',
          exec() {
            selectedModel.value = {
              label: model.label || model.model,
              activeName: model.activeName,
              baseUrl: model.baseUrl,
              model: model.model,
              maxTokens: model.maxTokens,
              apiKey: model.apiKey
            }
            singleAttachmentItems.value = []
            imageUrl.value = ''
            endContent()
          }
        })
      }
      if (
        selectedModel.value.apiKey !== model.apiKey &&
        selectedModel.value.baseUrl === model.baseUrl &&
        selectedModel.value.model === model.model
      ) {
        selectedModel.value.apiKey = model.apiKey
        changeApiKey()
      }
    }

    const openAIRobot = () => {
      robotVisible.value = !robotVisible.value
    }

    const closePanel = () => {
      showPopover.value = false
    }

    // 控制全屏切换
    const fullscreen = ref(false)

    // 欢迎界面提示
    const promptItems: PromptProps[] = [
      {
        label: 'MCP工具',
        description: '帮我查询当前的页面列表',
        icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '🔧'),
        badge: 'NEW'
      },
      {
        label: '页面搭建场景',
        description: '给当前页面中添加一个问卷调查表单',
        icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '✨')
      },
      {
        label: '学习/知识型场景',
        description: 'Vue3 和 React 有什么区别？',
        icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '🤔')
      }
    ]

    // 处理提示项点击事件
    const handlePromptItemClick = (ev: unknown, item: { description?: string }) => {
      sendContent(item.description, true)
    }

    const getItemSchema = (item) => {
      const targetMessage = messages.value.find((message) => message.id && message.id === item.id)

      return targetMessage
    }

    // Icon
    const getSvgIcon = (name: string, style?: CSSProperties) => {
      return h(resolveComponent('svg-icon'), { name, style: { fontSize: '32px', ...style } })
    }
    const aiAvatar = getSvgIcon('AI')
    const userAvatar = getSvgIcon('user-head', { color: '#dfe1e6' })
    const welcomeIcon = getSvgIcon('AI', { fontSize: '48px' })
    const saveIcon = getSvgIcon('save', { fontSize: '20px' })
    const previewIcon = getSvgIcon('preview', { fontSize: '20px' })

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
      formData.append('modelName', String(sessionProcess.foundationModel.model))
      formData.append('apiKey', String(sessionProcess.foundationModel.apiKey))
      formData.append('file', fileData)

      try {
        getMetaApi(META_SERVICE.Http)
          .post('/app-center/api/ai/uploadFile', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          .then((res) => {
            if (res?.url) {
              imageUrl.value = res.url
              singleAttachmentItems.value[0].status = 'done'
              singleAttachmentItems.value[0].isUploading = false
              singleAttachmentItems.value[0].messageType = 'success'
            } else {
              imageUrl.value = ''
              singleAttachmentItems.value[0].status = 'error'
              singleAttachmentItems.value[0].isUploading = false
              singleAttachmentItems.value[0].messageType = 'error'
            }
          })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('上传失败', error)
      }
    }

    const handleSingleFileRemove = () => {
      imageUrl.value = ''
    }

    const handleSingleFileRetry = (file: any) => {
      handleSingleFilesSelected(file.file, true)
    }

    const typeChange = (type) => {
      aiType.value = type
      endContent()
    }

    const roles: Record<string, BubbleRoleConfig> = {
      assistant: {
        placement: 'start',
        avatar: aiAvatar,
        maxWidth: '90%',
        contentRenderer: MarkdownRenderer,
        customContentField: 'renderContent',
        slots: {
          footer: ({ bubbleProps }) => {
            return h(TrFeedback, {
              style: {
                display: getItemSchema(bubbleProps)?.schema && aiType.value === BUILD_TYPE ? 'block' : 'none'
              },
              actions: [
                { name: 'run', label: '应用', icon: saveIcon },
                { name: 'preview', label: '预览', icon: previewIcon }
              ],
              onAction(name) {
                currentSchema.value = getItemSchema(bubbleProps)?.schema || {}
                if (name === 'preview') {
                  showPreview.value = true
                }
                if (name === 'run') {
                  setSchema()
                }
              }
            })
          }
        }
      },
      user: { placement: 'end', avatar: userAvatar, maxWidth: '90%', contentRenderer: MarkdownRenderer },
      system: { hidden: true }
    }

    watch([() => activeMessages.value.length, () => activeMessages.value.at(-1)?.renderContent?.length ?? 0], () => {
      scrollContent()
    })

    const contentRenderers: Record<string, Component> = {
      markdown: MarkdownRenderer,
      loading: LoadingRenderer
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

    return {
      chatContainerRef,
      robotVisible,
      avatarUrl,
      chatWindowOpened,
      activeMessages,
      inputContent,
      connectedFailed,
      AIModelOptions,
      selectedModel,
      showPopover,
      fullscreen,
      welcomeIcon,
      roles,
      currentSchema,
      showPreview,
      singleAttachmentItems,
      VISUAL_MODEL,
      promptItems,
      MarkdownRenderer,
      requestLoading,
      aiType,
      TALK_TYPE,
      MCP_TYPE,
      BUILD_TYPE,
      sendContent,
      endContent,
      changeApiKey,
      resizeChatWindow,
      changeModel,
      openAIRobot,
      closePanel,
      handlePromptItemClick,
      setSchema,
      handleSingleFilesSelected,
      handleSingleFileRemove,
      handleSingleFileRetry,
      typeChange,
      contentRenderers,
      mcpDrawerPosition
    }
  }
}
</script>

<style lang="less" scoped>
.robot-img {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 26px;
  height: 26px;

  .chatgpt-icon {
    width: 18px;
    height: 18px;
  }
}

.chat-popover {
  .robot-setting .bottom-buttons .tiny-button {
    margin-left: 10px;
  }
}

:deep(.tiny-container) {
  container-type: inline-size;

  &.tr-container.tr-container {
    top: var(--base-top-panel-height);
    --tr-container-width: 400px;
    .tr-container__dragging-bar {
      display: none;
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
  }

  .robot-welcome > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .operations-setting {
    font-size: 20px;
    padding: 4px;
  }

  .tiny-prompts > div {
    padding: 16px 24px;

    .prompt-item {
      width: 100%;
      box-sizing: border-box;

      @container (width >=64rem) {
        width: calc(50% - 8px);
      }

      .tr-prompt__content-label {
        font-size: 14px;
        line-height: 24px;
      }

      &:hover {
        background-color: #f8f8f8;
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

  .footer-sender {
    padding: 10px 15px;
  }
}

.tiny-sender__header-slot .tr-attachments .tr-attachments__file-list .tr-attachments__add-button {
  display: none;
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
</style>
