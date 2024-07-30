import { reactive, readonly } from 'vue'
import { metaHashMap } from './common'

/**
 * @template T
 * @template K
 * @typedef {Object} Context
 * @property {K} options
 * @property {(import 'vue').DeepReadonly<(import 'vue').UnwrapNestedRefs<T>>} state
 * @property {(value: Partial<T>) => void} setState
 */

/**
 * @template T
 * @template K
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} type
 * @property {K} options
 * @property {Record<string, any> | (context: Context<T, K>) => Record<string, any>} apis
 * @property {T} initialState
 * @property {(context: Context<T, K>) => void} init
 * @property {(context: Context<T, K>) => void} start
 */

/**
 * @template T
 * @template K
 * @param {Service<T, K>} service
 * @returns {Service<T, K>}
 */
export const defineService = (service) => {
  const { initialState, options, init, start } = service

  const state = reactive(initialState)
  const setState = (kv) => {
    Object.assign(state, kv)
  }

  if (typeof service.apis === 'function') {
    service.apis = service.apis({ state, setState, options })
  }

  if (typeof service.apis !== 'object' || service.apis === null) {
    service.apis = {}
  }

  Object.assign(service.apis, {
    getState: () => readonly(state),
    setState
  })

  Object.assign(service, {
    _init: () => {
      init({ state, setState, options })
    },
    _start: () => {
      start({ state, setState, options })
    }
  })

  return service
}

export const initServices = () => {
  const services = Object.values(metaHashMap).filter((service) => service.type === 'MetaService')

  services.filter((service) => typeof service.init === 'function').forEach((service) => service._init())
  services.filter((service) => typeof service.start === 'function').forEach((service) => service._start())
}
