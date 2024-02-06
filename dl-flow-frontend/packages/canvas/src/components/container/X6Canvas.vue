<template>
  <div style="width: 100%; height: 100%">
    <div id="container" style="width: 100%; height: 100%"></div>
    <div class="context-menu" :style="{
        top: `${position.y}px`,
        left: `${position.x}px`
      }" v-if="visible" ref="menu">
      <ul @click="visible = false;">
        <template v-for="(item,idx) in menuData" :key="idx">
          <li 
            @click="item?.action"
            :class="[item?.disabled && 'disabled', item?.extrenalClass]"
            v-if="item?.visible ?? true"
          > {{ item.label }} </li>
        </template>
      </ul>
    </div>
    <teleport-content />
  </div>
</template>

<script setup>
import { onClickOutside } from '@vueuse/core'
import { onMounted, reactive, watch, ref } from 'vue'
import { useX6, useSchema } from '@opentiny/tiny-engine-controller'
import { getTeleport } from '@antv/x6-vue-shape'
import { Notify } from '@opentiny/vue';

const teleportContent = getTeleport()
const position = reactive({
  x: 0,
  y:0
})
const visible = ref(false);
const menu = ref(null);
const activeNodeId = ref('');
const hasStart = ref(false);
const hasEnd = ref(false);

const hiddenContextMenu = () => visible.value = false;
const {
  schema,
  hasStartNode,
  hasEndNode,
  setStartNode,
  setEndNode,
  isStartNode,
  isEndNode,
  clearStartNode,
  clearEndNode,
  updateRelation
} = useSchema()
/**
 * @type {import('@antv/x6').Graph}
 */
let g;
onClickOutside(menu, hiddenContextMenu);

const menuData = reactive([
  {
    label: '删除',
    extrenalClass : 'danger',
    action: () => {
      if (!activeNodeId.value){
        return;
      }
      g.removeCell(activeNodeId.value);
    }
  },
  {
    label: '设置为根',
    extrenalClass: '',
    action: ()=>{
      if (!activeNodeId.value){
        return;
      }
      const cell = g.getCellById(activeNodeId.value);
      if (cell.data.new) {
        Notify({
          type: 'error',
          message: 'Layer没有保存'
        })
        return;
      }
      setStartNode(activeNodeId.value);
    }
  },
  {
    label: '设置为结束',
    extrenalClass: '',
    action: ()=>{
      if (!activeNodeId.value){
        return;
      }
      const cell = g.getCellById(activeNodeId.value);
      if (cell.data.new) {
        Notify({
          type: 'error',
          message: 'Layer没有保存'
        })
        return;
      }
      setEndNode(activeNodeId.value);
    }
  }
])

onMounted(() => {
  g = useX6('container').g;
  watch(schema, ()=>{
    hasStart.value = hasStartNode();
    hasEnd.value = hasEndNode();
  }, {deep: true})
  g.on('cell:contextmenu', (args) => {
    const {x:dx,y:dy,cell:{id}} = args;
    const {x,y} = g.localToGraph(dx,dy)
    position.x = x;
    position.y = y;
    visible.value = true;
    activeNodeId.value = id;
  })
  g.on('cell:removed', ({cell}) => {
    if (!cell.isNode()){
      return;
    }
    if (isStartNode(cell)){
      clearStartNode();
    }
    if (isEndNode(cell)){
      clearEndNode();
    }
  })
})
</script>

<style lang="less">
.context-menu{
  min-width: 120px;
  max-width: 200px;
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  ul{
    width: 100%;
    word-break: break-all;
    background: #fff;
    padding: 8px !important;
    display: flex;
    flex-direction: column;
    gap: 6px;
    li {
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 150ms linear;
    }
    li:hover{
      background: #eee;
    }
    .danger{
      color: #ff0000;
      font-weight: 500;
    }
    .danger:hover {
      background: rgba(255,0,0,.2);
    }
    .disabled {
      cursor: not-allowed;
      color: rgba(0,0,0,.3);
    }
    .disabled:hover{
      background: transparent;
    }
  }
}
</style>