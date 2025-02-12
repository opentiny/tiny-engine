<template>
  <plugin-panel class="outlinebox" title="大纲树" @close="$emit('close')">
    <template #header>
      <svg-button
        class="item icon-sidebar"
        :name="panelFixed ? 'fixed-solid' : 'fixed'"
        :tips="panelFixed ? '解除固定面板' : '固定面板'"
        @click="$emit('fix-panel', PLUGIN_NAME.OutlineTree)"
      ></svg-button>
    </template>
    <template #content>
      <div class="tree-wrap lowcode-scrollbar">
        <tiny-grid
          ref="gridRef"
          :data="state.pageSchema"
          :tree-config="{ children: 'children', expandAll: state.expandAll, renderIcon: renderIconFn }"
          :show-header="false"
          :highlight-hover-row="false"
          :auto-resize="true"
          :row-class-name="getClassName"
        >
          <tiny-grid-column field="componentName" tree-node>
            <template #default="data">
              <span
                class="tree-box"
                :schemaId="data.row?.id"
                :type="data.row.componentName"
                @mouseover="mouseover(data.row)"
                @mouseleave="mouseleave(data.row)"
                @click="checkElement(data.row)"
              >
                <span class="tree-content" :class="{ 'node-isblock': data.row?.componentType === 'Block' }">
                  <!-- <span class="node-icon">
                    <component :is="getIcon(data.row)" style="width: 1em; height: 1em"></component>
                  </span> -->
                  <span>{{ data.row.componentName }}</span>
                </span>
                <span v-show="data.row.showEye" class="tree-handle" @mouseup="showNode(data.row)">
                  <icon-eyeopen v-show="data.row.show"></icon-eyeopen>
                  <icon-eyeclose v-show="!data.row.show"></icon-eyeclose>
                </span>
              </span>
            </template>
          </tiny-grid-column>
        </tiny-grid>
      </div>
    </template>
  </plugin-panel>
</template>

<script>
import { reactive, watch, ref, computed, onActivated, onDeactivated } from 'vue'
import { Grid, GridColumn } from '@opentiny/vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import { constants } from '@opentiny/tiny-engine-utils'
import { IconChevronDown, iconEyeopen, iconEyeclose } from '@opentiny/vue-icon'
import { useCanvas, useMaterial, useLayout, useMessage } from '@opentiny/tiny-engine-meta-register'
import { extend } from '@opentiny/vue-renderless/common/object'
import { typeOf } from '@opentiny/vue-renderless/common/type'

