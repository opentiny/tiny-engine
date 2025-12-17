import { reactive, readonly } from 'vue'
import { merge } from 'lodash-es'
import { metaHashMap } from './common'
import type { UnwrapNestedRefs, DeepReadonly } from 'vue'

interface Context<T, K> {
  state: UnwrapNestedRefs<T>
  options: K
}

export interface ServiceOptions<T, K> {
  id: string
  type: 'MetaService'
  initialState: T
  options: K
  init: (context: Context<T, K>) => void
  apis: Record<string, (...args: any[]) => any> | ((context: Context<T, K>) => Record<string, (...args: any[]) => any>)
}

type GetState<T> = () => DeepReadonly<UnwrapNestedRefs<T>>
type SetState<T> = (kv: Partial<T>) => void
type Service<T, K> = Pick<ServiceOptions<T, K>, 'id' | 'type' | 'options'> & {
  apis: { getState: GetState<T>; setState: SetState<T> } & Record<string, (...args: any[]) => any>
}

/**
 * @template T
 * @template K
 * @type {Map<Service<T, K>, {state: T} & Pick<ServiceOptions<T, K>, 'init'>>}
 */
const servicesMap = new Map()

export const defineService = <T, K>(serviceOptions: ServiceOptions<T, K>): Service<T, K> => {
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
  const resultService: Service<T, K> = {
    id,
    type,
    options,
    // 使用类型断言，因为 getState 和 setState 会在后面添加
    apis: {} as any
  }

  const state = reactive<any>(initialState || {})

  // 使用对象展开运算符合并 apis，避免直接赋值导致类型错误
  if (typeof apis === 'object' && apis) {
    resultService.apis = apis as any
  } else if (typeof apis === 'function') {
    // 传递完整的 context 对象，包含 state 和 options
    resultService.apis = apis({ state, options }) as any
  }

  resultService.apis.setOptions = (kv) => {
    resultService.options = merge({}, options, kv)
  }

  resultService.apis.getState = () => readonly(state)
  resultService.apis.setState = (kv) => {
    Object.assign(state, kv)
  }

  servicesMap.set(resultService.id, {
    state,
    init: typeof init === 'function' ? init : () => {}
  })

  return resultService
}

export const initServices = () => {
  const services = [...metaHashMap.values()].filter((service) => service.type === 'MetaService')

  services.forEach((service) => {
    const context = servicesMap.get(service.id)

    if (context) {
      const { state, init } = context
      const { options } = service
      init({ state, options })
    }
  })
}
