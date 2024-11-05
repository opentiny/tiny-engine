<template>
  <component :is="registry.layout.component" :registry="registry"></component>
</template>

<script>
import { watch, onUnmounted } from 'vue'
import {
  getMergeRegistry,
  getMetaApi,
  useModal,
  useNotify,
  useResource,
  useCanvas,
  useMessage
} from '@opentiny/tiny-engine-meta-register'
import { isVsCodeEnv } from '@opentiny/tiny-engine-common/js/environments'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL } = constants

export default {
  setup() {
    const { message } = useModal()
    const registry = getMergeRegistry()
    const materialsApi = getMetaApi('engine.plugins.materials')
    const blockApi = getMetaApi('engine.plugins.blockmanage')

    // 此处接收画布内部的错误和警告提示
    const { data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

    watch(data, (options) => useNotify(options))

    if (isVsCodeEnv) {
      useMessage().subscribe({
        topic: 'app_id_changed',
        callback: (appId) => {
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