const { PAGE_STATUS } = constants
export default {
  components: {
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    PluginPanel,
    SvgButton,
    IconEyeopen: iconEyeopen(),
    IconEyeclose: iconEyeclose()
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  emits: ['close', 'fix-panel'],
  setup(props) {
    const { pageState, getInstance } = useCanvas()
    const { getMaterial } = useMaterial()
    const { PLUGIN_NAME } = useLayout()

    const panelFixed = computed(() => props.fixedPanels?.includes(PLUGIN_NAME.OutlineTree))

    const filterSchema = (data) => {
      const translateChild = (data) => {
        data.forEach((item) => {
          item.show = pageState.nodesStatus[item.id] !== false
          item.showEye = !item.show
          const child = item.children
          if (typeOf(child) !== 'array') {
            delete item.children
          } else {
            if (item.children.length) {
              translateChild(item.children)
            }
          }
        })

        return data
      }

      return [{ ...translateChild([extend(true, {}, data)])[0], componentName: 'body' }]
    }
    const state = reactive({
      pageSchema: [],
      expandAll: true,
      initSchema: [],
      isLock: computed(
        () => ![PAGE_STATUS.Occupy, PAGE_STATUS.Guest].includes(useLayout().layoutState.pageStatus.state)
      ),
      dragState: {
        allowDrop: true,
        dragSchema: null,
        hoverVm: null,
        currentVm: null,
        parentNode: null,
        indicator: true
      }
    })

    const { subscribe, unsubscribe } = useMessage()

    onActivated(() => {
      state.pageSchema = filterSchema(pageState.pageSchema)

      subscribe({
        topic: 'schemaChange',
        subscriber: 'node-tree',
        callback: ({ operation }) => {
          if (operation?.type !== 'changeProps') {
            state.pageSchema = filterSchema(pageState.pageSchema)
          }
        }
      })
    })

    onDeactivated(() => {
      unsubscribe({
        topic: 'schemaChange',
        subscriber: 'node-tree'
      })
    })

    watch(
      () => pageState.currentSchema,
      () => {
        const { getSchema } = useCanvas()
        state.pageSchema = filterSchema(getSchema())
      }
    )

    const toggleTree = () => {
      state.expandAll = !state.expandAll
    }

    const showNode = (data) => {
      data.show = !data.show
      pageState.nodesStatus[data.id] = data.show

      const { getRenderer, clearSelect } = useCanvas().canvasApi.value

      getRenderer().setCondition(data.id, data.show)
      clearSelect()
    }

    const getIcon = (node) => {
      if (!node.componentName) return undefined
      const component = getMaterial(node.componentName)
      return component.icon || 'IconAssociation'
    }

    const mouseover = (data) => {
      if (state.isLock) {
        return
      }

      const { hoverNode } = useCanvas().canvasApi.value

      hoverNode(data.id)
      data.showEye = true
    }

    const mouseleave = (data) => {
      if (data && !data.show) {
        return
      }
      data.showEye = false
    }

    const checkElement = (row) => {
      if (state.isLock) {
        return
      }

      const { selectNode } = useCanvas().canvasApi.value
      selectNode(row?.id, 'clickTree')
    }

    const gridRef = ref(null)

    const rowDrop = () => {}

    const getClassName = ({ row }) => {
      const hightLight = pageState?.currentSchema?.id === row.id ? 'high-light-node' : ''
      return 'nav-tree ' + hightLight
    }

    const rowDropMove = (event, originalEvent) => {
      event.dragged.classList.remove('nodrag')
      const { clientY } = originalEvent
      const bottom = event.draggedRect.bottom
      const distance = Math.abs(clientY - bottom)

      const dragType = event.dragged.querySelector('.tree-box').getAttribute('type')
      const dragId = event.dragged.querySelector('.tree-box').getAttribute('schemaId')
      const dragSchema = getInstance(dragId)

      state.dragState.dragSchema = dragSchema

      const relateType = event.related.querySelector('.tree-box').getAttribute('type')
      const relateId = event.related.querySelector('.tree-box').getAttribute('schemaId')
      const relateSchema = getInstance(relateId)

      pageState.hoverVm = relateSchema

      const isRelateContainer = dragSchema?.componentName?.container
      const relateParent = relateSchema?.parent.schema.componentName

      if (dragType === 'col' && isRelateContainer && relateType !== 'col') {
        state.dragState.indicator = false
      } else if (dragType === 'col' && !isRelateContainer && relateParent !== 'row') {
        state.dragState.indicator = false
      } else if (dragType !== 'col' && isRelateContainer && relateType === 'row') {
        state.dragState.indicator = false
      } else if (!relateSchema) {
        state.dragState.indicator = false
      } else {
        state.dragState.indicator = true
      }

      if (!state.dragState.indicator) {
        event.dragged.classList.add('nodrag')
        state.dragState.allowDrop = false
      } else {
        event.dragged.classList.remove('nodrag')
        state.dragState.allowDrop = true
      }

      const el = originalEvent.target

      if (
        distance < 4 &&
        distance > 1 &&
        isRelateContainer &&
        (!relateSchema.schema.children || relateSchema.schema.children.length === 0)
      ) {
        state.dragState.parentNode = el
        el.querySelector('.tiny-grid-tree-wrapper').innerHTML =
          '<i class="tiny-grid-tree__node-btn tiny-grid-icon__caret-right"></i>'
      }

      if (
        state.dragState.parentNode &&
        state.dragState.parentNode.getAttribute('data-rowid') !== el.getAttribute('data-rowid')
      ) {
        state.dragState.parentNode.querySelector('.tiny-grid-tree-wrapper').innerHTML = ''
        state.dragState.parentNode = null
      }
    }

    watch(
      () => pageState.isLock,
      (value) => {
        setTimeout(rowDrop, 1000)
        state.isLock = value
      }
    )

    const renderIconFn = (h, { isActive }) =>
      h(IconChevronDown(), {
        class: ['tiny-grid-tree__node-btn', { is__active: isActive }]
      })

    return {
      panelFixed,
      checkElement,
      mouseover,
      mouseleave,
      showNode,
      state,
      getIcon,
      rowDropMove,
      gridRef,
      toggleTree,
      getClassName,
      PLUGIN_NAME,
      renderIconFn
    }
  }
}
</script>

<style lang="less" scoped>
.outlinebox {
  height: 100%;
  overflow: hidden;
  .tree-wrap {
    height: calc(100% - 38px);
    overflow-y: scroll;
    padding-top: 12px;
    border-top: 1px solid var(--ti-lowcode-tree-border-color);

    .tree-handle {
      font-size: var(--te-base-font-size-2);
      svg {
        fill: var(--te-common-icon-secondary);
      }
    }
  }
  :deep(.tiny-grid) {
    background-color: unset;
    .tree-box {
      display: flex;
      width: 200px;
      justify-content: space-between;
    }

    .tiny-grid-tree-wrapper {
      margin-right: 8px;

      .tiny-grid-tree__node-btn {
        width: 14px;
        height: 14px;
        margin-bottom: 2px;
      }
    }
  }

  :deep(.tiny-grid-body__row.nav-tree .tiny-grid-cell) {
    line-height: inherit;
  }
  :deep(.high-light-node) {
    background: var(--te-common-bg-container) !important;

    :deep(.eyeOpen) {
      display: block !important;
    }
  }
  :deep(.tiny-grid .tiny-grid__body-wrapper .tiny-grid-body__column) {
    color: var(--te-common-text-primary);
    padding: 0 12px;
    height: 24px !important;
    line-height: 24px;
    .tree-content {
      font-size: 12px;
    }
    .node-isblock {
      color: var(--te-common-color-prompt-secondary);
    }
  }
}
</style>
