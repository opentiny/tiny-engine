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
              width="270"
              trigger="manual"
              v-model="showPopover"
              :visible-arrow="false"
              popper-class="chat-popover"
            >
              <robot-setting-popover
                v-if="showPopover"
                :typeValue="selectedModel"
                :tokenValue="tokenValue"
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
              v-model="inputContent"
              :autoSize="{ minRows: 1, maxRows: 5 }"
              :loading="requestLoading"
              placeholder="请输入您的问题..."
              @submit="sendContent(inputContent, false)"
            >
              <template #footer-left>
                <mcp-server :position="mcpDrawerPosition"></mcp-server>
              </template>
            </tr-sender>
          </template>
        </tr-container>
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
import { Notify, Loading, TinyPopover } from '@opentiny/vue'
import { useCanvas, useHistory, usePage, useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { extend } from '@opentiny/vue-renderless/common/object'
import { TrContainer, TrWelcome, TrPrompts, TrBubbleList, TrSender, TrBubbleProvider } from '@opentiny/tiny-robot'
import type { BubbleRoleConfig, PromptProps } from '@opentiny/tiny-robot'
import { IconNewSession } from '@opentiny/tiny-robot-svgs'
import RobotSettingPopover from './RobotSettingPopover.vue'
import { getBlockContent, initBlockList, getAIModelOptions } from './js/robotSetting'
import McpServer from './mcp/McpServer.vue'
import useMcpServer from './mcp/useMcp'
import MarkdownRenderer from './mcp/MarkdownRenderer.vue'
import LoadingRenderer from './mcp/LoadingRenderer.vue'
import { sendMcpRequest } from './mcp/utils'

export default {
  components: {
    TinyPopover,
    RobotSettingPopover,
    TrContainer,
    TrWelcome,
    TrPrompts,
    TrBubbleList,
    TrSender,
    IconNewSession,
    McpServer,
    TrBubbleProvider
  },
  emits: ['close-chat'],
  setup() {
    const { initData, clearCurrentState } = useCanvas()
    const AIModelOptions = getAIModelOptions()
    const robotVisible = ref(false)
    const avatarUrl = ref('')
    const chatWindowOpened = ref(true)
    let sessionProcess = null
    const messages = ref([])
    const activeMessages = ref([])
    const connectedFailed = ref(false)
    const inputContent = ref('')
    const inProcesing = ref(false)
    const selectedModel = ref(AIModelOptions[0])
    const { confirm } = useModal()
    const tokenValue = ref('')
    const showPopover = ref(false)

    const chatContainerRef = ref(null)

    const { pageSettingState, getDefaultPage } = usePage()
    const ROOT_ID = pageSettingState.ROOT_ID
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
                manufacturer: selectedModel.value.manufacturer,
                model: selectedModel.value.value,
                token: tokenValue.value
              },
              messages: [],
              displayMessages: [] // 专门用来进行展示的消息，非原始消息，仅作为展示但是不作为请求的发送
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

    const createNewPage = (schema) => {
      if (!(pageSettingState.isNew && pageSettingState.isAIPage)) {
        pageSettingState.isNew = true
        pageSettingState.isAIPage = true
        pageSettingState.currentPageData = {
          ...getDefaultPage(),
          parentId: ROOT_ID,
          route: 'temporaryPage',
          name: 'TemporaryPage',
          group: 'staticPages'
        }
      }
      pageSettingState.currentPageData['page_content'] = schema
      pageSettingState.currentPageDataCopy = extend(true, {}, pageSettingState.currentPageData)
      clearCurrentState()
      // 已经创建过临时页面只更新schema
      initData(pageSettingState.currentPageData['page_content'], pageSettingState.currentPageData)
      useHistory().addHistory()
    }

    const codeRules = `
    请扮演一名前端开发专家，生成代码时遵从以下几条要求:
###
1. 只使用element-ui组件库完成代码编写
2. 使用vue2技术栈
3. 回复中只能有一个代码块
4. el-table标签内不得出现el-table-column
###
  `

    // 在每一次发送请求之前，都把引入区块的内容，给放到第一条消息中
    // 为了不污染存储在localstorage里的用户的原始消息，这里进行了简单的对象拷贝
    // 引入区块不存放在localstorage的原因：因为区块是可以变化的，用户可能在同一个会话中，对区块进行了删除和创建。那么存放的数据就不是即时数据了。
    const getSendSeesionProcess = () => {
      const sendProcess = { ...sessionProcess }
      const firstMessage = sendProcess.messages[0]
      sendProcess.messages = [
        { ...firstMessage, content: `${getBlockContent()}\n${codeRules}\n${firstMessage.content}` },
        ...sendProcess.messages.slice(1)
      ]
      delete sendProcess.displayMessages
      return sendProcess
    }

    const getAiRespMessage = (role = 'assistant', content) => ({
      role,
      content
    })

    const requestLoading = ref(false)

    const sendRequest = async () => {
      if (useMcpServer().isToolsEnabled) {
        try {
          requestLoading.value = true
          await scrollContent()
          await sendMcpRequest(messages.value, {
            model: selectedModel.value.value,
            headers: {
              Authorization: `Bearer ${tokenValue.value || import.meta.env.VITE_API_TOKEN}`
            }
          })
        } catch (error) {
          messages.value[messages.value.length - 1].content = '连接失败'
        } finally {
          inProcesing.value = false
          requestLoading.value = false
          await scrollContent()
        }
        return
      }
      getMetaApi(META_SERVICE.Http)
        .post('/app-center/api/ai/chat', getSendSeesionProcess(), { timeout: 600000 })
        .then((res) => {
          const { originalResponse, schema, replyWithoutCode } = res
          const responseMessage = getAiRespMessage(originalResponse.role, originalResponse.content)
          const respDisplayMessage = getAiRespMessage(originalResponse.role, replyWithoutCode)
          sessionProcess.messages.push(responseMessage)
          sessionProcess.displayMessages.push(respDisplayMessage)
          messages.value[messages.value.length - 1].content = replyWithoutCode
          setContextSession()
          if (schema?.schema) {
            createNewPage(schema.schema)
          }
          inProcesing.value = false
          connectedFailed.value = false
        })
        .catch(() => {
          messages.value[messages.value.length - 1].content = '连接失败'
          localStorage.removeItem('aiChat')
          inProcesing.value = false
          connectedFailed.value = false
        })
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

    const getMessage = (content) => ({
      role: 'user',
      content
    })

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
        const message = getMessage(realContent)
        inProcesing.value = true

        messages.value.push(message)
        sessionProcess?.messages.push(message)
        sessionProcess?.displayMessages.push(message)
        if (!isModel) {
          inputContent.value = ''
        }
        await scrollContent()
        await sleep(1000)
        messages.value.push({ role: 'assistant', content: '好的，正在执行相关操作，请稍等片刻...', name: 'AI' })
        await scrollContent()
        sendRequest()
      }
    }

    // 根据localstorage初始化AI大模型
    const initCurrentModel = (aiSession) => {
      const currentModelValue = JSON.parse(aiSession)?.foundationModel?.model
      selectedModel.value = AIModelOptions.find((item) => item.value === currentModelValue) || AIModelOptions[0]
      tokenValue.value = JSON.parse(aiSession)?.foundationModel?.token
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

    const changeTokenValue = () => {
      localStorage.removeItem('aiChat')
      sessionProcess = null
      setContextSession()
      sessionProcess = JSON.parse(localStorage.getItem('aiChat'))
    }

    const changeModel = (model) => {
      if (selectedModel.value.value !== model.type) {
        confirm({
          title: '切换AI大模型',
          message: '切换AI大模型将导致当前会话被清空，重新开启新会话，是否继续？',
          exec() {
            selectedModel.value = AIModelOptions.find((item) => item.value === model.type)
            tokenValue.value = model.tokenVal
            endContent()
          }
        })
      } else if (tokenValue.value !== model.tokenVal && selectedModel.value.value === model.type) {
        tokenValue.value = model.tokenVal
        changeTokenValue()
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
        description: '如何生成表单嵌进我的网站？',
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

    // Icon
    const getSvgIcon = (name: string, style?: CSSProperties) => {
      return h(resolveComponent('svg-icon'), { name, style: { fontSize: '32px', ...style } })
    }
    const aiAvatar = getSvgIcon('AI')
    const userAvatar = getSvgIcon('user-head', { color: '#dfe1e6' })
    const welcomeIcon = getSvgIcon('AI', { fontSize: '48px' })

    // 对话角色配置
    const roles: Record<string, BubbleRoleConfig> = {
      assistant: {
        placement: 'start',
        avatar: aiAvatar,
        maxWidth: '90%',
        contentRenderer: MarkdownRenderer,
        customContentField: 'renderContent'
      },
      user: { placement: 'end', avatar: userAvatar, maxWidth: '90%', contentRenderer: MarkdownRenderer }
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
      sendContent,
      endContent,
      changeTokenValue,
      resizeChatWindow,
      AIModelOptions,
      selectedModel,
      changeModel,
      openAIRobot,
      closePanel,
      tokenValue,
      showPopover,
      fullscreen,
      promptItems,
      handlePromptItemClick,
      welcomeIcon,
      roles,
      contentRenderers,
      requestLoading,
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

  .tiny-sender {
    margin: 20px;

    .tiny-sender__footer-slot.tiny-sender__bottom-row {
      justify-content: space-between !important;
    }
  }
}
</style>
