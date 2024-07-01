<template>
  <component :is="registry.layout.component" :registry="registry"></component>
</template>

<script>
import { watch, onUnmounted } from 'vue'
import {
  getMergeRegistry,
  getPluginApi,
  useModal,
  useApp,
  useNotify,
  useResource,
  useCanvas
} from '@opentiny/tiny-engine-meta-register'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL } = constants
const { message } = useModal()

export default {
  setup() {
    const registry = getMergeRegistry()
    const materialsApi = getPluginApi('engine.plugins.materials')
    const blockApi = getPluginApi('engine.plugins.blockmanage')

    // 此处接收画布内部的错误和警告提示
    const { data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

    watch(data, (options) => useNotify(options))

    if (isVsCodeEnv) {
      const appId = useApp().appInfoState.selectedId
      materialsApi
        .fetchGroups(appId)
        .then((groups) => {
          const blocks = []
          groups.forEach((group) => {
            blocks.push(...group.blocks)
          })
          blockApi.requestInitBlocks(blocks)
        })
        .catch((error) => {
          message({ message: error.message, status: 'error' })
        })
    }

    const handlePopStateEvent = () => {
      useResource().handlePopStateEvent()
    }

    window.addEventListener('popstate', handlePopStateEvent)

    onUnmounted(() => {
      window.removeEventListener('popstate', handlePopStateEvent)
    })

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

    return {
      registry
    }
  }
}
</script>
