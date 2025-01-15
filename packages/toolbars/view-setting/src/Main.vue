<template>
  <toolbar-base
    :content="`切换到${nextViewMode.label}`"
    :icon="options.icon.default || options.icon"
    :options="options"
    @click-api="changeViewMode"
  >
  </toolbar-base>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useBroadcastChannel } from '@vueuse/core'
import { ToolbarBase } from '@opentiny/tiny-engine-common'

import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL, CANVAS_ROUTER_VIEW_SETTING_VIEW_MODE_KEY } = constants

function getCacheValue() {
  const value = localStorage.getItem(CANVAS_ROUTER_VIEW_SETTING_VIEW_MODE_KEY)
  if (!['embedded', 'standalone'].includes(value)) {
    return 'embedded'
  }
  return value
}
function setCacheValue(value) {
  localStorage.setItem(CANVAS_ROUTER_VIEW_SETTING_VIEW_MODE_KEY, value)
}

export default {
  components: {
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const viewMode = ref(getCacheValue())
    const { post, data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.CanvasRouterViewSetting })
    watch(data, () => {
      viewMode.value = data.value
    })

    const viewModeOptions = [
      {
        value: 'embedded',
        label: '嵌套视图'
      },
      {
        value: 'standalone',
        label: '单页视图'
      }
    ]

    const nextViewMode = computed(
      () => viewModeOptions.find(({ value }) => value !== viewMode.value) || viewModeOptions[1]
    )

    const changeViewMode = () => {
      viewMode.value = viewMode.value === viewModeOptions[0].value ? viewModeOptions[1].value : viewModeOptions[0].value
      setCacheValue(viewMode.value)
      post({ viewMode: viewMode.value })
    }
    return {
      viewModeOptions,
      viewMode,
      changeViewMode,
      nextViewMode
    }
  }
}
</script>
