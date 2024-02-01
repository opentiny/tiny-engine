import { hyphenate } from '@vue/shared'
import { defineCustomElement } from '@opentiny/tiny-engine-webcomponent-core'
import block from './BlockFileName.vue'

window.TinyLowcodeResource = window.TinyLowcodeResource || {}

const blockName = hyphenate('BlockFileName')

if (customElements.get(blockName)) {
  if (window.TinyLowcodeResource[blockName]) {
    Object.assign(window.TinyLowcodeResource[blockName], block)
  }
} else {
  block.links = process.env.VUE_APP_UI_LIB_FULL_STYLE_FILE_URL
  block.styles = ['svg { width: 10px; height: 10px;}', ...(block.styles || [])]
  window.TinyLowcodeResource[blockName] = block
  customElements.define(blockName, defineCustomElement(block))
}

export default block
