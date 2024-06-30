<template>
  <plugin-panel title="自定义插件">
    <template #header>
      <span>自定义头部</span>
    </template>
    <template #content>
      <div class="content">
        <h1>hello-world 我是自定义的 plugin</h1>
        <p>这里可以自定义UI&功能</p>
      </div>
    </template>
  </plugin-panel>
</template>

<script setup>
import { PluginPanel } from '@opentiny/tiny-engine'
</script>

<style lang="less" scoped>
.content {
  padding: 12px;
}
</style>
