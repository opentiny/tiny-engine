<template>
  <div>
    <div title="AI对话框" class="robot-img">
      <svg-icon name="AI" @click="openAIRobot"></svg-icon>
    </div>
    <Teleport to="body">
      <div v-if="robotVisible" class="robot-dialog">
        <div class="bind-chatgpt" id="bind-chatgpt">
          <section>
            <div class="chat-title-icons">
              <svg-icon name="close" class="common-svg opt-button" @click="robotVisible = false"></svg-icon>
              <svg-icon
                :name="chatWindowOpened ? 'chat-maximize' : 'chat-minimize'"
                class="common-svg opt-button"
                @click="resizeChatWindow"
              ></svg-icon>
            </div>
          </section>
          <header class="chat-title">
            <tiny-dropdown trigger="click" :show-icon="false">
              <span class="chat-title-dropdown">
                <span class="chat-title-label">{{ selectedModel.label }}</span>
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
          <div class="robot-dialog-content">
            <div class="robot-dialog-content-top">
              <div class="robot-dialog-content-top-title">我是你的开发小助手</div>
              <span class="robot-dialog-content-top-icon"><svg-icon name="AI" class="icon-ai"></svg-icon>智能对话</span>
              <article class="chat-tips">
                <span @click="sendContent('需要一个注册表单？', true)">需要一个注册表单？</span>
                <span @click="sendContent('如何将表单嵌进我的网站？', true)">如何将表单嵌进我的网站？</span>
              </article>
            </div>
            <article
              :class="[
                'chat-window',
                'lowcode-scrollbar-hide',
                chatWindowOpened ? 'max-chat-window' : 'min-chat-window'
              ]"
              id="chatgpt-window"
            >
              <tiny-layout>
                <tiny-row
                  v-for="(item, index) in activeMessages"
                  :key="index"
                  :flex="true"
                  :order="item.role === 'user' ? 'des' : 'asc'"
                  :justify="item.role === 'user' ? 'end' : 'start'"
                  class="chat-message-row"
                >
                  <tiny-col
                    :span="1"
                    :no="1"
                    class="chat-avatar-wrap"
                    :class="{ 'chat-avatar-wrap-ai': item.role !== 'user' }"
                  >
                    <svg-icon v-if="item.role !== 'user'" class="chat-avatar chat-avatar-ai" name="AI"></svg-icon>
                    <svg-icon v-else class="chat-avatar" name="user-head"></svg-icon>
                  </tiny-col>
                  <tiny-col :span="22" :no="2">
                    <div
                      :class="[
                        'chat-content',
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

            <footer class="chat-submit">
              <tiny-input
                @keydown.enter="sendContent(inputContent, false)"
                placeholder="请输入问题或“/”唤起指令，支持粘贴文档"
                v-model="inputContent"
              >
                <template #suffix>
                  <svg-icon name="chat-send" class="common-svg" @click="sendContent(inputContent, false)"></svg-icon>
                </template>
              </tiny-input>
              <tiny-button @click="endContent"><svg-icon name="add"></svg-icon><span>新对话</span></tiny-button>
            </footer>
          </div>
        </div>
      </div>
    </Teleport>
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
import { useCanvas, useHistory, usePage, useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { iconChevronDown } from '@opentiny/vue-icon'
import { extend } from '@opentiny/vue-renderless/common/object'
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
    const scrollContent = async () => {
      await sleep(100)
      let scrollElement = document.getElementById('chatgpt-window')
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

    const openAIRobot = () => {
      robotVisible.value = !robotVisible.value
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
      resizeChatWindow,
      AIModelOptions,
      selectedModel,
      changeModel,
      openAIRobot
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

.robot-dialog {
  position: fixed;
  width: 450px;
  z-index: 5;
  right: 40px;
  bottom: 40px;
  background-image: linear-gradient(
    var(--ti-lowcode-chat-bg-top-color),
    var(--ti-lowcode-chat-bg-mid-color),
    var(--ti-lowcode-chat-bg-bottom-color)
  );
  box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.15);
  padding: 16px;
  border-radius: 12px;
}
.common-svg {
  color: var(--ti-lowcode-chat-model-common-icon);
}

.chat-title-icons {
  font-size: 20px;
  height: 20px;
  margin-bottom: 20px;
  svg {
    float: right;
    margin: 0 6px;
    cursor: pointer;
    color: var(--ti-lowcode-chat-model-icon);
    &:hover {
      opacity: 0.8;
    }
    &:first-child {
      margin-right: 0;
    }
  }
}
.chat-title {
  position: absolute;
  top: 16px;
  left: 28px;
  font-weight: bold;
  color: var(--ti-lowcode-chat-model-text);
  .chat-title-dropdown {
    display: flex;
    align-items: center;
    height: 24px;
  }
  .chat-title-label,
  .ml8 {
    color: var(--ti-lowcode-chat-model-text);
    font-weight: 700;
    font-size: 16px;
  }
  .ml8 {
    color: var(--te-common-icon-secondary);
    margin-left: 10px;
  }
}

.robot-dialog-content {
  background: var(--ti-lowcode-chat-model-bg);
  border-radius: 6px;
  padding: 16px;
  &-top {
    margin-bottom: 30px;
    &-title {
      color: var(--ti-lowcode-chat-model-helper-text);
      font-size: 12px;
      margin-bottom: 12px;
    }
    &-icon {
      color: var(--ti-lowcode-chat-model-text);
    }
    .icon-ai {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }
    .chat-tips {
      text-align: left;
      font-size: 12px;
      margin-top: 10px;
      color: var(--ti-lowcode-chat-model-tips-text);
      span {
        display: inline-block;
        height: 28px;
        line-height: 28px;
        padding: 0 8px;
        margin-right: 8px;
        border-radius: 4px;
        background: var(--ti-lowcode-chat-model-tips-bg);
        cursor: pointer;
        &:hover {
          border-color: var(--ti-lowcode-chat-model-text);
        }
      }
    }
  }
}
.chat-window {
  overflow: scroll;
  .chat-avatar-wrap {
    width: 40px;
    color: var(--ti-lowcode-chat-model-avatar-border);
    .chat-avatar {
      width: 24px;
      height: 24px;
      font-size: 26px;
      margin-top: 6px;
      border-radius: 50px;
      border: none;
    }
  }
  .chat-avatar-wrap-ai {
    padding-left: 0;
  }
  .chat-content {
    max-width: 465px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: normal;
    line-height: 20px;
    padding: 12px;

    &.chat-content-user {
      background-color: var(--ti-lowcode-chat-model-user-text-bg);
      color: var(--ti-lowcode-chat-model-user-text);
    }
  }
  .chat-message-row {
    margin-bottom: 20px;
  }
  &.max-chat-window {
    height: 520px;
  }
  &.min-chat-window {
    height: 80px;
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

.chat-submit {
  margin-top: 14px;
  font-size: 14px;
  display: flex;
  .tiny-input {
    .tiny-input__inner {
      padding-left: 12px;
      color: var(--ti-lowcode-chat-model-helper-text);
      height: 40px;
      border: 2px solid var(--ti-lowcode-chat-model-input-border);
      border-radius: 8px;
      padding-right: 44px;
    }
    .tiny-input__inner:hover {
      border-color: var(--ti-lowcode-chat-model-input-border);
    }
    .tiny-input__inner:focus {
      border-color: var(--ti-lowcode-chat-model-input-border);
    }
    .tiny-input__prefix,
    .tiny-input__suffix {
      padding-right: 8px;
    }
    clip-path: inset(0 0 round 2px);
    svg {
      font-size: 16px;
    }
  }

  .tiny-button.tiny-button.tiny-button {
    margin-left: 12px;
    background-image: linear-gradient(
      to bottom right,
      var(--ti-lowcode-chat-model-button-bg-1),
      var(--ti-lowcode-chat-model-button-bg-2),
      var(--ti-lowcode-chat-model-button-bg-3)
    );
    border: none;
    color: var(--ti-lowcode-chat-model-button-text) !important;
    font-size: 14px;
    height: 40px;
    width: 40px;
    min-width: 40px;
    border-radius: 50%;
    float: right;
    padding: 0;
    transition: all 0.1s linear;
    .svg-icon {
      fill: var(--ti-lowcode-chat-model-button-text);
      margin-right: 0;
    }
    span {
      display: none;
    }
    &:hover {
      transform: scale(1);
      border-radius: 8px;
      width: 105px;
      padding: 0 12px;
      span {
        display: inline-block;
        margin-left: 4px;
      }
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
.chat-model-popover.chat-model-popover {
  width: 220px;
  background-color: var(--te-common-bg-default);
  .tiny-dropdown-item {
    color: var(--te-common-text-primary);
    max-width: 220px;
    &:hover {
      color: var(--te-common-text-primary);
      background-color: var(--te-common-bg-container);
    }
  }
  .selected-model {
    color: var(--te-common-text-primary);
    background-color: var(--te-common-bg-container);
  }
}
</style>
