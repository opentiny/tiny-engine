import { Notify } from '@opentiny/vue'

const durationMap = {
  info: 5000,
  success: 5000,
  warning: 10000,
  error: 10000
}

export interface NotifyOptions {
  [key: string]: any
  title?: string
  message: string
  type: keyof typeof durationMap
  customClass?: string
  position?: string
}

const useNotify = (config: NotifyOptions) => {
  const { customClass, title, type = 'info', position = 'top-right', ...otherConfig } = config

  Notify({
    duration: durationMap[type],
    ...otherConfig,
    position,
    title,
    type,
    customClass: `${customClass}`,
    verticalOffset: 46
  })
}

export default useNotify
