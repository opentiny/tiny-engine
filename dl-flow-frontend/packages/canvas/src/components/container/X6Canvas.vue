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
const groupPadding = ref(20);
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
  updateSchema
} = useSchema()
const ctrlPressed = ref(false);
/**
 * @type {import('@antv/x6').Graph}
 */
let g;
onClickOutside(menu, hiddenContextMenu);
/**
* 
* @param {import('@antv/x6').Node} node 
*/
const calcGroupPosition = (node) => {
  if (ctrlPressed.value || !node.isNode()) {
    return
  }
  const children = node.getChildren();
  if (children && children.length) {
    node.prop('originPosition', node.getPosition())
  }
  const parent = node.getParent()
  if (parent && parent.isNode()) {
    let originSize = parent.prop('originSize')
    if (originSize == null) {
      originSize = parent.getSize()
      parent.prop('originSize', originSize)
    }
    let originPosition = parent.prop('originPosition')
    if (originPosition == null) {
      originPosition = parent.getPosition()
      parent.prop('originPosition', originPosition)
    }
    let x = originPosition.x
    let y = originPosition.y
    let cornerX = originPosition.x + originSize.width
    let cornerY = originPosition.y + originSize.height
    let hasChange = false
    const children = parent.getChildren()
    if (children) {
      children
      .filter((child) => child.isNode())
      .forEach((child) => {
        const bbox = child.getBBox().inflate(groupPadding.value)
        const corner = bbox.getCorner()
        if (bbox.x < x) {
          x = bbox.x
          hasChange = true
        }
        if (bbox.y < y) {
          y = bbox.y
          hasChange = true
        }
        if (corner.x > cornerX) {
          cornerX = corner.x
          hasChange = true
        }
        if (corner.y > cornerY) {
          cornerY = corner.y
          hasChange = true
        }
      })
    }
    if (hasChange) {
      parent.prop(
        {
          position: { x, y },
          size: { width: cornerX - x, height: cornerY - y },
        },
        { skipParentHandler: true },
      )
    }
  }
}

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
  },
  {
    label: '创建组合',
    extrenalClass: '',
    action: () => {
      if (!g){
        return;
      }
      const cells = g.getSelectedCells().filter((cell) => cell.getChildCount() === 0 && !cell.hasParent());
      const group = g.addNode({
        shape: 'group-node',
        ports: [
          {
            id: 'in',
            group: 'top'
          },
          {
            id: 'out',
            group: 'bottom'
          }
        ]
      });
      cells.forEach((cell) => {
        group.addChild(cell);
        calcGroupPosition(cell);
      });
    }
  }
])

onMounted(() => {
  const x6 = useX6('container');
  g = x6.g;
  groupPadding.value = x6.GROUP_PADDING
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
  g.on('node:embedding', ({ e }) => {
    ctrlPressed.value = e.metaKey || e.ctrlKey
  })
  g.on('node:embedded', () => {
    ctrlPressed.value = false
  })
  g.on('node:change:position', ({ node }) => {
    calcGroupPosition(node);
  })
  g.on('cell:added', ()=>{
    updateSchema(g.toJSON())
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
