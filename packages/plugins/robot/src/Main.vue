<template>
  <div class="bind-chatgpt" id="bind-chatgpt">
    <section>
      <div class="chat-title-icons">
        <svg-icon name="close" class="common-svg" @click="$emit('close-chat')"></svg-icon>
        <svg-icon
          :name="chatWindowOpened ? 'chat-maximize' : 'chat-minimize'"
          class="common-svg"
          @click="resizeChatWindow"
        ></svg-icon>
      </div>
    </section>
    <header class="chat-title">
      <tiny-dropdown trigger="click" :show-icon="false">
        <span>
          <span>{{ selectedModel.label }}</span>
          <icon-chevron-down class="ml8"></icon-chevron-down>
        </span>
        <template #dropdown>
          <tiny-dropdown-menu popper-class="chat-model-popover" placement="bottom" :visible-arrow="false">
            <tiny-dropdown-item
              v-for="item in AIModelOptions"
              :key="item.label"
              :class="{ 'selected-model': selectedModel.value === item.value }"
              @click="changeModel(item)"
              >{{ item.label }}</tiny-dropdown-item
            >
          </tiny-dropdown-menu>
        </template>
      </tiny-dropdown>
    </header>
    <article class="chat-window lowcode-scrollbar-hide" id="chatgpt-window">
      <tiny-layout>
        <tiny-row
          v-for="(item, index) in activeMessages"
          :key="index"
          :flex="true"
          :order="item.role === 'user' ? 'des' : 'asc'"
          :justify="item.role === 'user' ? 'end' : 'start'"
          class="chat-message-row"
        >
          <tiny-col :span="1" :no="1" class="chat-avatar-wrap">
            <img v-if="item.role !== 'user'" class="chat-avatar chat-avatar-ai" src="../assets/AI.png" />
            <img v-else class="chat-avatar" :src="avatarUrl" />
          </tiny-col>
          <tiny-col :span="22" :no="2">
            <div
              :class="[
                'chat-content',
                chatWindowOpened ? '' : 'hidden-text',
                item.role === 'user'
                  ? 'chat-content-user'
                  : connectedFailed
                  ? 'chat-content-ai-unconnected'
                  : 'chat-content-ai'
              ]"
            >
              <span>{{ item.content }}</span>
            </div>
          </tiny-col>
        </tiny-row>
      </tiny-layout>
    </article>
    <article class="chat-tips">
      <span>需要一个注册表单？</span>
      <span @click="sendContent('如何将表单嵌进我的网站？', true)">如何将表单嵌进我的网站？</span>
      <span>需要一个注册表单？</span>
    </article>
    <footer class="chat-submit">
      <tiny-input placeholder="告诉我，你想做什么..." v-model="inputContent">
        <template #prefix>
          <svg-icon name="chat-message" class="common-svg"></svg-icon>
        </template>
        <template #suffix>
          <svg-icon name="chat-microphone" class="common-svg microphone"></svg-icon>
        </template>
      </tiny-input>
      <tiny-button @click="endContent">重新发起会话</tiny-button>
      <tiny-button @click="sendContent(inputContent, false)">发送</tiny-button>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, watchEffect } from 'vue'
import {
  Layout,
  Row,
  Col,
  Button,
  Input,
  Notify,
  Loading,
  Dropdown as TinyDropdown,
  DropdownMenu as TinyDropdownMenu,
  DropdownItem as TinyDropdownItem
} from '@opentiny/vue'
import { useCanvas, useHistory, usePage, useModal } from '@opentiny/tiny-engine-controller'
import { iconChevronDown } from '@opentiny/vue-icon'
import { extend } from '@opentiny/vue-renderless/common/object'
import { useHttp } from '@opentiny/tiny-engine-http'
import { getBlockContent, initBlockList, AIModelOptions } from './js/robotSetting'

