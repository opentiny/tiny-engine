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

;(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(
      require('@opentiny/tiny-engine-webcomponent-core'),
      require('vue'),
      require('vue-i18n'),
      require('@opentiny/vue-icon')
    )
  } else if (typeof define === 'function' && define.amd) {
    define(['@opentiny/tiny-engine-webcomponent-core', 'vue', 'vue-i18n', '@opentiny/vue-icon'], factory)
  } else {
    ;(global = typeof globalThis !== 'undefined' ? globalThis : global || self),
      (global.TinyVueBlock = factory(global.TinyWebcomponentCore, global.Vue, global.VueI18n, global.TinyVueIcon))
  }
})(this, (tinyWebcomponentCore, vue, vueI18n, tinyVue3Icon) => {
  function _interopNamespace(e) {
    if (e && e.__esModule) return e
    const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } })
    if (e) {
      Object.keys(e).forEach((k) => {
        if (k !== 'default') {
          const d = Object.getOwnPropertyDescriptor(e, k)
          Object.defineProperty(
            n,
            k,
            d.get
              ? d
              : {
                  enumerable: true,
                  get: function () {
                    return e[k]
                  }
                }
          )
        }
      })
    }
    n.default = e
    return Object.freeze(n)
  }
  const vue__namespace = /* @__PURE__ */ _interopNamespace(vue)
  Object.freeze({})
  Object.freeze([])
  const cacheStringFunction = (fn) => {
    const cache = /* @__PURE__ */ Object.create(null)
    return (str) => {
      const hit = cache[str]
      return hit || (cache[str] = fn(str))
    }
  }
  const hyphenateRE = /\B([A-Z])/g
  const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, '-$1').toLowerCase())
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc
    for (const [key, val] of props) {
      target[key] = val
    }
    return target
  }
  const _sfc_main = {
    components: {
      TinyIconChevronLeft: tinyVue3Icon.IconChevronLeft()
    },
    props: {
      blockName: { type: String, default: 'MT0526-React 1.0' }
    },
    setup(props, context) {
      const { t, lowcodeWrap } = vue__namespace.inject(vueI18n.I18nInjectionKey).lowcode()
      const wrap = lowcodeWrap(props, context, t)
      const state = vue__namespace.reactive({})
      const attrs = wrap({
        state
      })
      return attrs
    }
  }
  const _hoisted_1 = {
    style: {
      'font-size': '18px',
      height: '40px',
      'border-bottom': '1px solid rgb(223, 225, 230)',
      'margin-top': '20px'
    }
  }
  const _hoisted_2 = /* @__PURE__ */ vue.createElementVNode(
    'span',
    { style: { 'margin-left': '10px', 'font-weight': 'bold' } },
    '\u7F16\u8F91\u7269\u6599\u8D44\u4EA7\u5305 | ',
    -1
  )
  const _hoisted_3 = { style: { 'margin-left': '10px', 'font-weight': 'bold' } }
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_tiny_icon_chevron_left = vue.resolveComponent('tiny-icon-chevron-left')
    return (
      vue.openBlock(),
      vue.createElementBlock('div', null, [
        vue.createElementVNode('div', _hoisted_1, [
          vue.createVNode(_component_tiny_icon_chevron_left),
          _hoisted_2,
          vue.createElementVNode('span', _hoisted_3, vue.toDisplayString($props.blockName), 1)
        ])
      ])
    )
  }
  const block = /* @__PURE__ */ _export_sfc(_sfc_main, [
    ['render', _sfc_render],
    ['__file', 'D:/tmp/buildground/buildground_1673597935715/src/block/generated/components/PortalBlock.vue']
  ])
  window.TinyLowcodeResource = window.TinyLowcodeResource || {}
  const blockName = hyphenate('PortalBlock')
  block.blockId = 1005
  block.blockVersion = '1.0.0'
  if (customElements.get(blockName)) {
    if (window.TinyLowcodeResource[blockName]) {
      Object.assign(window.TinyLowcodeResource[blockName], block)
    }
  } else {
    block.links = {
      VUE_APP_UI_LIB_FULL_STYLE_FILE_URL: ['//localhost:9090/assets/css/0.1.20/index.css']
    }.VUE_APP_UI_LIB_FULL_STYLE_FILE_URL
    window.TinyLowcodeResource[blockName] = block
    customElements.define(blockName, tinyWebcomponentCore.defineCustomElement(block))
  }
  return block
})
