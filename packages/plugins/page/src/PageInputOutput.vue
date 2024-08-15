<template>
  <div class="input-or-output">
    <tiny-alert type="simple" description="了解有关输入输出设置的更多信息" class="life-cycle-alert"></tiny-alert>
    <meta-code-editor
      :modelValue="inputValue"
      title="输入配置"
      button-text="输入配置"
      language="json"
      :buttonShowContent="hasContent(inputValue)"
      single
      @save="saveInputValue"
    ></meta-code-editor>
    <div class="input-output-tips">传递给页面的参数(类似组件的输入属性)</div>
    <meta-code-editor
      :modelValue="outputValue"
      title="输出配置"
      button-text="输出配置"
      language="json"
      :buttonShowContent="hasContent(outputValue)"
      single
      @save="saveOutputValue"
    ></meta-code-editor>
    <div class="input-output-div">页面传递出的事件(类似组件触发的输出事件)</div>

    <tiny-checkbox class="selectHome" v-model="pageSettingState.currentPageData.isBody"
      ><span>设为根元素为Body</span>
    </tiny-checkbox>
    <p class="input-output-div">默认为div</p>
  </div>
</template>

<script>
import { ref, watchEffect, computed } from 'vue'
import { Alert, Checkbox } from '@opentiny/vue'
import { MetaCodeEditor } from '@opentiny/tiny-engine-common'
import { usePage, useNotify } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    MetaCodeEditor,
    TinyAlert: Alert,
    TinyCheckbox: Checkbox
  },
  setup() {
    const inputValue = ref('')
    const outputValue = ref('')
    const { pageSettingState } = usePage()
    const currentPageData = computed(() => pageSettingState.currentPageData)
    watchEffect(() => {
      inputValue.value = pageSettingState.currentPageData['page_content']?.inputs || ''
      outputValue.value = pageSettingState.currentPageData['page_content']?.outputs || ''
    })

    const saveInputValue = (data) => {
      try {
        const inputsData = JSON.parse(data.content)
        inputValue.value = data.content
        currentPageData.value['page_content'].inputs = inputsData
      } catch (err) {
        useNotify({
          title: '输入配置保存失败（必须符合JSON格式）',
          message: `${err?.message || err}`,
          type: 'error'
        })
      }
    }
    const saveOutputValue = (data) => {
      try {
        const outputsData = JSON.parse(data.content)
        outputValue.value = data.content
        currentPageData.value['page_content'].outputs = outputsData
      } catch (err) {
        useNotify({
          title: '输出配置保存失败（必须符合JSON格式）',
          message: `${err?.message || err}`,
          type: 'error'
        })
      }
    }

    const hasContent = (value) =>
      (Array.isArray(value) && value.length > 0) || (typeof value === 'object' && Object.keys(value).length > 0)

    return {
      inputValue,
      outputValue,
      saveInputValue,
      saveOutputValue,
      pageSettingState,
      hasContent
    }
  }
}
</script>

<style lang="less" scoped>
.input-or-output {
  color: var(--ti-lowcode-page-manage-icon-text-color);
  padding: 12px;
  margin-top: -8px;
  .life-cycle-alert {
    color: var(--ti-lowcode-life-cycle-alert-color);
    height: 28px;
    padding: 6px;
    border: 0;
    font-size: 11px;
    margin-bottom: 12px;
    :deep(.tiny-alert__close) {
      top: 7px;
    }
  }

  .input-output-tips,
  .input-output-div {
    color: var(--ti-lowcode-life-cycle-alert-color);
    margin-top: 4px;
    height: 16px;
    line-height: 16px;
  }
  .input-output-tips {
    margin-bottom: 12px;
  }
}
</style>