export default {
  components: {
    TinyLayout: Layout,
    TinyButton: Button,
    TinyRow: Row,
    TinyCol: Col,
    TinyInput: Input,
    TinyDropdown,
    TinyDropdownMenu,
    TinyDropdownItem,
    IconChevronDown: iconChevronDown()
  },
  emits: ['close-chat'],
  setup() {
    const { initData, isBlock, isSaved, clearCurrentState } = useCanvas()
    const avatarUrl = ref('')
    const chatWindowOpened = ref(true)
    const http = useHttp()
    let sessionProcess = null
    const messages = ref([])
    const activeMessages = ref([])
    const connectedFailed = ref(false)
    const inputContent = ref('')
    const inProcesing = ref(false)
    const selectedModel = ref(AIModelOptions[0])
    const { confirm } = useModal()

    const { pageSettingState, DEFAULT_PAGE } = usePage()
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
                model: selectedModel.value.value
              },
              messages: [],
              displayMessages: [] // 专门用来进行展示的消息，非原始消息，仅作为展示但是不作为请求的发送
            })
      )
    }

    const createNewPage = (schema) => {
      if (!(pageSettingState.isNew && pageSettingState.isAIPage)) {
        pageSettingState.isNew = true
        pageSettingState.isAIPage = true
        pageSettingState.currentPageData = {
          ...DEFAULT_PAGE,
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
      firstMessage.content
      sendProcess.messages = [
        { ...firstMessage, content: `${getBlockContent()}\n${codeRules}\n${firstMessage.content}` },
        ...sendProcess.messages.slice(1)
      ]
      delete sendProcess.displayMessages
      return sendProcess
    }

    const getAiRespMessage = (role = 'assistant', content) => ({
      role,
      content,
      name: 'AI'
    })
    const sendRequest = () => {
      http
        .post('/app-center/api/ai/chat', getSendSeesionProcess(), { timeout: 600000 })
        .then((res) => {
          const { originalResponse, schema, replyWithoutCode } = res
          const responseMessage = getAiRespMessage(
            originalResponse.choices?.[0]?.message.role,
            originalResponse.choices?.[0]?.message.content
          )
          const respDisplayMessage = getAiRespMessage(originalResponse.choices?.[0]?.message.role, replyWithoutCode)
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
    const scrollContent = async () => {
      await sleep(100)
      let scrollElement = document.getElementById('chatgpt-window')
      scrollElement.scrollTop = scrollElement.scrollHeight
    }

    const resetContent = async () => {
      activeMessages.value = chatWindowOpened.value ? messages.value : [messages.value[messages.value.length - 1]]
      await scrollContent()
    }

    const resizeChatWindow = async () => {
      chatWindowOpened.value = !chatWindowOpened.value
      await resetContent()
    }

    const getMessage = (content) => ({
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
      messages.value.unshift({
        role: 'assistant',
        content:
          '你好，很高兴为你服务，请描述你的问题，方便我们能够准确回答。你好，很高兴为你服务，请描述你的问题，方便我们能够准确回答。',
        name: 'AI'
      })
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

    const changeModel = (model) => {
      if (selectedModel.value.value !== model.value) {
        confirm({
          title: '切换AI大模型',
          message: '切换AI大模型将导致当前会话被清空，重新开启新会话，是否继续？',
          exec() {
            selectedModel.value = model
            endContent()
          }
        })
      }
    }
    return {
      avatarUrl,
      chatWindowOpened,
      activeMessages,
      inputContent,
      connectedFailed,
      sendContent,
      endContent,
      resizeChatWindow,
      AIModelOptions,
      selectedModel,
      changeModel
    }
  }
}
</script>

<style lang="less" scope>
.common-svg {
  color: var(--ti-lowcode-chat-model-common-icon);
}

.chat-title-icons {
  font-size: 16px;
  height: 16px;
  svg {
    float: right;
    margin: 0 4px;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
    }
  }
}
.chat-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 20px;
  color: var(--ti-lowcode-chat-model-title);
}
.chat-window {
  max-height: 400px;
  overflow: scroll;
  .chat-avatar-wrap {
    width: 46px;
    .chat-avatar {
      width: 28px;
      height: 28px;
      font-size: 26px;
      margin-top: 10px;
      border: 1px solid var(--ti-lowcode-chat-model-avatar-border);
      border-radius: 50px;
    }
    .chat-avatar-ai {
      border: none;
    }
  }
  .chat-content {
    max-width: 568px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: normal;
    line-height: 20px;
    padding: 12px 20px;

    &.chat-content-user {
      background-color: var(--ti-lowcode-chat-model-user-text-bg);
      border: 1px solid var(--ti-lowcode-chat-model-user-text-border);
      color: var(--ti-lowcode-chat-model-user-text);
    }
  }
  .chat-message-row {
    margin-bottom: 20px;
  }
}

.chat-content-ai {
  background-color: var(--ti-lowcode-chat-model-ai-text-bg);
  border: 1px solid var(--ti-lowcode-chat-model-ai-text-border);
  color: var(--ti-lowcode-chat-model-ai-text);
}

.chat-content-ai-unconnected {
  background-color: var(--ti-lowcode-chat-model-ai-fail-text-bg);
  border: 1px solid var(--ti-lowcode-chat-model-ai-fail-text-border);
  color: var(--ti-lowcode-chat-model-ai-fail-text);
}

.chat-tips {
  text-align: right;
  font-size: 12px;
  margin-top: 10px;
  color: var(--ti-lowcode-chat-model-text);
  span {
    display: inline-block;
    line-height: 32px;
    padding: 0 15px;
    margin: 0 5px;
    border: 1px solid var(--ti-lowcode-chat-model-text-border);
    border-radius: 20px;
    cursor: pointer;
    &:hover {
      border-color: var(--ti-lowcode-chat-model-text);
    }
  }
}
.chat-submit {
  margin-top: 14px;
  font-size: 14px;
  .tiny-input {
    width: calc(100% - 236px);
    .tiny-input__inner {
      height: 40px;
      background-color: var(--ti-lowcode-chat-model-input-bg);
      border: none;
    }
    svg {
      font-size: 16px;
      color: var(--ti-lowcode-chat-model-input-icon);
    }
    .microphone {
      font-size: 18px;
    }
  }
  .tiny-button {
    background-color: var(--ti-lowcode-chat-model-button-bg) !important;
    border: 1px solid var(--ti-lowcode-chat-model-button-border) !important;
    color: var(--ti-lowcode-chat-model-button-text) !important;
    font-size: 12px;
    height: 40px;
    border-radius: 12px !important;
    float: right;
    margin-right: 5px;
    &:hover {
      opacity: 0.8;
    }
  }
}
.hidden-text {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.chat-loading .tiny-loading__spinner svg {
  fill: var(--ti-lowcode-chat-loading-svg-color);
}
.chat-loading .tiny-loading__spinner .tiny-loading__text {
  color: var(--ti-lowcode-chat-loading-text-color);
}
.chat-model-popover {
  background-color: var(--ti-lowcode-chat-model-popover-bg);
  .tiny-dropdown-item {
    color: var(--ti-lowcode-chat-model-popover-color);
    &:hover {
      color: var(--ti-lowcode-chat-model-popover-active-color);
      background-color: var(--ti-lowcode-chat-model-popover-active-bg);
    }
  }
  .selected-model {
    color: var(--ti-lowcode-chat-model-popover-active-color);
    background-color: var(--ti-lowcode-chat-model-popover-active-bg);
  }
}
</style>
