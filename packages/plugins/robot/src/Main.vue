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
          <template v-if="activeMessages.length === 0">
            <tr-welcome title="AI助手" description="您好，我是您的开发小助手" :icon="welcomeIcon" class="robot-welcome">
            </tr-welcome>
            <tr-prompts
              :items="promptItems"
              :wrap="true"
              item-class="prompt-item"
              class="tiny-prompts"
              @item-click="handlePromptItemClick"
            ></tr-prompts>
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
              :maxLength="1000"
              @submit="sendContent(inputContent, false)"
            ></tr-sender>
          </template>
        </tr-container>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, watchEffect, type CSSProperties, h, resolveComponent, onBeforeUnmount } from 'vue'
import { Notify, Loading, TinyPopover } from '@opentiny/vue'
import { useModal, getAllAiTools } from '@opentiny/tiny-engine-meta-register'
import { TrContainer, TrWelcome, TrPrompts, TrBubbleList, TrSender } from '@opentiny/tiny-robot'
import type { BubbleRoleConfig, PromptProps } from '@opentiny/tiny-robot'
import { IconNewSession } from '@opentiny/tiny-robot-svgs'
import { zodToJsonSchema } from 'zod-to-json-schema'
import RobotSettingPopover from './RobotSettingPopover.vue'
import { initBlockList, AIModelOptions } from './js/robotSetting'

// WebSocket连接配置
const WS_URL = 'ws://localhost:4090'
const logger = console

