<template>
  <p v-if="_visible" class="empty">{{ desc }}</p>
</template>

<script setup>
import { defineProps, toRefs, ref, onMounted } from 'vue'
import { useX6 } from '@opentiny/tiny-engine-controller'

const EMPTY_COMPONENT = '画布中没有相应网络'
const EMPTY_SELECTION = '请在画布中选择网络'

const props = defineProps({
  visible: Boolean
})
const { visible } = toRefs(props)
const _visible = ref(visible.value)
const desc = ref('')

onMounted(() => {
  const { g } = useX6()
  desc.value = g.getCellCount() === 0 ? EMPTY_COMPONENT : EMPTY_SELECTION
  g.on('selection:changed', () => {
    _visible.value = !g.getSelectedCellCount()
  })
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
