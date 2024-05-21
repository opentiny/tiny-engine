<template>
  <tiny-form label-position="left" label-width="60px" show-message :model="formData" :rules="rules">
    <tiny-form-item label="事件名" prop="eventName">
      <tiny-input v-model="formData.eventName" :placeholder="eventNameTip" @blur="changeEventName"></tiny-input>
    </tiny-form-item>
    <tiny-form-item label="标签名">
      <tiny-input v-model="label"></tiny-input>
    </tiny-form-item>
    <tiny-form-item label="描述">
      <tiny-input v-model="description"></tiny-input>
    </tiny-form-item>
    <div v-if="linked" class="linked-info">链接到组件: {{ linked.componentName }} 事件: {{ linked.event }}</div>
  </tiny-form>
</template>

<script>
import { computed, reactive, watch } from 'vue'
import { Input as TinyInput, Form as TinyForm, FormItem as TinyFormItem } from '@opentiny/vue'
import { REGEXP_EVENT_NAME, verifyEventName } from '@opentiny/tiny-engine-controller/js/verification'
import { getEditEvent, getEditEventName, renameBlockEventName } from './js/blockSetting'

export default {
  components: {
    TinyForm,
    TinyInput,
    TinyFormItem
  },
  setup() {
    const eventNameTip = '事件名为小写字符开头的驼峰形式，例：customEvent'
    const linked = computed(() => (getEditEvent() || {}).linked)

    const label = computed({
      get: () => getEditEvent()?.label?.zh_CN || '',
      set(value) {
        const event = getEditEvent()

        if (event && event.label) {
          event.label.zh_CN = value
        }
      }
    })

    const description = computed({
      get: () => getEditEvent()?.description?.zh_CN || '',
      set(value) {
        const event = getEditEvent()

        if (event && event.description) {
          event.description.zh_CN = value
        }
      }
    })

    const formData = reactive({
      eventName: getEditEventName() || ''
    })

    const rules = {
      eventName: [{ pattern: REGEXP_EVENT_NAME, message: eventNameTip, trigger: 'change' }]
    }

    watch(
      () => getEditEventName(),
      () => {
        formData.eventName = getEditEventName() || ''
      }
    )

    const changeEventName = () => {
      if (formData.eventName !== getEditEventName() && verifyEventName(formData.eventName)) {
        renameBlockEventName(formData.eventName, getEditEventName())
      }
    }

    return {
      rules,
      label,
      linked,
      formData,
      description,
      eventNameTip,
      changeEventName
    }
  }
}
</script>

<style lang="less" scoped>
.linked-info {
  margin-top: 10px;
  padding: 15px 0px;
  border-top: 1px solid var(--ti-lowcode-tabs-border-color);
}
</style>
