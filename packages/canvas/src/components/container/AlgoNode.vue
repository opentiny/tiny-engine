<template>
  <div
    :class="{
      node: true,
      fail: fail
    }"
    ref="wrapper"
  >
    <span>{{ label }}</span>
  </div>
</template>

<script setup>
import { inject, ref, onMounted, watch } from 'vue'
import { _default } from '@opentiny/tiny-engine-common/js/utils'
/**
 * @type {()=>void}
 */
const getNode = inject('getNode')
/**
 * @type {import('@antv/x6').Node}
 */
const node = getNode()
/**
 * @type {{ label: string, fail: boolean }}
 */
const { label: _label, fail: _fail } = _default(node.getData(), { label: '', fail: false })
const label = ref(_label)
const fail = ref(_fail)
/**
 * @type {HTMLElement}
 */
const wrapper = ref(null)
node.on('change:data', ({ current }) => {
  if (current.label !== label.value) {
    label.value = current.label
  }
  if (current.fail !== fail.value) {
    fail.value = current.fail
  }
})
onMounted(() => {
  watch(
    label,
    () => {
      node.resize(wrapper.value.clientWidth, wrapper.value.clientHeight)
    },
    { immediate: true }
  )
})
</script>

<style scoped>
.node {
  width: fit-content;
  min-width: 114px;
  display: flex;
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 5px 1px rgba(0, 0, 0, 0.06);
  justify-content: center;
  align-items: center;
  background: #fff;
  border-left: 4px solid #5f95ff;
}
.node > span {
  color: #666;
  font-size: 12px;
}
.node.fail {
  border-left: 4px solid #ff4d4f;
}
</style>
