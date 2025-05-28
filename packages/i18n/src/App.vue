<template>
  <form>
    <label for="locale-select">select language: </label>
    <select id="locale-select" v-model="locale">
      <option value="en_US">en_US</option>
      <option value="zh_CN">zh_CN</option>
    </select>
  </form>
  <div>
    <TestVueUse></TestVueUse>
    <TestVueInject></TestVueInject>
  </div>
</template>

<script>
import { ref, provide, watch } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import TestVueUse from './test/TestVueUse.vue'
import TestVueInject from './test/TestVueInject.vue'
import i18n from './lib'

export default {
  components: {
    TestVueUse,
    TestVueInject
  },
  setup() {
    const locale = ref('zh_CN')

    // 通过 provide ，可以让该组件树结构下的 vue 组件通过 inject(I18nInjectionKey)，获取 i18n 对象
    provide(I18nInjectionKey, i18n)

    watch(
      locale,
      (newVal) => {
        i18n.global.locale.value = newVal
      },
      { immediate: true }
    )

    return {
      locale
    }
  }
}
</script>
