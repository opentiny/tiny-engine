import { reactive, readonly } from 'vue'
import { metaHashMap } from './common'

/**
 * @template T
 * @template K
 * @typedef {Object} Context
 * @property {K} options
 * @property {(import 'vue').UnwrapNestedRefs<T>} state
 */

/**
 * @template T
 * @template K
 * @typedef {Object} ServiceOptions
 * @property {string} id
 * @property {'MetaService'} type
 * @property {T} initialState
 * @property {K} options
 * @property {(context: Context<T, K>) => void} init
 * @property {(context: Context<T, K>) => void} start
 * @property {Record<string, any> | (context: Context<T, K>) => Record<string, any>} apis
 */

/**
 * @template T
 * @template K
 * @typedef {()=> (import 'vue').DeepReadonly<(import 'vue').UnwrapNestedRefs<T>>} GetState
 * @typedef {(kv: Partial<T>) => void} SetState
 * @typedef {Pick<ServiceOptions<T, K>, 'id' | 'type' | 'options'> & {
 *   apis: { getState: GetState; setState: SetState } & Record<string, Function>
 * }} Service
 */

/**
 * @template T
 * @template K
 * @param {ServiceOptions<T, K>} service
 * @returns {Service<T, K>}
 */
export const defineService = (service) => {
  const { initialState, options, init, start } = service

  const state = reactive(initialState || {})

  if (typeof service.apis === 'function') {
    service.apis = service.apis({ state, options })
  }

  if (typeof service.apis !== 'object' || service.apis === null) {
    service.apis = {}
  }

  Object.assign(service.apis, {
    getState: () => readonly(state),
    setState: (kv) => {
      Object.assign(state, kv)
    }
  })

  Object.assign(service, {
    _init: () => {
      init({ state, options: options || {} })
    },
    _start: () => {
      start({ state, options: options || {} })
    }
  })

  return service
}

export const initServices = () => {
  const services = Object.values(metaHashMap).filter((service) => service.type === 'MetaService')

  services.filter((service) => typeof service.init === 'function').forEach((service) => service._init())
  services.filter((service) => typeof service.start === 'function').forEach((service) => service._start())
}
