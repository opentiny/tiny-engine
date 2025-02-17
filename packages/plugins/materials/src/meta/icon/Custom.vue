<template>
  <div class="components-wrap">
    <div style="display: flex; justify-content: space-between" v-if="!state.showIcons">
      <tiny-search v-model="state.searchValue" placeholder="搜索" clearable @search="searchIcons">
        <template #prefix> <icon-search /> </template>
      </tiny-search>
      <!-- <svg-button name="add-page" placement="bottom" tips="新建集合" ></svg-button> -->
      <!-- <icon icon="icon-park-outline:add" width="24" height="24" style="cursor: pointer;color:#999;margin-left: auto;"
      @click="state.showCreateCollection=true"></icon> -->
      <tiny-button @click="state.showCreateCollection = true" style="width: 50px">创建</tiny-button>
    </div>
    <div style="flex: 1; position: relative; overflow: hidden">
      <!-- ICON COLLECTION -->
      <ul
        class="component-group"
        :style="{ gridTemplateColumns }"
        v-for="(child, index) in state.collections"
        :key="index"
      >
        <li class="component-item" @click="openIconCollection(child)">
          <div class="component-item-component">
            <icon v-for="(icon, i) in child.samples" :key="i" :icon="icon.key" width="24" height="24"></icon>
          </div>
          <div class="component-item-name" :title="child.name?.zh_CN || child.name">
            {{ child.name?.zh_CN || child.name }}({{ child.total }}个)
          </div>
        </li>
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
          <span style="font-size: 12px">图标列表 共({{ Object.keys(state.icons).length }})个</span>
          <icon
            icon="gridicons:add-outline"
            width="24"
            height="24"
            style="cursor: pointer; color: #999; margin-left: auto"
            @click="state.showCreateIcon = true"
          ></icon>
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
                v-for="(icon, i) in item.data"
                :key="i"
                :data="generateNode({ component: 'Icon', props: { name: icon.key, icon: icon.key } })"
                @click="componentClick"
              >
                <li class="component-item">
                  <div class="component-item-component">
                    <icon :icon="icon.key" width="24" height="24"></icon>
                  </div>
                </li>
              </canvas-drag-item>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <CreateCollection
      :boxVisibility="state.showCreateCollection"
      @close="state.showCreateCollection = false"
      @complete="createCollectionComplete"
    >
    </CreateCollection>
    <CreateIcon
      :boxVisibility="state.showCreateIcon"
      @close="state.showCreateIcon = false"
      @complete="createIconComplete"
    >
    </CreateIcon>
  </div>
</template>

<script>
import { onMounted, reactive, computed } from 'vue'
import { Search, Button } from '@opentiny/vue'
import { CanvasDragItem } from '@opentiny/tiny-engine-common'
import { iconSearch } from '@opentiny/vue-icon'
import { useCanvas, useProperties, useMaterial } from '@opentiny/tiny-engine-meta-register'
import { Icon, addCollection } from '@iconify/vue'
import { useVirtualList } from '@vueuse/core'
import {
  getIconCollections,
  createIconCollection,
  removeIconCollection,
  importIconCollection,
  importIcon,
  removeIcon
} from './js/http'
import CreateCollection from './CreateCollection.vue'
import CreateIcon from './CreateIcon.vue'

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
    CanvasDragItem,
    CreateCollection,
    CreateIcon,
    TinyButton: Button
  },
  setup() {
    const { generateNode } = useMaterial()
    const { refreshIcons } = useCanvas()

    const state = reactive({
      showCreateCollection: false,
      showCreateIcon: false,
      showIcons: false,
      currentCollection: '',
      collections: [],
      icons: {},
      searchValue: ''
    })

    const collection = {
      list: async () => {
        const result = await getIconCollections()
        state.collections = result || []

        window.localStorage.setItem('icons', JSON.stringify(result || []))

        state.collections.forEach((item) => {
          addCollection(item)

          for (let key in item.icons) {
            item.icons[key].key = `${item.prefix}:${key}`
          }

          item.samples = Object.values(item.icons).slice(0, 6)
        })
      },
      create: async () => {
        await createIconCollection()
      },
      remove: async () => {
        await removeIconCollection()
      },
      import: async () => {
        await importIconCollection()
      }
    }
    const icon = {
      create: async () => {
        await importIcon()
      },
      remove: async () => {
        await removeIcon()
      }
    }

    /* 图标列表无限滚动 */
    const filteredItems = computed(() => {
      const list = Object.values(state.icons)
      const icons = state.currentCollection
        ? list.filter((name) => (state.searchValue ? name.includes(state.searchValue.toLowerCase()) : true))
        : list
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

      if (sechema?.componentName !== 'Icon') return

      setProp('name', data.props.name)
      setProp('icon', data.props.name)

      refreshIcons()
    }

    const searchIcons = async () => {
      if (state.currentCollection) return

      state.icons = []
      state.showIcons = true

      // const result = await queryIconify({ query: state.searchValue })

      // state.icons = result.icons;
    }

    const openIconCollection = async (collection) => {
      state.currentCollection = collection.prefix
      state.showIcons = true
      state.icons = collection.icons
    }

    const closeIconCollection = () => {
      state.currentCollection = ''
      state.showIcons = false
      state.icons = []
    }

    const createCollectionComplete = () => {
      state.showCreateCollection = false
      collection.list()
    }
    const createIconComplete = () => {
      state.showCreateIcon = false

      refreshIcons()
    }

    onMounted(() => {
      collection.list()
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
      componentClick,
      collection,
      icon,
      createCollectionComplete,
      createIconComplete
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
