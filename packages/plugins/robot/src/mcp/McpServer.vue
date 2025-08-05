<template>
  <div :class="['button-wrapper', activeCount > 0 ? 'active' : '']" @click="handleVisibleToggle">
    <div class="button">
      <icon-plugin class="plugin-common_icon" />
      <span class="plugin-common_text">MCP</span>
      <span class="plugin-active_count" v-if="activeCount">{{ activeCount }}</span>
    </div>
  </div>
  <mcp-server-picker
    :popup-config="drawerConfig"
    v-model:visible="visible"
    v-model:activeCount="activeCount"
    :installed-plugins="installedPlugins"
    :market-plugins="marketPlugins"
    :market-category-options="[]"
    :loading="loading"
    :market-loading="marketLoading"
    @plugin-expand="handlePluginExpand"
    @plugin-add="updateMcpServerStatus"
    @plugin-toggle="handlePluginToggle"
    @tool-toggle="updateMcpServerToolStatus"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { McpServerPicker, type PluginInfo, type PopupConfig } from '@opentiny/tiny-robot'
import { IconPlugin } from '@opentiny/tiny-robot-svgs'
import useMcpServer from './useMcp'

const loading = ref(false)
const marketLoading = ref(false)

const activeCount = ref(0)

const drawerConfig: PopupConfig = {
  type: 'fixed',
  position: { top: 'var(--base-top-panel-height)', bottom: 0, right: 'var(--tr-container-width)' }
}

const {
  inUseMcpServers: installedPlugins,
  mcpServers: marketPlugins,
  refreshMcpServerTools,
  updateMcpServerToolStatus,
  updateMcpServerStatus
} = useMcpServer()

// 插件状态切换
const handlePluginToggle = (plugin: PluginInfo, enabled: boolean) => {
  plugin.enabled = enabled
}

// 插件展开状态变化
const handlePluginExpand = (plugin: PluginInfo, expanded: boolean) => {
  const targetPlugin = installedPlugins.value.find((p) => p.id === plugin.id)
  if (targetPlugin) {
    targetPlugin.expanded = expanded
  }
}

const visible = ref(false)

const handleVisibleToggle = () => {
  visible.value = !visible.value
  if (visible.value) {
    refreshMcpServerTools()
  }
}

onMounted(() => {
  refreshMcpServerTools()
})
</script>

<style lang="less" scoped>
:deep(.mcp-server-picker__header) {
  .mcp-server-picker__header-right-item {
    display: none !important;
  }
}

:deep(.mcp-server-picker__content) {
  .tiny-tabs.tiny-tabs .tiny-tabs__header .tiny-tabs__nav {
    background-color: unset;
  }
  .tiny-tabs.tiny-tabs .tiny-tabs__header .tiny-tabs__item {
    border: none;
    background-color: unset;
  }
}

:deep(.tiny-tabs__content) {
  .plugin-card__add-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.button-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 28px;
  border: 1px solid rgb(194, 194, 194);
  border-radius: 999px;
  cursor: pointer;
  box-sizing: border-box;

  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }

  &.active {
    border: 1px solid rgb(20, 118, 255);
    background: rgba(20, 118, 255, 0.08);
    color: rgb(20, 118, 255);

    &:hover {
      background: rgba(20, 118, 255, 0.12);
    }
  }

  .text {
    width: 56px;
    height: 22px;
    line-height: 22px;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
  }

  .button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .plugin-common {
    &_text {
      font-size: 12px;
      font-weight: 400;
      line-height: 20px;
      letter-spacing: 0;
      text-align: left;
    }

    &_icon {
      font-size: 16px;
    }
  }

  .plugin-active {
    &_count {
      width: 12px;
      height: 12px;
      background: #1476ff;
      border-radius: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 9px;
      font-weight: 500;
      line-height: 12px;
      color: #fff;
    }

    &:hover {
      color: #1476ff;
      background-color: #eaf0f8;
      border: 1px solid #1476ff;
    }
  }
}
</style>
