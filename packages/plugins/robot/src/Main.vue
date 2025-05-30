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
          <template v-if="activeMessages.length === 0">
            <tr-welcome title="AI助手" description="您好，我是您的开发小助手" :icon="welcomeIcon" class="robot-welcome">
            </tr-welcome>
          </template>
          <tr-bubble-list v-else :items="activeMessages" :roles="roles"></tr-bubble-list>
          <template #footer>
            <tr-sender
              ref="senderRef"
              mode="multiple"
              v-model="inputContent"
              placeholder="请输入问题或“/”唤起指令，支持粘贴文档"
              :clearable="true"
              :showWordLimit="true"
              :allowFiles="true"
              @submit="sendContent(inputContent, false)"
            ></tr-sender>
          </template>
        </tr-container>
        <tiny-dialog-box v-model:visible="showPreview" title="当前AI渲染效果" width="80%">
          <schema-renderer :schema="currentSchema"></schema-renderer>
        </tiny-dialog-box>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, watchEffect, type CSSProperties, h, resolveComponent } from 'vue'
import { Notify, Loading, TinyPopover, TinyDialogBox, TinyButton } from '@opentiny/vue'
import { useCanvas, usePage, useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { TrContainer, TrWelcome, TrPrompts, TrBubbleList, TrSender, TrFeedback } from '@opentiny/tiny-robot'
import type { BubbleRoleConfig } from '@opentiny/tiny-robot'
import { IconNewSession } from '@opentiny/tiny-robot-svgs'
import SchemaRenderer from '@opentiny/tiny-schema-renderer'
import RobotSettingPopover from './RobotSettingPopover.vue'
import { initBlockList, AIModelOptions, defaultSelectedModel, isValidFastJsonPatch } from './js/robotSetting'
import { PROMPTS } from './js/prompts'
import * as jsonpatch from 'fast-json-patch'

export default {
  components: {
    TinyPopover,
    TinyDialogBox,
    TinyButton,
    RobotSettingPopover,
    TrContainer,
    TrWelcome,
    TrPrompts,
    TrBubbleList,
    TrSender,
    TrFeedback,
    IconNewSession,
    SchemaRenderer
  },
  emits: ['close-chat'],
  setup() {
    const { isBlock, isSaved, pageState, importSchema, setSaved } = useCanvas()
    const robotVisible = ref(false)
    const avatarUrl = ref('')
    const chatWindowOpened = ref(true)
    let sessionProcess = null
    const messages = ref([])
    const activeMessages = ref([])
    const connectedFailed = ref(false)
    const inputContent = ref('')
    const inProcesing = ref(false)
    const selectedModel = ref(defaultSelectedModel)
    const { confirm } = useModal()
    const tokenValue = ref('')
    const showPopover = ref(false)
    const searchContent = ref('')
    const currentSchema = ref(null)
    const showPreview = ref(false)
    const MESSAGE_TIP = '已生成新的页面效果，请点击下方预览按钮确认是否更新schema'

    const { pageSettingState } = usePage()
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
              displayMessages: [] // 专门用来进行展示的消息，非原始消息，仅作为展示但是不作为请求的发送
            })
      )
    }

    // 在每一次发送请求之前，都把提示词，给放到第一条消息中
    // 为了不污染存储在localstorage里的用户的原始消息，这里进行了简单的对象拷贝
    // 引入区块不存放在localstorage的原因：因为区块是可以变化的，用户可能在同一个会话中，对区块进行了删除和创建。那么存放的数据就不是即时数据了。
    const getSendSeesionProcess = () => {
      const sendProcess = { ...sessionProcess }
      const firstMessage = sendProcess.messages[0]
      sendProcess.messages = [
        { ...firstMessage, content: `${PROMPTS}\n${firstMessage.content}` },
        ...sendProcess.messages.slice(1)
      ]
      delete sendProcess.displayMessages
      return sendProcess
    }

    const getAiRespMessage = (content, role = 'assistant') => ({
      role,
      content,
      name: 'AI'
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

    const sendRequest = () => {
      getMetaApi(META_SERVICE.Http)
        .post('/app-center/api/ai/chat', getSendSeesionProcess(), { timeout: 600000 })
        .then((res: any) => {
          const { choices } = res
          const chatMessage = choices[0]?.message
          const jsonString = chatMessage?.content.replace(/^```json|```$/g, '').trim()
          const newValue = JSON.parse(jsonString)
          try {
            if (isValidFastJsonPatch(newValue)) {
              // 使用 applyPatch 修改 Schema
              const result = newValue.reduce(jsonpatch.applyReducer, pageState.pageSchema)

              sessionProcess.messages.push(
                getAiRespMessage(JSON.stringify(pageState.pageSchema, null, 2), chatMessage.role)
              )
              sessionProcess.displayMessages.push(getAiDisplayMessage(MESSAGE_TIP, chatMessage.role, result, res.id))
              messages.value[messages.value.length - 1].content = MESSAGE_TIP
              messages.value[messages.value.length - 1].schema = result
              messages.value[messages.value.length - 1].id = res.id
            }
            setContextSession()
            inProcesing.value = false
            connectedFailed.value = false
          } catch (e) {
            messages.value[messages.value.length - 1].content = '处理响应时出错'
            inProcesing.value = false
            connectedFailed.value = false
          }
        })
        .catch(() => {
          messages.value[messages.value.length - 1].content = '连接失败'
          localStorage.removeItem('aiChat')
          inProcesing.value = false
          connectedFailed.value = false
        })
    }

    const scrollContent = async () => {
      await sleep(100)
      const scrollElement = document.getElementById('chatgpt-window')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
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

        res.slice(0, 10).forEach((item) => {
          searchContent.value += item.content
        })
      } catch (error) {
        console.error('Search failed:', error)
      }
    }

    const getMessage = async (content) => ({
      role: 'user',
      content,
      name: 'John'
    })

    const sendContent = async (content, isModel) => {
      if (!isSaved() && !pageSettingState.isNew) {
        Notify({
          type: 'error',
          message: `当前${isBlock() ? '区块' : '页面'}尚未保存，请保存后再试！`,
          position: 'top-right',
          duration: 5000
        })
        return
      }
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
        await search(realContent)
        const message = await getMessage(realContent)
        inProcesing.value = true
        messages.value.push(message)
        sessionProcess?.messages.push({ ...message, content: [content, searchContent.value].join(',') })
        sessionProcess?.displayMessages.push(message)

        if (!isModel) {
          inputContent.value = ''
        }
        await scrollContent()
        await sleep(1000)
        messages.value.push(getAiDisplayMessage('好的，正在执行相关操作，请稍等片刻...'))
        await scrollContent()
        sendRequest()
      }
    }

    // 根据localstorage初始化AI大模型
    const initCurrentModel = (aiSession) => {
      selectedModel.value = {
        ...JSON.parse(aiSession)?.foundationModel
      }
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
      initChat()
    }

    const changeApiKey = () => {
      localStorage.removeItem('aiChat')
      sessionProcess = null
      setContextSession()
      sessionProcess = JSON.parse(localStorage.getItem('aiChat'))
    }

    const changeModel = (model) => {
      if (selectedModel.value.baseUrl !== model.baseUrl) {
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
            endContent()
          }
        })
      } else if (selectedModel.value.apiKey !== model.apiKey && selectedModel.value.baseUrl === model.baseUrl) {
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
    const previewIcon = getSvgIcon('preview', { fontSize: '20px' })
    const saveIcon = getSvgIcon('save', { fontSize: '20px' })

    // 对话角色配置
    const roles = ref({
      assistant: {
        placement: 'start',
        avatar: aiAvatar,
        maxWidth: '80%',
        slots: {
          footer: ({ bubbleProps }) => {
            return h(TrFeedback, {
              style: {
                display: getItemSchema(bubbleProps)?.schema ? 'block' : 'none'
              },
              actions: [
                { name: 'preview', label: '预览', icon: previewIcon },
                { name: 'run', label: '运行', icon: saveIcon }
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
      user: { placement: 'end', avatar: userAvatar, maxWidth: '80%' }
    })

    return {
      robotVisible,
      avatarUrl,
      chatWindowOpened,
      activeMessages,
      inputContent,
      connectedFailed,
      AIModelOptions,
      selectedModel,
      tokenValue,
      showPopover,
      fullscreen,
      welcomeIcon,
      roles,
      currentSchema,
      showPreview,
      sendContent,
      endContent,
      changeApiKey,
      resizeChatWindow,
      changeModel,
      openAIRobot,
      closePanel,
      handlePromptItemClick,
      setSchema
    }
  }
}
</script>

<style lang="less" scope>
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

.tiny-container {
  top: var(--base-top-panel-height) !important;
  background-image: linear-gradient(
    var(--te-chat-bg-top-color),
    var(--te-chat-bg-mid-color),
    var(--te-chat-bg-bottom-color)
  );
  container-type: inline-size;

  :deep(button.icon-btn) {
    background-color: rgba(0, 0, 0, 0);
  }

  :deep(.robot-setting button) {
    margin-left: 10px;
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

  .tiny-prompts {
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
        background-color: #c3d3f6;
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
</style>
