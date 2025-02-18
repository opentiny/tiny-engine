/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { defineComponent, render, nextTick, createVNode } from 'vue'
import { camelize, hyphenate, toNumber, extend, isArray } from '@vue/shared'

const BaseLowcodeClass = typeof HTMLElement !== 'undefined' ? HTMLElement : class {}

class LowcodeVueElement extends BaseLowcodeClass {
  constructor(_def, _props = {}) {
    super()
    this._def = _def
    this._props = _props

    /**
     *  @internal
     */
    this._numberProps = null
    this._cbConnected = false
    this._instance = null
    this._resolved = false

    this.attachShadow({ mode: 'open' })
  }

  disconnectedCallback() {
    this._cbConnected = false

    nextTick(() => {
      if (!this._cbConnected) {
        render(null, this.shadowRoot)
        this._instance = null
      }
    })
  }

  connectedCallback() {
    this._cbConnected = true

    if (!this._instance) {
      this._resolveLowcodeDef()
    }
  }

  _resolveLowcodeDef() {
    if (this._resolved) {
      return
    }

    this._resolved = true

    const attributes = [...this.attributes]

    attributes.forEach(({ name }) => {
      this._setAttr(name)
    })

    new MutationObserver((mutations) => {
      for (const m of mutations) {
        this._setAttr(m.attributeName)
      }
    }).observe(this, { attributes: true })

    const resolve = (def) => {
      const { props, styles, links } = def
      const hasOptions = props && !isArray(props)
      const realProps = hasOptions ? Object.keys(props) : props
      const propsKeys = props ? realProps : []
      let numberProps

      if (hasOptions) {
        for (const key in this._props) {
          if (Object.prototype.hasOwnProperty.call(this._props, key)) {
            const opt = props[key]

            if (opt === Number || (opt && opt.type === Number)) {
              this._props[key] = toNumber(this._props[key])
              ;(numberProps || (numberProps = Object.create(null)))[key] = true
            }
          }
        }
      }

      this._numberProps = numberProps

      for (const key of Object.keys(this)) {
        if (key[0] !== '_') {
          this._setProp(key, this[key], true, false)
        }
      }

      for (const key of propsKeys.map(camelize)) {
        Object.defineProperty(this, key, {
          get() {
            return this._getDefProp(key)
          },
          set(value) {
            this._setProp(key, value)
          }
        })
      }

      this._addStyles(styles)
      this._applyLinks(links)
      this._update()
    }

    const asyncDef = this._def.__asyncLoader

    if (asyncDef) {
      asyncDef().then(resolve)
    } else {
      resolve(this._def)
    }
  }

  _setAttr(key) {
    let value = this.getAttribute(key)

    if (this._numberProps && this._numberProps[key]) {
      value = toNumber(value)
    }

    this._setProp(camelize(key), value, false)
  }

  /**
   * @internal
   */
  _getDefProp(key) {
    return this._props[key]
  }

  _setProp(key, value, shouldReflect = true, shouldUpdate = true) {
    if (value !== this._props[key]) {
      if (value === 'true') {
        value = true
      }
      if (value === 'false') {
        value = false
      }

      this._props[key] = value

      if (shouldUpdate && this._instance) {
        this._update()
      }

      // reflect
      if (shouldReflect) {
        if (value === true) {
          this.setAttribute(hyphenate(key), '')
        } else if (typeof value === 'string' || typeof value === 'number') {
          this.setAttribute(hyphenate(key), String(value))
        } else if (!value) {
          this.removeAttribute(hyphenate(key))
        }
      }
    }
  }

  _setProps(props, shouldReflect = true, shouldUpdate = true) {
    let bChange = false

    Object.entries(props).forEach(([key, value]) => {
      if (value !== this._props[key]) {
        bChange = true

        this._setProp(key, value, shouldReflect, false)
      }
    })

    if (bChange && shouldUpdate && this._instance) {
      this._update()
    }
  }

  _update() {
    render(this._createLowcodeVNode(), this.shadowRoot)
  }

  _createLowcodeVNode() {
    const vnode = createVNode(this._def, extend({}, this._props))

    if (!this._instance) {
      const dom = this

      vnode.ce = (instance) => {
        this._instance = instance
        instance.isCE = true
        // HMR
        instance.ceReload = (styles) => {
          if (this._styles) {
            this._styles.forEach((s) => this.shadowRoot.removeChild(s))
            this._styles.length = 0
          }
          this._addStyles(styles)
          if (!this._def.__asyncLoader) {
            this._instance = null
            this._update()
          }
        }
        instance.emit = (event, ...args) => {
          this.dispatchEvent(
            new CustomEvent(event, {
              detail: args
            })
          )
        }
        instance.updateProp = (key, value) => {
          dom[key] = value
          dom._props[key] = value
          instance.attrs[key] = value
        }
        instance.domProps = dom._props
        let parent = this

        while ((parent = parent && (parent.parentNode || parent.host))) {
          if (parent instanceof LowcodeVueElement) {
            instance.parent = parent._instance

            break
          }
        }
      }
    }
    return vnode
  }

  _addStyles(styles) {
    if (styles) {
      styles.forEach((css) => {
        const s = document.createElement('style')

        s.textContent = css
        this.shadowRoot.appendChild(s)
        ;(this._styles || (this._styles = [])).push(s)
      })
    }
  }

  _applyLinks(links) {
    const appendStyle = (href) => {
      const l = document.createElement('link')
      l.href = href
      l.rel = 'stylesheet'
      this.shadowRoot.appendChild(l)
    }

    // 支持在组件中指定样式文件 links
    if (links && isArray(links)) {
      links.forEach(appendStyle)
    }
  }
}

export default function defineCustomElement(options) {
  const Component = defineComponent(options)
  class LowcodeVueCustomElement extends LowcodeVueElement {
    constructor(props) {
      super(Component, props)
    }
  }

  LowcodeVueCustomElement.def = Component

  return LowcodeVueCustomElement
}
