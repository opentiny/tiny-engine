<template>
  <SchemaRenderer :key="props.pageId" :pageId="props.pageId" />
</template>

<script setup lang="ts">
import SchemaRenderer from '../renderer/RenderMain'
// 传递pageId而不是schema，避免出现嵌套的子组件无法正确接收schema的问题
const props = defineProps<{ pageId: number }>()
</script>
