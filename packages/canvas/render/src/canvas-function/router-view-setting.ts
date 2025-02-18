import { onUnmounted, reactive, watch } from 'vue'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL, CANVAS_ROUTER_VIEW_SETTING_VIEW_MODE_KEY } = constants

export enum ViewMode {
  EMBEDDED = 'embedded',
  STANDALONE = 'standalone'
}
export interface IRouterViewSetting {
  viewMode: ViewMode
}

function getCacheValue() {
  const value = localStorage.getItem(CANVAS_ROUTER_VIEW_SETTING_VIEW_MODE_KEY)
  if (!(Object.values(ViewMode) as string[]).includes(value)) {
    return ViewMode.EMBEDDED
  }
  return value as ViewMode
}

export function useRouterViewSetting() {
  const routerViewSetting = reactive<IRouterViewSetting>({
    viewMode: getCacheValue()
  })

  const { data, close } = useBroadcastChannel<IRouterViewSetting, IRouterViewSetting>({
    name: BROADCAST_CHANNEL.CanvasRouterViewSetting
  })

  watch(data, () => {
    routerViewSetting.viewMode = data.value.viewMode
  })

  onUnmounted(() => {
    close()
  })

  return {
    routerViewSetting
  }
}
