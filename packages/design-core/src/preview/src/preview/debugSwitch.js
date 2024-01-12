import { ref, provide, inject } from 'vue'
export const debuggerSwitchTokenKey = Symbol('tiny-engine-preview-debug-switch')
export function useDebugSwitch() {
  const debugSwitch = ref(false)
  provide(debuggerSwitchTokenKey, debugSwitch)
  return debugSwitch
}
export function injectDebugSwitch() {
  return inject(debuggerSwitchTokenKey)
}
