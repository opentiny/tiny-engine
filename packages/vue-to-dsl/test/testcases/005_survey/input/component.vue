<template>
  <div class="page-base-style">
    <tiny-form labelWidth="100px" class="component-base-style">
      <tiny-form-item label="姓名">
        <tiny-input placeholder="请输入姓名" class="component-base-style" v-model="state.name"></tiny-input
      ></tiny-form-item>
      <tiny-form-item label="整体满意度">
        <div style="display: flex; flex-wrap: wrap; gap: 12px">
          <tiny-radio text="非常满意" :label="5" v-model="state.satisfaction"></tiny-radio>
          <tiny-radio text="满意" :label="4" v-model="state.satisfaction"></tiny-radio>
          <tiny-radio text="一般" :label="3" v-model="state.satisfaction"></tiny-radio>
          <tiny-radio text="不满意" :label="2" v-model="state.satisfaction"></tiny-radio>
          <tiny-radio text="非常不满意" :label="1" v-model="state.satisfaction"></tiny-radio>
        </div>
      </tiny-form-item>
      <tiny-form-item label="具体意见">
        <tiny-input
          type="textarea"
          placeholder="请提出宝贵意见"
          class="component-base-style"
          v-model="state.feedback"
        ></tiny-input
      ></tiny-form-item>
      <tiny-form-item label="是否愿意推荐"> <tiny-switch v-model="state.recommend"></tiny-switch></tiny-form-item>
      <tiny-form-item label="">
        <tiny-button
          text="提交"
          type="primary"
          class="component-base-style"
          @click="submitSurvey"
        ></tiny-button></tiny-form-item
    ></tiny-form>
  </div>
</template>

<script setup>
import {
  Form as TinyForm,
  FormItem as TinyFormItem,
  Button as TinyButton,
  Input as TinyInput,
  Radio as TinyRadio,
  Switch as TinySwitch
} from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ name: '', satisfaction: 3, feedback: '', recommend: true })
wrap({ state })

const submitSurvey = wrap(function submitSurvey() {
  console.log('提交满意度调查：', {
    name: this.state.name,
    satisfaction: this.state.satisfaction,
    feedback: this.state.feedback,
    recommend: this.state.recommend
  })
  // 这里可以添加提交到服务器的逻辑
  alert('感谢您的反馈！')
})

wrap({ submitSurvey })
</script>
<style scoped>
.page-base-style {
  padding: 24px;
  background: #ffffff;
}

.block-base-style {
  margin: 16px;
}

.component-base-style {
  margin: 8px;
}
</style>