export default {
  components: {
    TinyPopover,
    RobotSettingPopover,
    TrContainer,
    TrWelcome,
    TrPrompts,
    TrBubbleList,
    TrSender,
    IconNewSession
  },
  emits: ['close-chat'],
  setup() {
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
    const ws = ref(null)
    const wsConnected = ref(false)
    const aiTools = getAllAiTools()

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

    // 在每一次发送请求之前，都把引入区块的内容，给放到第一条消息中
    // 为了不污染存储在localstorage里的用户的原始消息，这里进行了简单的对象拷贝
    // 引入区块不存放在localstorage的原因：因为区块是可以变化的，用户可能在同一个会话中，对区块进行了删除和创建。那么存放的数据就不是即时数据了。
    const getSendSeesionProcess = () => {
      const sendProcess = { ...sessionProcess }
      // const firstMessage = sendProcess.messages[0]
      sendProcess.messages = [
        // { ...firstMessage, content: `${getBlockContent()}\n${codeRules}\n${firstMessage.content}` },
        ...sendProcess.messages.map((item) => ({
          ...item
          // content: marked(item.content, { sanitize: false })
        }))
      ]
      delete sendProcess.displayMessages
      return sendProcess
    }

    const getAiRespMessage = (role = 'assistant', content) => ({
      role,
      content,
      name: 'AI'
    })

    // 初始化WebSocket连接
    const initWebSocket = () => {
      if (ws.value) {
        ws.value.close()
      }

      try {
        ws.value = new WebSocket(WS_URL)

        ws.value.onopen = () => {
          wsConnected.value = true
          // 发送初始化消息
          ws.value.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        }

        ws.value.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data)

            // 根据消息类型处理不同的响应
            switch (data.type) {
              case 'ping':
                // 处理ping响应
                logger.log('ping', data)
                break
              case 'welcome':
                // 处理欢迎消息
                break
              case 'get_builtin_tools': {
                const toolsFiltered = aiTools.map(({ handler, inputSchema, ...rest }) => ({
                  ...rest,
                  inputSchema: zodToJsonSchema(inputSchema)
                }))
                logger.log('tools', JSON.stringify(toolsFiltered))
                // 获取内置工具
                ws.value.send(
                  JSON.stringify({
                    type: 'register_builtin_tools',
                    tools: toolsFiltered
                  })
                )
                break
              }
              case 'call_builtin_tool': {
                // 获取内置工具
                try {
                  logger.log('call_builtin_tool', data)
                  const tool = aiTools.find((tool) => tool.name === data.toolName)
                  logger.log('tool will be called', tool)

                  if (tool) {
                    const res = await tool.handler({ ...JSON.parse(data.arg_string), toolCallId: data.toolCallId })
                    logger.log('res', res)

                    ws.value.send(
                      JSON.stringify({
                        type: 'call_builtin_tool_response',
                        toolCallId: data.toolCallId,
                        content: res
                      })
                    )
                  }
                } catch (error) {
                  logger.error('error', error)
                  ws.value.send(
                    JSON.stringify({
                      type: 'call_builtin_tool_response',
                      toolCallId: data.toolCallId,
                      error: error.message
                    })
                  )
                }
                break
              }
              case 'chat_response': {
                // 处理AI聊天响应
                logger.log('event ', event)
                logger.log('data', data)
                if (data.data?.originalResponse) {
                  const { originalResponse, replyWithoutCode } = data.data
                  const responseMessage = getAiRespMessage(originalResponse.role, originalResponse.content)
                  const respDisplayMessage = getAiRespMessage(originalResponse.role, replyWithoutCode.content)
                  sessionProcess.messages.push(responseMessage)
                  sessionProcess.displayMessages.push(respDisplayMessage)
                  messages.value[messages.value.length - 1].content = replyWithoutCode.content
                  messages.value[messages.value.length - 1].type = 'markdown'
                  setContextSession()
                  inProcesing.value = false
                  connectedFailed.value = false
                }
                break
              }
              default:
              // 处理其他类型消息
            }
          } catch (error) {
            // 处理消息解析错误
          }
        }

        ws.value.onerror = () => {
          wsConnected.value = false
        }

        ws.value.onclose = () => {
          wsConnected.value = false
          // 添加重连逻辑
          setTimeout(() => {
            if (!ws.value || ws.value.readyState === WebSocket.CLOSED) {
              initWebSocket()
            }
          }, 3000)
        }
      } catch (error) {
        wsConnected.value = false
      }
    }

    const sendRequest = () => {
      // 尝试通过WebSocket发送，如果不成功则fallback到HTTP
      if (wsConnected.value && ws.value && ws.value.readyState === WebSocket.OPEN) {
        const message = {
          type: 'chat',
          content: getSendSeesionProcess(),
          // content: {
          //   query: messages.value[messages.value.length - 2].content,
          //   model: selectedModel.value.value,
          //   token: tokenValue.value
          // },
          timestamp: Date.now()
        }

        try {
          ws.value.send(JSON.stringify(message))
          // console.log('res', res)
          // const {
          //   originalResponse,
          //   replyWithoutCode
          //   // schema
          // } = res
          // const responseMessage = getAiRespMessage(originalResponse.role, originalResponse.content)
          // const respDisplayMessage = getAiRespMessage(originalResponse.role, replyWithoutCode.content)
          // sessionProcess.messages.push(responseMessage)
          // sessionProcess.displayMessages.push(respDisplayMessage)
          // messages.value[messages.value.length - 1].content = replyWithoutCode.content
          // setContextSession()
          // // if (schema?.schema) {
          // //   createNewPage(schema.schema)
          // // }
          // inProcesing.value = false
          // connectedFailed.value = false
          // WebSocket请求已发送，响应将通过onmessage事件处理
          return
        } catch (error) {
          messages.value[messages.value.length - 1].content = '连接失败'
          localStorage.removeItem('aiChat')
          inProcesing.value = false
          connectedFailed.value = true
        }
      }
      // getMetaApi(META_SERVICE.Http)
      //   .post('/app-center/api/ai/chat', getSendSeesionProcess(), { timeout: 600000 })
      //   .then((res) => {
      //     const { originalResponse, schema, replyWithoutCode } = res
      //     const responseMessage = getAiRespMessage(originalResponse.role, originalResponse.content)
      //     const respDisplayMessage = getAiRespMessage(originalResponse.role, replyWithoutCode)
      //     sessionProcess.messages.push(responseMessage)
      //     sessionProcess.displayMessages.push(respDisplayMessage)
      //     messages.value[messages.value.length - 1].content = replyWithoutCode
      //     setContextSession()
      //     if (schema?.schema) {
      //       createNewPage(schema.schema)
      //     }
      //     inProcesing.value = false
      //     connectedFailed.value = false
      //   })
      //   .catch(() => {
      //     messages.value[messages.value.length - 1].content = '连接失败'
      //     localStorage.removeItem('aiChat')
      //     inProcesing.value = false
      //     connectedFailed.value = false
      //   })
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

    const getMessage = (content) => ({
      role: 'user',
      content,
      name: 'John'
    })

    const sendContent = async (content, isModel) => {
      // if (!isSaved() && !pageSettingState.isNew) {
      //   Notify({
      //     type: 'error',
      //     message: `当前${isBlock() ? '区块' : '页面'}尚未保存，请保存后再试！`,
      //     position: 'top-right',
      //     duration: 5000
      //   })
      //   return
      // }
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
      selectedModel.value = AIModelOptions.find((item) => item.value === currentModelValue)
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
      // 初始化WebSocket连接
      initWebSocket()
    })

    // 组件卸载前关闭WebSocket连接
    onBeforeUnmount(() => {
      if (ws.value) {
        ws.value.close()
        ws.value = null
      }
    })

    const endContent = () => {
      localStorage.removeItem('aiChat')
      sessionProcess = null
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
        label: '页面搭建场景',
        description: '如何生成表单嵌进我的网站？',
        icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '✨'),
        badge: 'NEW'
      },
      {
        label: '学习/知识型场景',
        description: '有什么想了解的吗？可以是“Vue3 和 React 的区别”！',
        icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '🤔')
      },
      {
        label: '创意生成场景',
        description: '想写段文案、起个名字，还是来点灵感？',
        icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '💡')
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
      assistant: { placement: 'start', avatar: aiAvatar, maxWidth: '80%' },
      user: { placement: 'end', avatar: userAvatar, maxWidth: '80%' }
    }

    return {
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
      roles
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
