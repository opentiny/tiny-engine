import { ref } from 'vue'

const designerGlobalState = ref<any>(null)

export const initRuntimeChannel = () => {
  const handler = (event: MessageEvent) => {
    const parsedHost = new URL(window.location.href)
    const parsedOrigin = new URL(event.origin)
    if (parsedOrigin.origin !== parsedHost.origin && parsedOrigin.host !== parsedHost.host) return

    const { source, type, data } = event.data || {}
    if (source === 'designer' && type === 'globalState' && designerGlobalState.value === null) {
      designerGlobalState.value = Array.isArray(data) ? [...data] : data
      window.removeEventListener('message', handler)
    }
  }

  window.addEventListener('message', handler)
}

export const getDesignerGlobalState = () => designerGlobalState.value
