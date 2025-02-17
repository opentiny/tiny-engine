<template>
  <div class="components-wrap">
    <tiny-search v-model="state.searchValue" placeholder="请输入关键字搜索" clearable @search="searchIcons">
      <template #prefix> <icon-search /> </template>
    </tiny-search>
    <div style="flex: 1; position: relative; overflow: hidden">
      <!-- ICON COLLECTION -->
      <ul class="component-group" :style="{ gridTemplateColumns }" style="height: 100%; overflow-y: auto">
        <template v-for="(child, key) in state.collections" :key="key">
          <li class="component-item" @click="openIconCollection(key)">
            <div class="component-item-component">
              <icon
                v-for="iconName in child.samples"
                :key="iconName"
                :icon="`${key}:${iconName}`"
                width="30"
                height="30"
              ></icon>
            </div>
            <div class="component-item-name" :title="child.name?.zh_CN || child.name">
              {{ child.name?.zh_CN || child.name }}({{ child.total }}个)
            </div>
          </li>
        </template>
      </ul>

      <!-- ICON LIST -->
      <div class="icons-wrap" v-if="state.showIcons">
        <div class="icons-header">
          <icon
            icon="icon-park-outline:left-c"
            width="24"
            height="24"
            style="cursor: pointer; color: #999; margin-right: 5px"
            @click="closeIconCollection()"
          ></icon>
          <span style="font-size: 12px">图标列表 共({{ state.icons.length }})个</span>
          <!-- <icon icon="ci:close-square" width="24" height="24" style="cursor: pointer;color:#999;margin-right: 5px;"
            @click="closeIconCollection()"></icon> -->
        </div>
        <div v-if="list.length === 0" style="text-align: center; opacity: 0.5">loading...</div>
        <div class="icons-group" v-bind="containerProps" style="overflow-y: auto; flex: 1">
          <div v-bind="wrapperProps">
            <ul
              class="component-group"
              v-for="(item, index) in list"
              :key="index"
              style="grid-template-columns: repeat(4, 1fr)"
            >
              <canvas-drag-item
                v-for="(iconName, i) in item.data"
                :key="i"
                :data="generateNode({ component: 'Icon', props: { name: iconName, icon: iconName } })"
                @click="componentClick"
              >
                <li class="component-item">
                  <div class="component-item-component">
                    <icon :icon="iconName" width="30" height="30"></icon>
                  </div>
                  <!-- <span class="component-item-name" :title="iconName">{{iconName}}</span> -->
                </li>
              </canvas-drag-item>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, reactive, computed } from 'vue'
import { Search } from '@opentiny/vue'
import { CanvasDragItem } from '@opentiny/tiny-engine-common'
import { iconSearch } from '@opentiny/vue-icon'
import { useMaterial, useProperties } from '@opentiny/tiny-engine-meta-register'
import { Icon } from '@iconify/vue'
import { useVirtualList } from '@vueuse/core'
import { fetchIconifyCollections, fetchIconifyCollectionIcons, queryIconify } from './js/http'

function convertTo2DArray(arr, length) {
  const result = []
  for (let i = 0; i < arr.length; i += length) {
    const subArray = arr.slice(i, i + length)
    result.push(subArray)
  }
  return result
}

export default {
  components: {
    Icon,
    TinySearch: Search,
    IconSearch: iconSearch(),
    CanvasDragItem
  },
  setup() {
    const { generateNode } = useMaterial()

    const state = reactive({
      showIcons: false,
      currentCollection: '',
      collections: {},
      icons: {},
      searchValue: ''
    })

    /* 图标列表无限滚动 */
    const filteredItems = computed(() => {
      const icons = state.currentCollection
        ? state.icons.filter((name) => (state.searchValue ? name.includes(state.searchValue.toLowerCase()) : true))
        : state.icons
      return convertTo2DArray(icons, 4)
    })
    const { list, containerProps, wrapperProps } = useVirtualList(filteredItems, {
      itemHeight: 50,
      overscan: 10
    })

    /*  */
    const componentClick = (data) => {
      const { setProp, getSchema } = useProperties()
      const sechema = getSchema()

      if (sechema.componentName !== 'Icon') return

      setProp('name', data.props.name)
      setProp('icon', data.props.name)
    }

    const fetchCollections = async () => {
      state.collections = await fetchIconifyCollections()
    }

    const searchIcons = async () => {
      if (state.currentCollection) return

      state.icons = []
      state.showIcons = true

      const result = await queryIconify({ query: state.searchValue })

      state.icons = result.icons
    }

    const openIconCollection = async (prefix) => {
      state.currentCollection = prefix
      state.showIcons = true
      state.icons = []
      const result = await fetchIconifyCollectionIcons({ prefix: prefix })

      let icons = []
      if (result.categories && Object.keys(result.categories).length > 0) {
        icons = [...icons, ...new Set([].concat(...Object.values(result.categories)))]
      }
      if (result.uncategorized?.length > 0) {
        icons = icons.concat(result.uncategorized)
      }

      state.icons = icons.map((i) => result.prefix + ':' + i)
    }

    const closeIconCollection = () => {
      state.currentCollection = ''
      state.showIcons = false
      state.icons = []
    }

    onMounted(() => {
      fetchCollections()
    })

    return {
      list,
      containerProps,
      wrapperProps,
      state,
      searchIcons,
      generateNode,
      openIconCollection,
      closeIconCollection,
      componentClick
    }
  }
}
</script>

<style lang="less" scoped>
.components-wrap {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;

  .tiny-search {
    padding: 0 8px 12px;
  }

  .component-group {
    display: grid;
    width: 100%;
    color: var(--ti-lowcode-materials-component-list-color);

    .component-item {
      padding: 12px 0;
      border-right: 1px solid var(--ti-lowcode-material-component-list-border-color);
      border-bottom: 1px solid var(--ti-lowcode-material-component-list-border-color);
      text-align: center;
      cursor: pointer;
      background: var(--ti-lowcode-common-component-bg);

      &:hover {
        background: var(--ti-lowcode-material-component-list-hover-bg);
      }

      .component-item-component {
        margin-bottom: 8px;

        svg {
          font-size: 40px;
          vertical-align: middle;
          color: var(--ti-lowcode-component-icon-color);
          overflow: hidden;
          margin-right: 10px;
        }
      }

      .component-item-name {
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

  .icons-wrap {
    display: flex;
    flex-direction: column;
    flex: 1;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: #fff;
  }

  .icons-header {
    margin-bottom: 20px;
    padding-left: 10px;
    display: flex;
    align-items: center;
    // justify-content: space-between
  }

  .icons-group {
    :deep(.drag-item:nth-child(3n)) {
      .component-item {
        border-right: 1px solid var(--ti-lowcode-material-component-list-border-color);
      }
    }

    .component-item-component {
      cursor: move;

      svg {
        margin-right: 0px !important;
      }
    }
  }

  .tiny-collapse {
    flex: 1;
    overflow-y: scroll;

    .tiny-collapse-item.is-active + .tiny-collapse-item {
      margin-top: 0;
    }

    .components-items {
      .item {
        cursor: pointer;
      }
    }
  }
}
</style>
