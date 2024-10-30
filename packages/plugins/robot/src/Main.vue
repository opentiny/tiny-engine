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
        <icon-setting class="common-svg" @click="setToken"></icon-setting>
      </div>
    </section>
    <header class="chat-title">
      <tiny-dropdown trigger="click" :show-icon="false">
        <span>
          <span>{{ selectedModel.label }}</span>
          <icon-chevron-down class="ml8 arrow-down"></icon-chevron-down>
        </span>
        <template #dropdown>
          <tiny-dropdown-menu popper-class="chat-model-popover" placement="bottom" :visible-arrow="false">
            <tiny-dropdown-item
              v-for="item in AIModelOptions"
              :key="item.label"
              :class="{ 'selected-model': currentModel === item.value }"
              @click="changeModel(item)"
              >{{ item.label }}
            </tiny-dropdown-item>
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
          :justify="item.role === 'assistant' ? 'start' : 'end'"
          class="chat-message-row"
        >
          <tiny-col v-if="item.role !== 'system'" :span="1" :no="1" class="chat-avatar-wrap">
            <img v-if="item.role !== 'user'" class="chat-avatar chat-avatar-ai" src="../assets/AI.png" />
            <img v-else class="chat-avatar" :src="avatarUrl" />
          </tiny-col>
          <tiny-col :span="22" :no="2">
            <div
              v-if="item.role !== 'system'"
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
              <dialog-content :markdown-content="item.content" />
            </div>
            <div v-else class="chat-message-image">
              <img class="image" :src="item.content" alt="" />
            </div>
          </tiny-col>
        </tiny-row>
      </tiny-layout>
    </article>
    <article class="chat-tips">
      <span @click="sendContent('需要一个注册表单？', true)">需要一个注册表单？</span>
      <span @click="sendContent('如何将表单嵌进我的网站？', true)">如何将表单嵌进我的网站？</span>
    </article>
    <footer class="chat-submit">
      <tiny-input placeholder="告诉我，你想做什么..." v-model="inputContent">
        <template #prefix>
          <svg-icon name="chat-message" class="common-svg"></svg-icon>
        </template>
        <template #suffix>
          <icon-picture class="common-svg upload-image" @click="openFilePicker"></icon-picture>
          <svg-icon
            name="chat-microphone"
            :class="['common-svg', 'microphone', { 'microphone-svg': speechStatus }]"
            @click="speechRecognition"
          ></svg-icon>
        </template>
      </tiny-input>
      <tiny-button @click="endContent">重新发起会话</tiny-button>
      <tiny-button @click="sendContent(inputContent, false)">发送</tiny-button>
    </footer>
    <input type="file" ref="fileInput" style="display: none" @change="handleFileChange" />
    <div class="preview-image" v-if="imageUrl !== ''" :data-animated="imageDeleting ? 'out' : ''">
      <img class="image" :src="imageUrl" alt="" />
      <icon-error class="delete-image" @click="handleDelete"></icon-error>
    </div>
  </div>
  <token-dialog
    :dialog-visible="tokenDialogVisible"
    :current-model="selectedModel"
    @dialog-status="getTokenDialogStatus"
    @token-status="updateTokenStatus"
  ></token-dialog>
</template>

<script>
import { ref, onMounted, watch, unref, watchEffect } from 'vue'
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

