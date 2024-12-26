import { reset } from '../data-utils'

export function useBridge() {
  const bridge = {}
  const setBridge = (data, clear = false) => {
    clear && reset(bridge)
    Object.assign(bridge, data)
  }

  const getBridge = () => bridge
  return {
    bridge,
    setBridge,
    getBridge
  }
}
