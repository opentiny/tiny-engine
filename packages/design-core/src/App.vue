<template>
  <component
    :is="TinyLayout"
    :registry="registry"
    :materials="materials"
    :render-panel="plugins.render"
    @pluginClick="toggleNav"
  ></component>
</template>

<script>
import { reactive, watch, onUnmounted } from 'vue'
import { getMergeRegistry } from '@opentiny/tiny-engine-entry'
import {
  useCanvas,
  useLayout,
  useResource,
  useModal,
  useEditorInfo,
  useApp,
  useNotify
} from '@opentiny/tiny-engine-controller'
import AppManage from '@opentiny/tiny-engine-plugin-page'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import blockPlugin from '@opentiny/tiny-engine-plugin-block'
import materials from '@opentiny/tiny-engine-plugin-materials'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

const { message } = useModal()
const { requestInitBlocks } = blockPlugin.api
const { fetchGroups } = materials.api
const { BROADCAST_CHANNEL } = constants

export default {
  name: 'TinyLowCode',
  provide() {
    return {
      editor: this
    }
  },
  setup() {
    const { layoutState } = useLayout()
    const { plugins } = layoutState
    const registry = getMergeRegistry()
    const TinyLayout = registry.layout.component

    const state = reactive({
      globalClass: '',
      rightWidth: '',
      leftWidfth: '',
      preNode: AppManage,
      jsClose: null
    })

    // 此处接收画布内部的错误和警告提示
    const { data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

    watch(data, (options) => useNotify(options))

    watch(
      () => state.jsClose,
      () => {
        if (state.preNode) {
          plugins.render = state.preNode.id
        }
      }
    )

    const toggleNav = ({ item, navLists }) => {
      if (navLists) state.preNode = navLists

      if (!item.id) return

      plugins.render = plugins.render === item.id ? null : item.id
    }

    useEditorInfo().getUserInfo()

    watch(
      useCanvas().isCanvasApiReady,
      (ready) => {
        if (ready) {
          useResource().fetchResource()
        }
      },
      {
        immediate: true
      }
    )

    const handlePopStateEvent = () => {
      useResource().handlePopStateEvent()
    }

    window.addEventListener('popstate', handlePopStateEvent)

    if (isVsCodeEnv) {
      const appId = useApp().appInfoState.selectedId
      fetchGroups(appId)
        .then((groups) => {
          const blocks = []
          groups.forEach((group) => {
            blocks.push(...group.blocks)
          })
          requestInitBlocks(blocks)
        })
        .catch((error) => {
          message({ message: error.message, status: 'error' })
        })
    }

    onUnmounted(() => {
      window.removeEventListener('popstate', handlePopStateEvent)
    })

    return {
      state,
      plugins,
      toggleNav,
      layoutState,
      materials,
      registry,
      TinyLayout
    }
  }
}
</script>
