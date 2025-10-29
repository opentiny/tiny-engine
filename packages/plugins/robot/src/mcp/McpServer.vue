<template>
  <div :class="['button-wrapper', activeCount > 0 ? 'active' : '']" @click="handleVisibleToggle">
    <div class="button">
      <icon-plugin class="plugin-common_icon" />
    </div>
  </div>
  <div class="robot-mcp-server-picker">
    <mcp-server-picker
      :popup-config="props.position"
      v-model:visible="visible"
      v-model:activeCount="activeCount"
      :installed-plugins="installedPlugins"
      :market-plugins="marketPlugins"
      :show-market-tab="false"
      @plugin-expand="handlePluginExpand"
      @plugin-add="updateMcpServerStatus"
      @plugin-toggle="handlePluginToggle"
      @tool-toggle="updateMcpServerToolStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { McpServerPicker, type PluginInfo, type PopupConfig } from '@opentiny/tiny-robot'
import { IconPlugin } from '@opentiny/tiny-robot-svgs'
import useMcpServer from './useMcp'

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

.button-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgb(194, 194, 194);
  border-radius: 999px;
  cursor: pointer;
  box-sizing: border-box;
  background-color: var(--te-common-bg-container);

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
