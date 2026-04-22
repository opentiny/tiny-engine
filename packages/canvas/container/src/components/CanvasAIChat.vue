<template>
  <div>
    <TrSender
      v-model="content"
      mode="multiple"
      placeholder="请输入问题或“/”获取提示词"
      clearable
      show-word-limit
      :max-length="5000"
      @submit="handleSubmit"
    >
      <template #prefix>
        <svg-icon name="AI"></svg-icon>
      </template>
    </TrSender>
  </div>
</template>

<script>
import { ref } from 'vue'
import {
  useMaterial,
  useProperties,
  useCanvas,
  useProperty,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { TrSender } from '@opentiny/tiny-robot'
import { utils } from '@opentiny/tiny-engine-utils'
import { search, fetchAssets } from '../services/agentServices'
import { getCurrent } from '../container'


export default {
  components: {
    TrSender
  },

  emits: ['complete', 'close'],

  setup(props, { emit }) {
    const { deepClone } = utils
    const content = ref('')
    const { getRobotServiceOptions, formatComponents, getAgentSystemPrompt, getJsonFixPrompt, getSelectedModelInfo } =
      getMetaApi('engine.service.robot')

    const handleSubmit = async (value) => {
      const currentSchema = getCurrent().schema
      const modelInfo = getSelectedModelInfo()
      let referenceContext = ''
      let imageAssets = []

      // if (getRobotServiceOptions()?.enableRagContext) {
      //   referenceContext = await search(requestParams.messages?.at(-1)?.content)
      // }
      // if (getRobotServiceOptions()?.enableResourceContext) {
      //   const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
      //   imageAssets = await fetchAssets(appId)
      // }
      const { materialState, getComponentDetail } = useMaterial()
      const components = formatComponents(materialState.components, getComponentDetail)
      const messages = [
        { role: 'system', content: getAgentSystemPrompt(components, currentSchema, referenceContext, imageAssets) },
        { role: 'user', content: [{ type: 'text', text: value }] }
      ]
      const requestParams = {
        model: modelInfo.model,
        // stream: true,
        messages
      }

      // const getApiUrl = () => 'app-center/api/ai/chat'
      const apiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

      emit('complete', {
        method: 'post',
        url: apiUrl,
        data: requestParams,
        headers: {
          Authorization: `Bearer ${modelInfo.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      content.value = ''
    }

    const handleClose = () => {
      emit('close')
    }

    // 这些变量可能会在后续开发中使用，暂时保留但重命名以避免ESLint错误
    const { getMaterial: _getMaterial } = useMaterial()
    const { pageState: _pageState } = useCanvas()
    const { properties: _properties } = useProperty().getProperty({ pageState: _pageState })
    const _schema = useProperties().getSchema()

    return {
      content,
      handleSubmit,
      handleClose
    }
  }
}
</script>

<style lang="less" scoped>
:deep(.tiny-sender) {
  .tiny-sender__prefix-slot .svg-icon {
    width: 24px;
    height: 24px;
  }
  .tiny-sender__word-limit,
  .tiny-sender__input-field-wrapper .tiny-textarea__inner {
    font-size: 14px !important;
  }
  .action-buttons__icon--send,
  .action-buttons__button svg {
    font-size: 24px !important;
  }
  .action-buttons {
    gap: 6px;
  }
  .action-buttons__utility {
    gap: 0;
  }
}
</style>
