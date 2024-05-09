<template>
  <p class="empty__text">{{ props.desc }}</p>
</template>

<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  desc: String
})
</script>

<style scoped lang="less">
.empty__text {
  color: var(--ti-lowcode-common-text-color-5);
  font-size: 12px;
  margin: 0;
}
</style>
