<template>
  <div class="wrapper">
    <Empty visible />
    <Collapse v-model="activeItems">
      <template v-for="cell in activeCells" :key="cell.id">
        <collapse-item :name="cell.id" :title="cell.data.label[locale]">
          <property-setting v-model="cell.data" />
          <!-- {{ cell.id }} -->
        </collapse-item>
      </template>
    </Collapse>
  </div>
</template>

<script setup>
import PropertySetting from './components/property-setting.vue'
import { Collapse, CollapseItem } from '@opentiny/vue'
import { onMounted, ref } from 'vue'
import Empty from './components/Empty.vue'
import { useX6 } from '@opentiny/tiny-engine-controller'
import i18n from '@opentiny/tiny-engine-i18n-host'

const locale = i18n.global.locale

/**
 * @type {import('vue').Ref<import('@antv/x6').Cell[]}
 */
const activeCells = ref([])
/**
 * @type {import('vue').Ref<any[]>}
 */
const activeItems = ref([])

onMounted(() => {
  const { g } = useX6()
  g.on('selection:changed', () => {
    const cells = g.getSelectedCells()
    activeCells.value = cells
  })
})
</script>

<style scoped>
.wrapper {
  padding: 0px 16px;
}
</style>
<!-- <template>
  <config-render :data="properties">
    <template #prefix="{ data }">
      <block-link-field v-if="isBlock" :data="data"></block-link-field>
    </template>
  </config-render>
  <block-description v-if="isBlock" class="block-description"> </block-description>
  <empty :showEmptyTips="showEmptyTips"></empty>
</template>

<script>
import { computed, watchEffect, ref } from 'vue'
import { ConfigRender, BlockDescription, BlockLinkField } from '@opentiny/tiny-engine-common'
import { useCanvas, useProperty } from '@opentiny/tiny-engine-controller'
import Empty from './components/Empty.vue'

export default {
  components: {
    ConfigRender,
    BlockLinkField,
    BlockDescription,
    Empty
  },
  setup() {
    const { pageState } = useCanvas()
    const { properties } = useProperty({ pageState })
    const showEmptyTips = ref(false)

    const isBlock = computed(() => pageState.isBlock)

    watchEffect(() => {
      showEmptyTips.value = !properties.value?.length
    })

    return {
      isBlock,
      properties,
      showEmptyTips
    }
  }
}
</script>

<style lang="less" scoped>
.block-description {
  margin: 10px;
}
</style> -->
