<template>
  <plugin-panel :title="shortcut ? '' : title" @close="$emit('close')">
    <template #header>
      <component :is="pluginComponents.pluginHeader" :fixedPanels="fixedPanels"></component>
    </template>
    <template #content>
      <component :is="pluginComponents.pluginContent"></component>
    </template>
  </plugin-panel>
</template>

<script>
import { reactive, provide, ref } from 'vue'
import { PluginPanel } from '@opentiny/tiny-engine-common'
import { getMergeMeta } from '@opentiny/tiny-engine-entry'

export default {
  components: {
    PluginPanel
  },

  props: {
    shortcut: [Boolean, String],
    fixedPanels: {
      type: Array
    },
    metaData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'fix-panel'],
  setup(props, { emit }) {
    const panelState = reactive({
      isShortcutPanel: props.shortcut,
      isBlockGroupPanel: false,
      isBlockList: false,
      emitEvent: emit
    })
    provide('panelState', panelState) // 使用provide传给子组件,后续可能会有调整，先暂定

    const headerMeta = getMergeMeta(props.metaData.options?.layoutCompoentIdMap?.header)
    const contentMeta = getMergeMeta(props.metaData.options?.layoutCompoentIdMap?.content)
    const pluginComponents = reactive({
      pluginHeader: headerMeta.component,
      pluginContent: contentMeta?.component
    })
    const title = ref(props.metaData?.title)

    return {
      pluginComponents,
      title
    }
  }
}
</script>
