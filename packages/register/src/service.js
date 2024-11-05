import { reactive, readonly } from 'vue'
import { metaHashMap } from './common'

/**
 * @template T
 * @template K
 * @typedef {Object} Context
 * @property {(import 'vue').UnwrapNestedRefs<T>} state
 * @property {K} options
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
 * @property {Record<string, Function> | (context: Context<T, K>) => Record<string, Function>} apis
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
 * @type {WeakMap<Service<T, K>, {state: T} & Pick<ServiceOptions<T, K>, 'init'>>}
 */
const servicesMap = new WeakMap()

/**
 * @template T
 * @template K
 * @param {ServiceOptions<T, K>} serviceOptions
 * @returns {Service<T, K>}
 */
export const defineService = (serviceOptions) => {
  const { id, type, initialState, options, init, apis } = serviceOptions

  if (!id || !type) {
    throw new Error('Service id and type are required')
  }

  if (type !== 'MetaService') {
    throw new Error('Invalid service type. Expected: MetaService')
  }

  /**
   * @type {Service<T, K>}
   */
  const resultService = {
    id,
    type,
    options,
    apis: {}
  }

  const state = reactive(initialState || {})

  if (typeof apis === 'object' && apis) {
    resultService.apis = apis
  } else if (typeof apis === 'function') {
    resultService.apis = apis({ state })
  }

  resultService.apis.getState = () => readonly(state)
  resultService.apis.setState = (kv) => {
    Object.assign(state, kv)
  }

  servicesMap.set(resultService, {
    state,
    init: typeof init === 'function' ? init : () => {}
  })

  return resultService
}

export const initServices = () => {
  const services = Object.values(metaHashMap).filter((service) => service.type === 'MetaService')

  services.forEach((service) => {
    const context = servicesMap.get(service)
    if (context) {
      const { state, init } = context
      const { options } = service
      init({ state, options })
    }
  })
}
