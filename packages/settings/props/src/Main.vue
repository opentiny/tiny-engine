<template>
  <div class="wrapper">
    <Empty v-if="empty" />
    <Collapse v-model="activeItems">
      <template v-for="cell in activeCells" :key="cell.id">
        <collapse-item :name="cell.id" :title="cell.data.label[locale]">
          <property-setting v-model="cell.data" :cell-id="cell.id" @update="onUpdate" />
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
const empty = ref(true)

/**
 * @type {import('vue').Ref<import('@antv/x6').Cell[]}
 */
const activeCells = ref([])
/**
 * @type {import('vue').Ref<any[]>}
 */
const activeItems = ref([])

/** @type {import('@antv/x6').Graph} */
let g
onMounted(() => {
  g = useX6().g
  g.on('selection:changed', () => {
    const cells = g.getSelectedCells()
    empty.value = !cells.length
    activeCells.value = cells
  })
})
const onUpdate = ({ properties, id }) => {
  if (!g) {
    return
  }
  const cell = g.getCellById(id)
  if (!cell) {
    return
  }
  const data = cell.getData()
  data.properties = properties
  cell.setData(data)
}
</script>

<style scoped>
.wrapper {
  padding: 0px 16px;
}
</style>
