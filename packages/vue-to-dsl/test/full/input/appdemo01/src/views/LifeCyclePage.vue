<template>
  <div class="lifecycle-container">
    <div title="仪表板">
      <div class="metrics-grid">
        <div class="metric-item">
          <span>{{ '活跃用户: ' + state.activeUsers }}</span>
        </div>
        <div class="metric-item">
          <span>{{ '系统负载: ' + state.systemLoad + '%' }}</span>
        </div>
      </div>
      <tiny-button type="success" @click="refreshData">刷新数据</tiny-button>
    </div>
  </div>
</template>

<script setup>
import { Button as TinyButton } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({})
wrap({ state })

const handleClick = wrap(function handleClick() {
  console.log('Button clicked')
})

wrap({ handleClick })

vue.onMounted(
  wrap(function onMounted() {
    console.log('Component mounted')
  })
)
vue.onUnmounted(
  wrap(function onUnmounted() {
    console.log('Component unmounted')
  })
)
vue.onUpdated(
  wrap(function onUpdated() {
    console.log('Component updated')
  })
)
vue.onBeforeMount(
  wrap(function onBeforeMount() {
    console.log('Before mount')
  })
)
</script>
<style scoped></style>
