import { ref } from 'vue'

const designerGlobalState = ref<any>(null)

export const initRuntimeChannel = () => {
  const handler = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return

    const { source, type, data } = event.data || {}
    if (source === 'designer' && type === 'globalState' && designerGlobalState.value === null) {
      designerGlobalState.value = JSON.parse(JSON.stringify(data))
      window.removeEventListener('message', handler)
    }
  }

  window.addEventListener('message', handler)
}

export const getDesignerGlobalState = () => designerGlobalState.value
