<template>
  <div>
    <component v-if="!needToLogin" :is="layoutRegistry.component"></component>
    <login v-else></login>
  </div>
</template>

<script>
import { watch, onUnmounted, computed } from 'vue'
import {
  getMetaApi,
  useModal,
  useNotify,
  useResource,
  useCanvas,
  useMessage,
  getMergeMeta,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { isVsCodeEnv } from '@opentiny/tiny-engine-common/js/environments'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
import Login from './login/Index.vue'

const { BROADCAST_CHANNEL } = constants

export default {
  components: {
    Login
  },
  setup() {
    const { message } = useModal()
    const layoutRegistry = getMergeMeta('engine.layout')
    const materialsApi = getMetaApi('engine.plugins.materials')
    const blockApi = getMetaApi('engine.plugins.blockmanage')
    const { getLoginStatus } = getMetaApi(META_SERVICE.GlobalService)
    const enableLogin = getMergeMeta('engine.config')?.enableLogin

    const needToLogin = computed(() => getLoginStatus() && enableLogin)

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
      needToLogin,
      layoutRegistry
    }
  }
}
</script>