import { useCanvas, useHistory, usePage, useModal, useLayout } from '@opentiny/tiny-engine-controller'
import { iconChevronDown, iconSetting, iconPicture, iconError } from '@opentiny/vue-icon'
import { extend } from '@opentiny/vue-renderless/common/object'
import { useHttp } from '@opentiny/tiny-engine-http'
import { getBlockContent, initBlockList, AIModelOptions } from './js/robotSetting'
import DialogContent from './ContentDialog.vue'
import useSpeechRecognition from './js/useSpeechRecognition'
import TokenDialog from './TokenDialog.vue'
import { codeRules as importedCodeRules } from './js/codeRules'

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
    IconPicture: iconPicture(),
    IconSetting: iconSetting(),
    IconChevronDown: iconChevronDown(),
    IconError: iconError(),
    DialogContent,
    TokenDialog
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
    const inProcessing = ref(false)
    const selectedModel = ref(AIModelOptions[0])
    let currentModel = AIModelOptions[0]
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
                manufacturer: currentModel.manufacturer,
                model: currentModel.value,
                token: localStorage.getItem(currentModel.modelKey)
              },
              messages: [],
              displayMessages: [] // 专门用来进行展示的消息，非原始消息，仅作为展示但是不作为请求的发送
            })
      )
    }


    // eslint-disable-next-line no-unused-vars
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
      useLayout().layoutState.pageStatus = {
        state: useLayout().layoutState.pageStatus.state,
        data: {}
      }
      initData(pageSettingState.currentPageData['page_content'], pageSettingState.currentPageData)
      useHistory().addHistory()
    }


    // prompt
    const codeRules = ref(importedCodeRules)


    // 在每一次发送请求之前，都把引入区块的内容，给放到第一条消息中
    // 为了不污染存储在localstorage里的用户的原始消息，这里进行了简单的对象拷贝
    // 引入区块不存放在localstorage的原因：因为区块是可以变化的，用户可能在同一个会话中，对区块进行了删除和创建。那么存放的数据就不是即时数据了。
    const getSendSeesionProcess = () => {
      const sendProcess = { ...sessionProcess }
      const firstMessage = sendProcess.messages[0]
      firstMessage.content
      sendProcess.messages = [
        { ...firstMessage, content: `${getBlockContent()}\n${codeRules.value}\n${firstMessage.content}` },
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

    const tokenDialogVisible = ref(false)
    const sendRequest = () => {
      http
        .post('/app-center/api/ai/chat', getSendSeesionProcess(), { timeout: 600000 })
        .then((res) => {
          const { originalResponse, schema } = res

          const responseMessage = getAiRespMessage(originalResponse.role, originalResponse.content)
          const respDisplayMessage = getAiRespMessage(originalResponse.role, originalResponse.content)


          sessionProcess.messages.push(responseMessage)
          sessionProcess.displayMessages.push(respDisplayMessage)
          messages.value[messages.value.length - 1].content = originalResponse.content
          setContextSession()

          if (schema) {
            createNewPage(schema)
          }
          inProcessing.value = false
          connectedFailed.value = false
        })
        .catch(() => {
          // 若后续接入的 AI 的 token 有失效则需清除
          // localStorage.removeItem(currentModel.modelKey)
          // tokenDialogVisible.value = true

          messages.value[messages.value.length - 1].content = '连接失败'
          localStorage.removeItem('aiChat')
          inProcessing.value = false
          connectedFailed.value = false
        })
    }

    const getTokenDialogStatus = (value) => {
      tokenDialogVisible.value = value
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

    const setToken = () => {
      tokenDialogVisible.value = true
    }

    /*
      文件上传(仅支持图片，后续根据需求可添加上传类型）
     */
    const fileInput = ref(null)
    const openFilePicker = () => {
      if (unref(fileInput)) {
        unref(fileInput)?.click()
      }
    }

    const imageUrl = ref('')
    const imageContent = ref()
    const uploadFile = (file) => {
      const formData = new FormData()
      const foundationModelData = JSON.stringify({
        foundationModel: {
          manufacturer: currentModel.manufacturer,
          model: currentModel.value,
          token: localStorage.getItem(currentModel.modelKey)
        }
      })
      formData.append('foundationModel', foundationModelData)
      formData.append('file', file)
      http
        .post('/app-center/api/ai/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 600000
        })
        .then((res) => {
          imageContent.value = res.originalResponse
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => {
            imageUrl.value = reader.result
          }
        })
        .catch(() => {
          Notify({
            type: 'error',
            message: '上传图片失败',
            position: 'top-right',
            duration: 5000
          })
        })
    }

    const handleFileChange = (event) => {
      const files = event.target.files
      if (!files.length) {
        return
      }
      const file = files[0]
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!validImageTypes.includes(file.type)) {
        alert('请上传有效的图片文件（.jpeg, .png, .jpg）！')
        event.target.value = ''
        return
      }
      event.target.value = ''
      uploadFile(file)
    }

    const imageDeleting = ref(false)
    const handleDelete = () => {
      imageDeleting.value = true
      setTimeout(() => {
        imageUrl.value = ''
        imageContent.value = ''
        imageDeleting.value = false
        if (unref(fileInput)) {
          unref(fileInput).value = ''
        }
      }, 500)
    }

    const getMessage = (content, role) => ({
      role,
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
      if (inProcessing.value) {
        Notify({
          type: 'error',
          message: '请等待当前会话完成后再试!',
          position: 'top-right',
          duration: 5000
        })
        return
      }
      const realContent = String(content).trim()
      if (realContent) {
        if (chatWindowOpened.value === false) {
          await resizeChatWindow()
        }
        const message = getMessage(realContent, 'user')
        inProcessing.value = true
        messages.value.push(message)
        sessionProcess?.messages.push(message)
        sessionProcess?.displayMessages.push(message)
        if (imageContent.value) {
          messages.value.push(getMessage(imageUrl.value, 'system'))
          sessionProcess?.messages.push(getMessage(JSON.stringify(imageContent.value), 'system'))
          sessionProcess?.displayMessages.push(getMessage(imageUrl.value, 'system'))
        }
        if (!isModel) {
          inputContent.value = ''
          imageUrl.value = ''
          imageContent.value = ''
        }
        await scrollContent()
        await sleep(1000)
        messages.value.push({ role: 'assistant', content: '好的，正在执行相关操作，请稍等片刻...', name: 'AI' })
        await scrollContent()
        sendRequest()
      }
    }

    // 根据localstorage初始化AI大模型s
    const initCurrentModel = (aiSession) => {
      const currentModelValue = JSON.parse(aiSession)?.foundationModel?.model
      currentModel = AIModelOptions.find((item) => item.value === currentModelValue)
    }

    const initChat = () => {
      const aiChatSession = localStorage.getItem('aiChat')
      if (localStorage.getItem(currentModel.modelKey)) {
        if (!aiChatSession) {
          setContextSession()
        } else {
          initCurrentModel(aiChatSession) // 如果当前缓存有值，那么则需要根据缓存里的内容去初始化当前选择的模型
        }
      } else {
        tokenDialogVisible.value = true
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

    const updateTokenStatus = () => {
      initChat()
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
      if (currentModel.value !== model.value) {
        confirm({
          title: '切换AI大模型',
          message: '切换AI大模型将导致当前会话被清空，重新开启新会话，是否继续？',
          exec() {
            selectedModel.value = model
            currentModel = model
            endContent()
          }
        })
      }
    }
    watch(
      () => selectedModel.value.value,
      () => {
        currentModel = selectedModel.value
        if (!localStorage.getItem(currentModel.modelKey)) {
          tokenDialogVisible.value = true
        } else {
          tokenDialogVisible.value = false
        }
      }
    )

    const { startRecognition, stopRecognition, recognizedText } = useSpeechRecognition()
    const speechStatus = ref(false)
    const speechRecognition = () => {
      speechStatus.value = !speechStatus.value
      if (speechStatus.value) {
        startRecognition()
      } else {
        stopRecognition()
      }
    }

    watch([recognizedText], (newInputContent) => {
      inputContent.value = newInputContent
    })

    return {
      speechStatus,
      speechRecognition,
      avatarUrl,
      chatWindowOpened,
      activeMessages,
      inputContent,
      connectedFailed,
      sendContent,
      endContent,
      resizeChatWindow,
      setToken,
      openFilePicker,
      handleFileChange,
      imageDeleting,
      handleDelete,
      fileInput,
      imageUrl,
      AIModelOptions,
      selectedModel,
      currentModel,
      changeModel,
      tokenDialogVisible,
      getTokenDialogStatus,
      updateTokenStatus
    }
  }
}
</script>

<style lang="less" scope>
.common-svg {
  color: var(--ti-lowcode-chat-model-common-icon);
}
.chat-message-image {
  margin-right: 45px;
  margin-top: -10px;
  max-width: 100%;
  border-radius: 5px;

  .image {
    width: 100px;
    height: 100%;
    border-radius: 5px;
    border: 1px solid var(--ti-lowcode-chat-model-user-text-border);
  }
}

.preview-image {
  position: fixed;
  bottom: 5px;
  transform: translate(-50%, -50%);
  z-index: 1000;
  border-radius: 5px;
  max-width: 100%;
  height: auto;
  animation: slideDown 0.5s ease-out forwards;
  border: 1px solid var(--ti-lowcode-chat-model-user-text-border);
  .image {
    border-radius: 5px;
    width: 100px;
    height: 60px;
    display: block;
    position: relative;
    border: #1a1a1a;
  }
  .delete-image {
    color: red;
    position: absolute;
    top: -4px;
    right: -3px;
    cursor: pointer;
    z-index: 1001;
  }
}
.preview-image[data-animated='out'] {
  animation: slideUp 0.5s ease-out forwards;
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
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

  .arrow-down {
    margin-left: 5px;
  }

}
.tiny-dropdown .tiny-dropdown__trigger:not(.tiny-button) .tiny-svg {
  vertical-align: middle;
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

    .upload-image {
      margin-right: 7px;
    }
    .microphone {
      font-size: 18px;
    }

    .microphone-svg {
      color: var(--ti-lowcode-base-blue-6);
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
