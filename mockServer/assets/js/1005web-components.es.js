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

import { defineCustomElement } from '@opentiny/tiny-engine-webcomponent-core'
import * as vue from 'vue'
import { resolveComponent, openBlock, createElementBlock, createElementVNode, createVNode, toDisplayString } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import { IconChevronLeft } from '@opentiny/vue-icon'
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
    TinyIconChevronLeft: IconChevronLeft()
  },
  props: {
    blockName: { type: String, default: 'MT0526-React 1.0' }
  },
  setup(props, context) {
    const { t, lowcodeWrap } = vue.inject(I18nInjectionKey).lowcode()
    const wrap = lowcodeWrap(props, context, t)
    const state = vue.reactive({})
    const attrs = wrap({
      state
    })
    return attrs
  }
}
const _hoisted_1 = {
  style: { 'font-size': '18px', height: '40px', 'border-bottom': '1px solid rgb(223, 225, 230)', 'margin-top': '20px' }
}
const _hoisted_2 = /* @__PURE__ */ createElementVNode(
  'span',
  { style: { 'margin-left': '10px', 'font-weight': 'bold' } },
  '\u7F16\u8F91\u7269\u6599\u8D44\u4EA7\u5305 | ',
  -1
)
const _hoisted_3 = { style: { 'margin-left': '10px', 'font-weight': 'bold' } }
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_tiny_icon_chevron_left = resolveComponent('tiny-icon-chevron-left')
  return (
    openBlock(),
    createElementBlock('div', null, [
      createElementVNode('div', _hoisted_1, [
        createVNode(_component_tiny_icon_chevron_left),
        _hoisted_2,
        createElementVNode('span', _hoisted_3, toDisplayString($props.blockName), 1)
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
  customElements.define(blockName, defineCustomElement(block))
}
export { block as default }
