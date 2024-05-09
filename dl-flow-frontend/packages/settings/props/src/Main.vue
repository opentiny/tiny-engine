<template>
  <div class="wrapper">
    <Empty v-if="empty" />
    <Collapse v-model="activeItems" v-if="shouldShow">
      <template v-for="cell in activeCells" :key="cell.id">
        <collapse-item
          :name="cell.id"
          :title="cell.data.label[locale]"
          v-if="!cell.data.new"
        >
          <property-setting v-model="cell.data" :cell-id="cell.id" @update="onUpdate" />
        </collapse-item>
      </template>
    </Collapse>
    <Tip v-else-if="!empty" desc="当前Layer没有属性设置" />
  </div>
</template>

<script setup>
import PropertySetting from './components/property-setting.vue'
import { Collapse, CollapseItem} from '@opentiny/vue'
import { onMounted, ref, computed } from 'vue'
import Empty from './components/Empty.vue'
import { Tip } from '@opentiny/tiny-engine-common'
import { useX6, useSchema } from '@opentiny/tiny-engine-controller'
import i18n from '@opentiny/tiny-engine-i18n-host'

const locale = i18n.global.locale
const empty = ref(true)

/**
 * @type {import('vue').Ref<import('@antv/x6').Cell<any>[]}
 */
const activeCells = ref([])
/**
 * @type {import('vue').Ref<any[]>}
 */
const activeItems = ref([])

const shouldShow = computed(() => {
  return activeCells.value.some((v) => {
    /**
     * @type {import('../../../controller/src/useX6.js').MaterialInfo}
     */
    const data = v.getData()
    return data?.mode && (data.mode === 'nn' ? true : Boolean(data.properties?.length))
  })
})

/** @type {import('@antv/x6').Graph} */
let g
const onSelection = () => {
  const cells = g.getSelectedCells()
  empty.value = !cells.length;
  if (activeCells.value.length){
    activeCells.value = [];
  }
  cells.forEach((cell) => {
    if (activeCells.value.includes(cell)){
      return;
    }
    if (cell.children && cell.children.length){
      const children = cell.getChildren().filter((child) => child.getData() && child.getData().mode !== undefined);
      activeCells.value.push(...children);
    } else {
      activeCells.value.push(cell)
    }
  })
}
const {updateSchema} = useSchema();
onMounted(() => {
  g = useX6().g
  g.on('selection:changed', onSelection)
  onSelection();
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
  if (g){
    updateSchema(g.toJSON());
  }
}
</script>

<style scoped>
.wrapper {
  padding: 0px 16px;
}
</style>
