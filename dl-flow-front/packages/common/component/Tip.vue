<template>
  <p class="tips">{{ props.desc }}</p>
</template>

<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  desc: String
})
</script>

<style scoped lang="less">
.tips {
  color: var(--ti-lowcode-common-text-color-5);
  font-size: 12px;
  margin: 0;
  text-align: center;
  margin-top: 50px;
}
</style>
