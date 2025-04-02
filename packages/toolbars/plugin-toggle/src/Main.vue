<template>
  <div class="toolbar-plugin-toggle">
    <ToolbarBase content="插件显示隐藏" :icon="options.icon.default || options.icon" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { ToolbarBase } from '@opentiny/tiny-engine-common'

defineProps({
  options: {
    type: Object,
    default: () => ({})
  }
})
</script>
<style lang="less" scoped></style>
