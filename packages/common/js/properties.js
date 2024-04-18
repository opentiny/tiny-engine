import { useCanvas } from '@opentiny/tiny-engine-controller'
import { isEmptyObject } from '@opentiny/vue-renderless/common/type'
import { nextTick } from 'vue'

export const getPropertyItem = (propertyName, properties) => {
  const { pageState } = useCanvas()

  if (!properties) {
    properties = pageState.properties
  }
  let propertyItem = null
  properties.some((property) => {
    return property.content.some((item) => {
      if (item.property === propertyName) {
        propertyItem = item
        return true
      }
      if (item.properties) {
        propertyItem = getPropertyItem(propertyName, item.properties)
        return propertyItem
      }
      return false
    })
  })
  return propertyItem
}

/**
 * 判断传入的值是否可以过滤
 * @param {any} value
 * @param {boolean} keepRef 是否过滤空数组或空对象，默认false
 * @returns boolean
 */
export const isOmitValue = (value, keepRef = false) => {
  if (Array.isArray(value) && value.length === 0 && !keepRef) {
    return true
  }
  if (typeof value === 'object' && isEmptyObject(value) && !keepRef) {
    return false
  }

  return ['', null, undefined].includes(value)
}

/**
 * 过滤对象属性、数组的空值
 * 过滤的空值包括： []、{}、''、null、undefined
 * @param {object | Array<any>} obj
 * @param {{deep: boolean; keepRef: boolean}} deep 是否深度过滤，默认true
 * @returns 过滤的对象
 */
export const delNullKey = (obj = {}, options = {}) => {
  if (!(obj instanceof Object)) {
    return obj
  }

  const { deep = true, keepRef = false } = options
  if (Array.isArray(obj)) {
    return obj.map((item) => delNullKey(item, deep)).filter((value) => !isOmitValue(value))
  }

  const newObj = {}
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      const trimValue = deep ? delNullKey(value, deep, keepRef) : value
      if (!isOmitValue(trimValue, keepRef)) {
        newObj[key] = trimValue
      } else if (!isOmitValue(value)) {
        newObj[key] = value
      }
    }
  }
  return newObj
}

/**
 * get property value
 * @param {string} propertyName
 * @returns any
 */
export const getPropertyValue = (propertyName) => {
  const propertyItem = getPropertyItem(propertyName)
  return propertyItem?.widget?.props?.modelValue
}

/**
 * set property value
 * @param {string} propertyName
 * @param {any} value
 */
export const setPropertyValue = async (propertyName, value) => {
  const propertyItem = getPropertyItem(propertyName)
  if (propertyItem?.widget?.props) {
    await nextTick()
    propertyItem.widget.props.modelValue = value
  }
}

/**
 * get property props
 * @param {string} propertyName
 * @returns object
 */
export const getPropertyProps = (propertyName) => {
  const propertyItem = getPropertyItem(propertyName)
  return propertyItem?.widget?.props
}

/**
 * set property props
 * @param {string} propertyName
 * @param {object} props
 */
export const setPropertyProps = (propertyName, props = {}) => {
  const propertyItem = getPropertyItem(propertyName)
  if (propertyItem?.widget?.props) {
    const realProps = delNullKey(props, { deep: false, keepRef: true })
    if (!propertyItem?.widget?.props) {
      propertyItem.widget.props = {}
    }
    Object.assign(propertyItem.widget?.props, realProps)
  }
}

export const getPropertyHidden = (propertyName) => {
  const propertyItem = getPropertyItem(propertyName)
  return propertyItem?.hidden ?? false
}

export const setPropertyHidden = (propertyName, hidden) => {
  const propertyItem = getPropertyItem(propertyName)
  if (propertyItem) {
    propertyItem.hidden = Boolean(hidden)
  }
}
