import { Notify } from '@opentiny/vue'
import { parseData } from '../data-function'
import type { JSFunction } from '../../types/index.ts'
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onActivated,
  onDeactivated
} from 'vue'

const executeUserLifecycle = (hookName: string, lifeCycleConfig: JSFunction | undefined, context: any) => {
  if (!lifeCycleConfig || lifeCycleConfig.type !== 'JSFunction') {
    return
  }

  try {
    const fn = parseData(lifeCycleConfig, {}, context)
    if (typeof fn === 'function') {
      fn.call(context, context)
    }
  } catch (error) {
    Notify({
      type: 'warning',
      title: `${hookName} 生命周期执行失败`,
      message: (error as any)?.message || `${hookName} 生命周期函数执行报错，请检查语法`
    })
  }
}
export function registerLifecycleHooks(lifeCycles: any, context: any) {
  // 注册生命周期钩子
  if (lifeCycles?.setup) {
    executeUserLifecycle('setup', lifeCycles?.setup, context)
  }

  if (lifeCycles?.onBeforeMount) {
    onBeforeMount(() => {
      executeUserLifecycle('onBeforeMount', lifeCycles.onBeforeMount, context)
    })
  }

  if (lifeCycles?.onMounted) {
    onMounted(() => {
      executeUserLifecycle('onMounted', lifeCycles.onMounted, context)
    })
  }

  if (lifeCycles?.onBeforeUpdate) {
    onBeforeUpdate(() => {
      executeUserLifecycle('onBeforeUpdate', lifeCycles.onBeforeUpdate, context)
    })
  }

  if (lifeCycles?.onUpdated) {
    onUpdated(() => {
      executeUserLifecycle('onUpdated', lifeCycles.onUpdated, context)
    })
  }

  if (lifeCycles?.onBeforeUnmount) {
    onBeforeUnmount(() => {
      executeUserLifecycle('onBeforeUnmount', lifeCycles.onBeforeUnmount, context)
    })
  }

  if (lifeCycles?.onUnmounted) {
    onUnmounted(() => {
      executeUserLifecycle('onUnmounted', lifeCycles.onUnmounted, context)
    })
  }

  if (lifeCycles?.onErrorCaptured) {
    onErrorCaptured((_error, _instance, _info) => {
      executeUserLifecycle('onErrorCaptured', lifeCycles.onErrorCaptured, context)
      return true
    })
  }

  if (lifeCycles?.onActivated) {
    onActivated(() => {
      executeUserLifecycle('onActivated', lifeCycles.onActivated, context)
    })
  }

  if (lifeCycles?.onDeactivated) {
    onDeactivated(() => {
      executeUserLifecycle('onDeactivated', lifeCycles.onDeactivated, context)
    })
  }
}
