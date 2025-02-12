<template>
  <div id="canvas-route-bar" :style="sizeStyle">
    <div class="address-bar">
      <template v-for="route in routes" :key="route.id">
        <span class="slash">/</span>
        <span
          :class="[
            {
              route: route.isPage && route.id !== pageId,
              current: route.id === pageId && existsPreview,
              'is-preview': route.isPreview
            }
          ]"
          @click="handleClickRoute(route)"
          >{{ route.route }}</span
        >
      </template>
      <tiny-tooltip v-if="existsPreview" type="normal" content="重置路由视图显示页面">
        <svg-button name="cross" class="clear-preview" @click="handleClearPreview"></svg-button>
      </tiny-tooltip>
    </div>
  </div>
</template>

<script setup>
import { SvgButton } from '@opentiny/tiny-engine-common'
import { getMetaApi, META_SERVICE, useLayout, useMessage, usePage } from '@opentiny/tiny-engine-meta-register'
import { Tooltip as TinyTooltip } from '@opentiny/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const sizeStyle = computed(() => {
  const { width } = useLayout().getDimension()
  return { width }
})

const { pageSettingState, getAncestors, switchPageWithConfirm } = usePage()

const baseInfo = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
const pageId = ref(baseInfo.pageId)
const previewId = ref(baseInfo.previewId)
const existsPreview = ref(false)

const { subscribe, unsubscribe } = useMessage()

let subscriber = null

onMounted(() => {
  subscriber = subscribe({
    topic: 'locationHistoryChanged',
    callback: (data) => {
      if (data.pageId) {
        pageId.value = String(data.pageId)
      }
      if ('previewId' in data) {
        previewId.value = String(data.previewId)
      }
    },
    subscriber: 'routeBar'
  })
})

onUnmounted(() => {
  if (subscriber) {
    unsubscribe(subscriber)
  }
})

/**
 * @typedef {Object} Route
 * @property {string | number} id
 * @property {string} route
 * @property {boolean} isPage
 * @property {boolean} isPreview
 */

/** @type {import('vue').Ref<Route[]>} */
const routes = ref([])

watch(
  [pageId, previewId],
  async ([pageId, previewId]) => {
    if (!pageId) {
      routes.value = []
      return
    }

    let ancestors = ((await getAncestors(pageId, true)) || []).concat(pageId).map((id) => String(id))

    if (previewId) {
      const previewAncestors = ((await getAncestors(previewId, true)) || []).concat(previewId).map((id) => String(id))

      // previewId是pageId的子孙，那么previewId才有效
      if (previewAncestors.includes(pageId)) {
        ancestors = previewAncestors
      }
    }

    // currentPageIndex逻辑上不可能为-1，所以后续判断位于数组的位置时，不再需要判断是否为-1
    const currentPageIndex = ancestors.indexOf(pageId)

    // 如果当前编辑页面不是ancestors数组最后一个元素，说明存在preview页面
    existsPreview.value = currentPageIndex < ancestors.length - 1

    routes.value = ancestors
      .map((id) => pageSettingState.treeDataMapping[id])
      .map((pageData, index) => {
        const { id, route, isPage } = pageData
        return {
          id: String(id),
          route: route
            .replace(/\/+/g, '/') // 替换连续的 '/' 为单个 '/'
            .replace(/^\/|\/$/g, ''), // 去掉开头和结尾的 '/'
          isPage,
          isPreview: index > currentPageIndex
        }
      })
  },
  { immediate: true }
)

/**
 * @param route {Route}
 */
const handleClickRoute = (route) => {
  if (!route.isPage) {
    return
  }
  switchPageWithConfirm(route.id)
}

const handleClearPreview = () => {
  getMetaApi(META_SERVICE.GlobalService).updatePreviewId('')
}
</script>

<style lang="less" scoped>
#canvas-route-bar {
  position: absolute;
  top: 18px;
  height: 32px;
  max-width: 100%;
  background-color: var(--te-common-bg-prompt);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
}
.address-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: var(--te-common-bg-container);
  height: 20px;
  width: 100%;
  border-radius: 999px;
  padding: 0 10px;
  cursor: default;
}
.route {
  cursor: pointer;
  &:hover {
    text-decoration: underline;
    color: var(--te-common-text-link);
  }
}
.slash {
  margin: 0 2px;
}
.current {
  font-weight: bold;
}
.is-preview {
  color: var(--te-common-text-weaken);
}
#canvas-route-bar:hover .clear-preview {
  visibility: unset;
}
.clear-preview {
  border-radius: 999px;
  visibility: hidden;
  margin-left: 2px;
  width: 16px;
  height: 16px;
  font-size: 12px;
}
</style>
