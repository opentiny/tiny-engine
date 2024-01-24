<template>
  <p class="empty">{{ desc }}</p>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useX6 } from '@opentiny/tiny-engine-controller'

const EMPTY_COMPONENT = '画布中没有相应网络'
const EMPTY_SELECTION = '请在画布中选择网络'
const desc = ref('')

onMounted(() => {
  const { g } = useX6()
  desc.value = g.getCellCount() === 0 ? EMPTY_COMPONENT : EMPTY_SELECTION
})
</script>

<style scoped lang="less">
.empty {
  color: var(--ti-lowcode-common-text-color-5);
  text-align: center;
  margin-top: 50px;
  font-size: 12px;
}
</style>
