<template>
  <plugin-panel :title="shortcut ? '' : title" @close="$emit('close')">
    <template #header>
      <component
        :is="registryData?.components?.header"
        :fixedPanels="fixedPanels"
        @fix-panel="(id) => $emit('fix-panel', id)"
      ></component>
    </template>
    <template #content>
      <tiny-tabs v-model="activeName" tab-style="button-card" class="full-width-tabs" v-if="!onlyShowDefault">
        <tiny-tab-item :key="item.id" v-for="item in tabComponents" :title="item.title" :name="item.id">
          <component :is="item.component" :activeTabName="activeName" :rightPanelRef="rightPanelRef"></component>
        </tiny-tab-item>
      </tiny-tabs>
      <component :is="defaultComponent" v-if="onlyShowDefault"></component>
      <div class="material-right-panel" ref="rightPanelRef"></div>
    </template>
  </plugin-panel>
</template>

<script>
import { reactive, provide, ref } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { PluginPanel } from '@opentiny/tiny-engine-common'

export default {
  components: {
    PluginPanel,
    TinyTabs: Tabs,
    TinyTabItem: TabItem
  },

  props: {
    shortcut: [Boolean, String],
    fixedPanels: {
      type: Array
    },
    registryData: {
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

    const rightPanelRef = ref(null)
    const displayComponentIds = props.registryData?.options?.displayComponentIds || []
    const onlyShowDefault = ref(displayComponentIds.length === 1)
    const activeTabId =
      displayComponentIds.find((item) => item === props.registryData?.options?.defaultTabId) || displayComponentIds[0]

    const activeName = ref(activeTabId)
    const defaultComponent = getMergeMeta(activeName.value)?.entry
    const tabComponents = displayComponentIds.map((id) => {
      const itemMeta = getMergeMeta(id)
      return {
        id,
        component: itemMeta?.entry,
        title: itemMeta?.options?.title || itemMeta?.id
      }
    })

    const title = ref(props.registryData?.title)

    return {
      title,
      activeName,
      defaultComponent,
      onlyShowDefault,
      tabComponents,
      rightPanelRef
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-tabs {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

:deep(.tiny-tabs__header) {
  padding: 0 12px;
}

:deep(.tiny-tabs__content) {
  flex: 1;
  padding: 0;
  margin: 0px;
  & > div {
    height: 100%;
  }
}

:deep(.tiny-tabs__item:first-child) {
  border-top-left-radius: var(--te-base-border-radius-1);
  border-bottom-left-radius: var(--te-base-border-radius-1);
}

:deep(.tiny-tabs__item:last-child) {
  border-top-right-radius: var(--te-base-border-radius-1);
  border-bottom-right-radius: var(--te-base-border-radius-1);
}

.tiny-collapse {
  flex: 1;
  overflow-y: scroll;
}
</style>
