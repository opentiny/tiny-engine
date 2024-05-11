<template>
  <div class="input-or-output">
    <tiny-alert
      type="info"
      description="输入配置: 传递给页面的参数(类似组件的输入属性);输出配置: 页面传递出的事件(类似组件触发的输出事件)"
      :closable="false"
      class="life-cycle-alert"
    ></tiny-alert>
    <tiny-form label-position="left" class="input-output-form">
      <tiny-form-item label="输入配置" class="item-wrap">
        <meta-code-editor
          :modelValue="inputValue"
          title="输入配置"
          button-text="输入配置"
          language="json"
          :buttonShowContent="hasContent(inputValue)"
          single
          @save="saveInputValue"
        ></meta-code-editor>
      </tiny-form-item>
      <tiny-form-item label="输出配置" class="item-wrap">
        <meta-code-editor
          :modelValue="outputValue"
          title="输出配置"
          button-text="输出配置"
          language="json"
          :buttonShowContent="hasContent(outputValue)"
          single
          @save="saveOutputValue"
        ></meta-code-editor>
      </tiny-form-item>
      <tiny-form-item label="根元素设置" class="page-root-form-item">
        <tiny-switch v-model="pageSettingState.currentPageData.isBody"></tiny-switch>
        <p class="page-root-tips">设置根元素为Body，默认为div</p>
      </tiny-form-item>
    </tiny-form>
  </div>
</template>

<script>
import { ref, watchEffect, computed } from 'vue'
import { Form, FormItem, Switch, Alert } from '@opentiny/vue'
import { MetaCodeEditor } from '@opentiny/tiny-engine-common'
import { usePage, useNotify } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    MetaCodeEditor,
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinySwitch: Switch,
    TinyAlert: Alert
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
  margin-top: -20px;
  padding: 20px;
  .life-cycle-alert {
    color: var(--ti-lowcode-life-cycle-alert-color);
  }
  .buttons {
    display: flex;
    li {
      display: flex;
      align-items: center;
      flex: 1;

      span {
        margin-right: 10px;
      }
    }
  }
  .input-output-form {
    margin-top: 16px;
    margin-left: 28px;
    .item-wrap {
      width: 348px;
    }
    :deep(.tiny-form-item) {
      .tiny-form-item__label {
        font-size: 14px;
        color: var(--ti-lowcode-page-manage-text-color);
      }
    }
  }
  .page-root-form-item {
    margin-bottom: -10px;
    :deep(.tiny-form-item__content) {
      display: flex;
      .tiny-switch {
        margin-top: 5px;
      }
    }
    .page-root-tips {
      margin: 0;
      margin-left: 8px;
      font-size: 14px;
      color: var(--ti-lowcode-page-manage-content-tips-color);
    }
  }
}
</style>
