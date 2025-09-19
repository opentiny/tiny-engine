import * as Y from 'yjs'

const UNDEFINED_PLACEHOLDER = '__undefined__'

/**
 * 将普通对象/数组递归转换成 Yjs 对象
 * @param target Y.Map 或 Y.Array
 * @param obj 要转换的对象
 */
export function toYjs(target: Y.Map<any> | Y.Array<any>, obj: any) {
  if (Array.isArray(obj)) {
    // target 必须是 Y.Array
    if (!(target instanceof Y.Array)) throw new Error('Expected Y.Array for array input')

    obj.forEach((item) => {
      if (item === undefined) {
        target.push([UNDEFINED_PLACEHOLDER])
      } else if (item === null) {
        target.push([null])
      } else if (Array.isArray(item)) {
        const childArr = new Y.Array()
        toYjs(childArr, item)
        target.push([childArr])
      } else if (typeof item === 'object') {
        const childMap = new Y.Map()
        toYjs(childMap, item)
        target.push([childMap])
      } else {
        target.push([item])
      }
    })
  } else if (obj && typeof obj === 'object') {
    // target 必须是 Y.Map
    if (!(target instanceof Y.Map)) throw new Error('Expected Y.Map for object input')

    Object.entries(obj).forEach(([key, val]) => {
      if (val === undefined) {
        target.set(key, UNDEFINED_PLACEHOLDER)
      } else if (val === null) {
        target.set(key, null)
      } else if (Array.isArray(val)) {
        const yArr = new Y.Array()
        target.set(key, yArr) // 先 set 到父节点
        toYjs(yArr, val) // 再递归写入
      } else if (typeof val === 'object') {
        const yMap = new Y.Map()
        target.set(key, yMap) // 先 set 到父节点
        toYjs(yMap, val)
      } else {
        target.set(key, val)
      }
    })
  }
}

// 将 Yjs Map 转回普通对象（递归）
export function fromYjs(value: any): any {
  if (value instanceof Y.Map) {
    const obj: any = {}
    value.forEach((v, k) => {
      obj[k] = fromYjs(v)
    })
    return obj
  } else if (value instanceof Y.Array) {
    return value.toArray().map((item) => fromYjs(item))
  } else if (value instanceof Y.Text) {
    return value.toString()
  } else if (value === UNDEFINED_PLACEHOLDER) {
    return undefined // 还原 undefined
  } else {
    return value
  }
}

/**
 * 根据 fullpath 从嵌套对象/数组中取值
 * @param obj 根对象（普通 JSON 或 Y.Map.toJSON() 的结果）
 * @param path fullpath，如 ["children", 1, "props", "title"]
 * @returns 对应的值，如果不存在则返回 undefined
 */
export const getValueByPath = (obj: any, path: (string | number)[]): any => {
  return path.reduce((acc, key) => {
    if (acc) return undefined // 避免继续取值报错
    return acc[key]
  }, obj)
}

/**
 * 递归地净化一个从 Yjs 转换而来的 schema 对象。
 * 它会移除所有内部使用的键（如事件总线、元数据等）。
 * 同时，如果一个对象只剩下 { id }，则该对象整体移除。
 *
 * @param schema - 从 fromYjs() 得到的原始 schema 对象。
 * @param keysToFilter - 一个包含需要被移除的键名的数组。
 * @returns 一个只包含纯 UI 数据的、干净的 schema 对象。
 */
export function sanitizeSchema(schema: any, keysToFilter: string[]): any {
  if (typeof schema !== 'object' || schema === null) {
    return schema
  }

  // 如果对象被标记为软删除，则直接将整个对象过滤掉
  // 这是最优先的检查，因为如果节点被删除，就无需再处理它的子节点或属性
  if (schema._node_deleted === true) {
    return undefined // 返回 undefined，让上层调用者 (Array.filter) 将其移除
  }

  if (Array.isArray(schema)) {
    return schema.map((item) => sanitizeSchema(item, keysToFilter)).filter((item) => item !== undefined)
  }

  const sanitizedObject: { [key: string]: any } = {}
  const originalKeys = Object.keys(schema) // 保留原对象的键顺序
  for (const key of originalKeys) {
    if (keysToFilter.includes(key)) continue
    const child = sanitizeSchema(schema[key], keysToFilter)
    if (child !== undefined) {
      sanitizedObject[key] = child
    }
  }

  if (
    Object.keys(schema).length === 1 && // 原始对象只有一个键
    'id' in schema && // 这个键是 id
    !('id' in sanitizedObject) // 过滤后 id 不在了
  ) {
    return undefined
  }

  // 如果过滤后对象是空的，也直接返回 undefined（保证不会出现 {}）
  if (Object.keys(sanitizedObject).length === 0) {
    return undefined
  }

  return sanitizedObject
}
