<template>
  <form>
    <label for="locale-select">select language: </label>
    <select id="locale-select" v-model="locale">
      <option value="en_US">en_US</option>
      <option value="zh_CN">zh_CN</option>
    </select>
  </form>
  <tiny-i18n-host id="i18nHost" :locale="locale">
    <test-webcomponent></test-webcomponent>
    <TestVueUse></TestVueUse>
    <TestVueInject></TestVueInject>
  </tiny-i18n-host>
</template>

<script>
import { ref, provide } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import { defineCustomElement } from '@opentiny/tiny-engine-webcomponent-core'
import TestVueUse from './test/TestVueUse.vue'
import TestVueInject from './test/TestVueInject.vue'
import TestWebcomponent from './test/TestWebcomponent.vue'
import i18n from './i18n'

// 定义 webcomponent
customElements.define('test-webcomponent', defineCustomElement(TestWebcomponent))

export default {
  components: {
    TestVueUse,
    TestVueInject
  },
  setup() {
    const locale = ref('en_US')

    // 通过 provide ，可以让该组件树结构下的 vue 组件通过 inject(I18nInjectionKey)，获取 i18n 对象
    provide(I18nInjectionKey, i18n)

    return {
      locale
    }
  }
}
</script>
