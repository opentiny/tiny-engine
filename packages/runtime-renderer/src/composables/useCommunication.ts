import { ref } from 'vue'

const designerGlobalState = ref<any>(null)
const designerPkgDeps = ref<any>(null)
const designerStylesDeps = ref<any>(null)

export const initRuntimeChannel = () => {
  return new Promise((resolve, reject) => {
    // 向设计器发送连接消息
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            source: 'runtime',
            event: 'connect'
          },
          '*'
        )
      } catch (error) {
        reject(error)
        return
      }
    }

    // 设置超时，避免无限等待
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for globalState'))
    }, 10000)

    const handler = (event: MessageEvent) => {
      // 更宽松的源检查，允许同域不同端口的通信
      const parsedOrigin = new URL(event.origin)
      const currentOrigin = new URL(window.location.origin)

      if (parsedOrigin.origin !== currentOrigin.origin) {
        // eslint-disable-next-line no-console
        console.log('Message origin mismatch:', event.origin, window.location.origin)
        return
      }

      const { source, type, data } = event.data || {}

      if (source === 'designer' && type === 'globalDeps' && designerGlobalState.value === null) {
        try {
          designerGlobalState.value = JSON.parse(JSON.stringify(data.globalState))
          designerPkgDeps.value = JSON.parse(JSON.stringify(data.pkgDeps))
          designerStylesDeps.value = JSON.parse(JSON.stringify(data.stylesDeps))

          clearTimeout(timeout)
          window.removeEventListener('message', handler)

          // 解决 Promise
          resolve(designerGlobalState.value)
        } catch (error) {
          clearTimeout(timeout)
          window.removeEventListener('message', handler)
          reject(error)
        }
      }
    }

    window.addEventListener('message', handler)
  })
}

export const getDesignerGlobalState = () => designerGlobalState.value
export const getDesignerPkgDeps = () => designerPkgDeps.value
export const getDesignerStylesDeps = () => designerStylesDeps.value
