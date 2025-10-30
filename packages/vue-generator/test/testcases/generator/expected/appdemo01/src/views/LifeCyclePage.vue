<template>
  <div class="lifecycle-container">
    <tiny-card title="仪表板">
      <div class="metrics-grid">
        <div class="metric-item">
          <span>{{ '活跃用户: ' + state.activeUsers }}</span>
        </div>
        <div class="metric-item">
          <span>{{ '系统负载: ' + state.systemLoad + '%' }}</span>
        </div>
      </div>
      <tiny-button type="success" @click="refreshData">刷新数据</tiny-button></tiny-card
    >
  </div>
</template>

<script setup>
import { Button as TinyButton, Card as TinyCard } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ activeUsers: 0, systemLoad: 0, lastUpdateTime: null, autoRefresh: true })
wrap({ state })

const refreshData = wrap(function refreshData() {
  this.fetchMetrics()
  this.state.lastUpdateTime = new Date()
})
const fetchMetrics = wrap(function fetchMetrics() {
  this.state.activeUsers = Math.floor(Math.random() * 1000)
  this.state.systemLoad = Math.floor(Math.random() * 100)
})
const startAutoRefresh = wrap(function startAutoRefresh() {
  if (this.autoRefresh) {
    this.refreshInterval = setInterval(() => this.refreshData(), 30000)
  }
})
const stopAutoRefresh = wrap(function stopAutoRefresh() {
  if (this.refreshInterval) {
    clearInterval(this.refreshInterval)
    this.refreshInterval = null
  }
})
const handleVisibilityChange = wrap(function handleVisibilityChange() {
  if (document.hidden) {
    this.stopAutoRefresh()
  } else {
    this.startAutoRefresh()
  }
})

wrap({ refreshData, fetchMetrics, startAutoRefresh, stopAutoRefresh, handleVisibilityChange })

vue.onMounted(
  wrap(function onMounted() {
    console.log('onMounted.')
    refreshData()
    startAutoRefresh()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })
)
vue.onUnmounted(
  wrap(function onUnmounted() {
    console.log('onUnmounted.')
    stopAutoRefresh()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
)
vue.onActivated(
  wrap(function onActivated() {
    console.log('页面激活')
    refreshData()
  })
)
vue.onDeactivated(
  wrap(function onDeactivated() {
    console.log('页面停用')
    stopAutoRefresh()
  })
)
vue.onUpdated(
  wrap(function onUpdated() {
    console.log('页面已更新', this.state.loginCount)
  })
)
vue.onBeforeMount(
  wrap(function onBeforeMount() {
    console.log('onBeforeMount.')
  })
)
</script>
<style scoped></style>
