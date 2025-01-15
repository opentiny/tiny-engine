<template>
  <div id="canvas-route-bar" :style="sizeStyle">
    <div class="address-bar">
      <template v-for="route in routes" :key="route.id">
        <span class="slash">/</span>
        <span :class="[{ route: route.isPage && route.id !== pageId }]" @click="handleClickRoute(route)">{{
          route.route
        }}</span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { getMetaApi, META_SERVICE, useLayout, useMessage, usePage } from '@opentiny/tiny-engine-meta-register'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const sizeStyle = computed(() => {
  const { width } = useLayout().getDimension()
  return { width }
})

const { pageSettingState, getAncestors, switchPageWithConfirm } = usePage()

const pageId = ref(getMetaApi(META_SERVICE.GlobalService).getBaseInfo().pageId)

const { subscribe, unsubscribe } = useMessage()

let subscriber = null

onMounted(() => {
  subscriber = subscribe({
    topic: 'locationHistoryChanged',
    callback: (data) => {
      if (data.pageId) {
        pageId.value = data.pageId
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
 */

/** @type {import('vue').Ref<Route[]>} */
const routes = ref([])

watch(
  pageId,
  async (value) => {
    if (!value) {
      routes.value = []
      return
    }
    const ancestors = (await getAncestors(value, true)) || []

    routes.value = ancestors
      .concat(value)
      .map((id) => pageSettingState.treeDataMapping[id])
      .filter((item) => Boolean(item))
      .map((pageData) => {
        const { id, route, isPage } = pageData
        return {
          id,
          route: route
            .replace(/\/+/g, '/') // 替换连续的 '/' 为单个 '/'
            .replace(/^\/|\/$/g, ''), // 去掉开头和结尾的 '/'
          isPage
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
</style>
