<template>
  <div>
    <footer-button :active="activeCount > 0" tooltip-content="MCP工具" @update:active="handleVisibleToggle">
      <template #icon>
        <IconPlugin class="plugin-common_icon" />
      </template>
      <template #text> MCP工具 </template>
    </footer-button>
    <div class="robot-mcp-server-picker">
      <mcp-server-picker
        title="扩展"
        installedTabTitle="已添加的MCP服务"
        :popup-config="props.position"
        v-model:visible="visible"
        v-model:activeCount="activeCount"
        :installed-plugins="installedPlugins"
        :show-market-tab="false"
        @plugin-expand="handlePluginExpand"
        @plugin-add="updateMcpServerStatus"
        @plugin-toggle="updateMcpServerToggle"
        @tool-toggle="updateMcpServerToolStatus"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { McpServerPicker, type PluginInfo, type PopupConfig } from '@opentiny/tiny-robot'
import { IconPlugin } from '@opentiny/tiny-robot-svgs'
import useMcpServer from '../../composables/features/useMcp'
import FooterButton from '../chat/FooterButton.vue'

const activeCount = ref(1)

const props = withDefaults(
  defineProps<{
    position: PopupConfig
  }>(),
  {
    type: 'fixed',
    position: {
      top: 'var(--base-top-panel-height)',
      bottom: 0,
      right: 'var(--tr-container-width)'
    }
  }
)

const {
  inUseMcpServers: installedPlugins,
  refreshMcpServerTools,
  updateMcpServerToolStatus,
  updateMcpServerStatus,
  updateMcpServerToggle
} = useMcpServer()

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
.robot-mcp-server-picker {
  :deep(.mcp-server-picker.popup-type-fixed) {
    border-radius: 0px;
  }
}

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
  .tiny-tabs.tiny-tabs .tiny-tabs__header .tiny-tabs__nav {
    width: 160px;
  }
  .tiny-tabs__content {
    .plugin-card__operations {
      .tiny-popconfirm {
        display: none;
      }
    }
    .plugin-card__add-button {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .plugin-card__name {
      text-align: left;
    }
    .plugin-card__desc {
      font-size: 12px;
    }
  }
}
</style>
