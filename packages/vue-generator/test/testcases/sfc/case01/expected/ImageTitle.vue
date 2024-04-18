<template>
  <div>
    <div class="image-title" @click="handleClick">
      <img :src="src" />
      <span class="crm-title">{{ text }}</span>
      <span v-if="hasSplitLine" class="split"></span>
    </div>
  </div>
</template>

<script setup>
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({
  handleClick: {
    type: Function,
    default: function handleClick(event) {
      return event
    }
  },
  options: { type: Array, default: () => [] },
  src: {
    type: String,
    default: 'https://res-static.hc-cdn.cn/cloudbu-site/china/zh-cn/TinyLowCode/crm/img/bussiness/businessmanage.svg'
  },
  text: { type: String, default: '商务管理' },
  hasSplitLine: { type: Boolean, default: true }
})

const emit = defineEmits(['click-logo'])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({
  activeMethod: () => {
    return props.isEdit
  }
})
wrap({ state })

const handleClick = wrap(function () {
  this.emit('click-logo')
})

wrap({ handleClick })
</script>
<style scoped>
.image-title {
  margin-right: 15px;
  display: flex;
  align-items: center;
}
.crm-title {
  margin-left: 8px;
  font-family: PingFangSC-Regular;
  font-size: 22px;
  color: #333333;
  line-height: 30px;
}
.split {
  align-self: center;
  width: 1px;
  height: 20px;
  background-color: #dddee4;
  margin-left: 20px;
}
</style>
