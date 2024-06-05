<template>
  <tiny-tabs v-model="activeName" tab-style="button-card" class="full-width-tabs" v-if="!onlyShowDefault">
    <tiny-tab-item :key="item.id" v-for="item in tabComponents" :title="item.title" :name="item.id">
      <component :is="item.component" :activeTabName="activeName" :rightPanelRef="rightPanelRef"></component>
    </tiny-tab-item>
  </tiny-tabs>
  <component :is="defaultComponent" v-if="onlyShowDefault"></component>
  <div class="material-right-panel" ref="rightPanelRef"></div>
</template>

<script>
import { ref } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { getMergeMeta } from '@opentiny/tiny-engine-entry'

import MetaData from '../index.js'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem
  },
  setup() {
    const rightPanelRef = ref(null)
    const onlyShowDefault = ref(MetaData.options?.isShowTabs)
    const activeName = ref(MetaData.options?.defaultTabId)
    const defaultComponent = getMergeMeta(activeName.value)?.component
    const tabComponents = MetaData.options.children?.map(({ id }) => {
      const metaData = getMergeMeta(id)
      return {
        id,
        component: metaData?.component,
        title: metaData?.options?.title || id
      }
    })

    return {
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
  padding: 8px;
}

:deep(.tiny-tabs__content) {
  flex: 1;
  overflow-y: scroll;
  padding: 0;
  & > div {
    height: 100%;
  }
}

.tiny-collapse {
  flex: 1;
  overflow-y: scroll;
}
</style>
