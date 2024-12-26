import { h } from 'vue'
import { isHTMLTag, hyphenate } from '@vue/shared'
import * as TinyVueIcon from '@opentiny/vue-icon'
import { utils } from '@opentiny/tiny-engine-utils'
import { CanvasRow, CanvasCol, CanvasRowColContainer } from '@opentiny/tiny-engine-builtin-component'
import {
  CanvasBox,
  CanvasCollection,
  CanvasIcon,
  CanvasText,
  CanvasSlot,
  CanvasImg,
  CanvasPlaceholder,
  CanvasRouterView,
  CanvasRouterLink
} from '../builtin'
import { getController } from '../canvas-function/controller'
import { generateCollection } from './support-collection'

export const customElements = {}
export const Mapper = {
  Icon: CanvasIcon,
  Text: CanvasText,
  Collection: CanvasCollection,
  div: CanvasBox,
  Slot: CanvasSlot,
  slot: CanvasSlot,
  Template: CanvasBox,
  Img: CanvasImg,
  CanvasRow,
  CanvasCol,
  CanvasRowColContainer,
  CanvasPlaceholder,
  RouterView: CanvasRouterView,
  RouterLink: CanvasRouterLink
}
const getNative = (name) => {
  return window.TinyLowcodeComponent?.[name]
}

const getBlock = (name) => {
  return window.blocks?.[name]
}

const { hyphenateRE } = utils
const getPlainProps = (object: Record<string, any> = {}) => {
  const { slot, ...rest } = object
  const props = {}

  if (slot) {
    rest.slot = slot.name || slot
  }

  Object.entries(rest).forEach(([key, value]) => {
    let renderKey = key

    // html 标签属性会忽略大小写，所以传递包含大写的 props 需要转换为 kebab 形式的 props
    if (!/on[A-Z]/.test(renderKey) && hyphenateRE.test(renderKey)) {
      renderKey = hyphenate(renderKey)
    }

    if (['boolean', 'string', 'number'].includes(typeof value)) {
      props[renderKey] = value
    } else {
      // 如果传给webcomponent标签的是对象或者数组需要使用.prop修饰符，转化成h函数就是如下写法
      props[`.${renderKey}`] = value
    }
  })
  return props
}

const generateBlockContent = (schema) => {
  if (schema?.componentName === 'Collection') {
    generateCollection(schema)
  }
  if (Array.isArray(schema?.children)) {
    schema.children.forEach((item) => {
      generateBlockContent(item)
    })
  }
}
const registerBlock = (componentName) => {
  getController()
    .registerBlock?.(componentName)
    .then((res) => {
      const blockSchema = res.content

      // 拿到区块数据，建立区块中数据源的映射关系
      generateBlockContent(blockSchema)

      // 如果区块的根节点有百分比高度，则需要特殊处理，把高度百分比传递下去,适配大屏应用
      if (/height:\s*?[\d|.]+?%/.test(blockSchema?.props?.style)) {
        const blockDoms = document.querySelectorAll<HTMLElement>(hyphenate(componentName))
        blockDoms.forEach((item) => {
          item.style.height = '100%'
        })
      }
    })
}

export const wrapCustomElement = (componentName) => {
  const material = getController().getMaterial(componentName)

  if (!Object.keys(material).length) {
    registerBlock(componentName)
  }

  customElements[componentName] = {
    name: componentName + '.ce',
    render() {
      return h(
        hyphenate(componentName),
        window.parent.TinyGlobalConfig.dslMode === 'Vue' ? getPlainProps(this.$attrs) : this.$attrs,
        this.$slots.default?.()
      )
    }
  }

  return customElements[componentName]
}

export const getIcon = (name) => TinyVueIcon?.[name]?.() || ''

export const getComponent = (name) => {
  return (
    Mapper[name] ||
    getNative(name) ||
    getBlock(name) ||
    customElements[name] ||
    (isHTMLTag(name) ? name : wrapCustomElement(name))
  )
}
