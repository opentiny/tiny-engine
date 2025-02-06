<template>
  <div class="components-wrap">
    <tiny-search v-model="state.searchValue" placeholder="请输入关键字搜索" clearable @update:modelValue="change">
      <template #prefix> <icon-search /> </template>
    </tiny-search>
    <tiny-collapse v-model="state.activeName" class="lowcode-scrollbar">
      <tiny-collapse-item
        v-for="(item, index) in state.components"
        :key="item.group"
        :title="item.label?.[locale] || item.group"
        :name="index"
      >
        <ul class="component-group" :style="{ gridTemplateColumns }">
          <template v-for="child in item.children" :key="child.component">
            <canvas-drag-item
              v-if="!child.hidden && (child.name?.[locale] || child.name)"
              :data="generateNode({ component: child.snippetName || child.component })"
              @click="componentClick"
            >
              <li class="component-item">
                <div class="component-item-component">
                  <svg-icon :name="child?.icon?.toLowerCase() || 'row'"></svg-icon>
                </div>
                <span class="component-item-name" :title="child.name?.[locale] || child.name">{{
                  child.name?.[locale] || child.name
                }}</span>
              </li>
            </canvas-drag-item>
          </template>
        </ul>
      </tiny-collapse-item>
      <search-empty :isShow="!state.components.length" />
    </tiny-collapse>
  </div>
</template>

<script>
import { inject, onMounted, reactive, ref } from 'vue'
import { Collapse, CollapseItem, Search } from '@opentiny/vue'
import { SearchEmpty, CanvasDragItem } from '@opentiny/tiny-engine-common'
import i18n from '@opentiny/tiny-engine-common/js/i18n'
import { iconSearch } from '@opentiny/vue-icon'
import { useMaterial, useCanvas } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinySearch: Search,
    IconSearch: iconSearch(),
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    CanvasDragItem,
    SearchEmpty
  },
  setup() {
    const COMPONENT_PANEL_COLUMNS = '1fr 1fr 1fr'
    const SHORTCUT_PANEL_COLUMNS = '1fr 1fr 1fr 1fr 1fr 1fr'
    const { generateNode, materialState } = useMaterial()
    const gridTemplateColumns = ref(COMPONENT_PANEL_COLUMNS)
    const panelState = inject('panelState', {})
    const { components } = materialState
    const { locale } = i18n.global

    const fetchComponents = (components, name) => {
      if (!name) {
        return components
      }

      const result = []
      components.forEach((component) => {
        const children = []

        component.children.forEach((child) => {
          if (child.name?.[locale.value]?.toLowerCase().indexOf(name.toLowerCase()) > -1) {
            children.push(child)
          }
        })

        if (children.length > 0) {
          result.push({
            groupId: component.groupId,
            group: component.group,
            groupName: component.groupName,
            children: children
          })
        }
      })

      return result
    }

    const state = reactive({
      components,
      activeName: [...Array(components.length).keys()],
      searchValue: ''
    })

    const change = (value) => {
      state.components = fetchComponents(components, value)
    }

    const componentClick = (data) => {
      const { isShortcutPanel, emitEvent } = panelState
      const { addComponent } = useCanvas().canvasApi.value

      if (isShortcutPanel) {
        addComponent(data, isShortcutPanel)
        emitEvent('close')
      }
    }

    onMounted(() => {
      if (panelState.isShortcutPanel) {
        gridTemplateColumns.value = SHORTCUT_PANEL_COLUMNS
      }
    })

    return {
      locale,
      gridTemplateColumns,
      state,
      change,
      generateNode,
      componentClick
    }
  }
}
</script>

<style lang="less" scoped>
.components-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;

  .tiny-search {
    padding: 12px;
  }

  :deep(.tiny-collapse-item__content) {
    padding: 0 var(--te-common-vertical-form-label-spacing) 4px;
  }

  .component-group {
    display: grid;
    width: 100%;
    color: var(--ti-lowcode-materials-component-list-color);

    .component-item {
      padding: var(--te-common-vertical-form-label-spacing) 0 var(--te-common-vertical-form-label-spacing);
      margin-bottom: var(--te-common-vertical-form-label-spacing);
      text-align: center;
      user-select: none;
      cursor: move;
      background: var(--te-common-bg-default);

      &:hover {
        background: var(--te-common-bg-container);
        border-radius: 4px;
      }

      .component-item-component {
        margin-bottom: 8px;

        svg {
          font-size: 40px;
          vertical-align: middle;
          color: var(--te-common-icon-secondary);
          overflow: hidden;
        }
      }

      .component-item-name {
        max-width: 62px;
        display: inline-block;
        overflow: hidden;
        font-size: 12px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }

    :deep(.drag-item:nth-child(3n)) {
      .component-item {
        border-right: none;
      }
    }
  }

  .tiny-collapse {
    flex: 1;
    overflow-y: auto;
    .tiny-collapse-item.is-active + .tiny-collapse-item {
      margin-top: 0;
    }
    :deep(.tiny-collapse-item__header .tiny-collapse-item__word-overflow) {
      margin: var(--te-common-vertical-item-spacing-normal) 0px var(--te-common-vertical-form-label-spacing);
    }
    .components-items {
      .item {
        cursor: pointer;
      }
    }
  }
}
</style>
