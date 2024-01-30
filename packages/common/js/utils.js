/**
 *
 * @description 合并默认值, 并返回一个新的对象. 但是不保证是深克隆
 * @template T
 * @param {T} obj
 * @param {T} defaultValue
 */
export const _default = (obj, defaultValue) => ({ ...defaultValue, ...obj })

/**
 * @description 深克隆一个对象
 * @param {T} obj
 * @returns {T}
 */
export const deepClone = (obj) => structuredClone(obj)

/**
 *
 * @param {T extends Function} fn
 * @param {number} delay
 * @returns {(...args:Parameters<T>)=>ReturnType<T>}
 */
export const Debounce = (fn, delay) => {
  let timer = null
  return () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn()
    }, delay)
  }
}
