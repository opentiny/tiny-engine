<template>
  <div class="block-error-container">区块 {{ name }} 加载错误</div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  name: {
    type: String,
    default: ''
  }
})
</script>

<style lang="less" scoped>
.block-error-container {
  // 画布内不能使用 css 变量
  background-color: #f23030;
  padding: 10px;
}
</style>
