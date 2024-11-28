import * as Vue from 'vue'
import * as VueI18n from 'vue-i18n'
import * as TinyWebcomponentCore from '@opentiny/tiny-engine-webcomponent-core'
import * as TinyVueIcon from '@opentiny/vue-icon'
import TinyVue from '@opentiny/vue'
import TinyI18nHost from '@opentiny/tiny-engine-common/js/i18n'

// 和 @opentiny/tiny-engine-block-build 打包umd方式相适配
export function supportUmdBlock() {
  // 不能采用new Proxy代理Vue的方案，在编译后的vue会报错警告，采用一下方案扩展用于注入一些区块加载逻辑
  window.Vue = Vue

  window.VueI18n = VueI18n
  window.TinyVue = TinyVue
  window.TinyVueIcon = TinyVueIcon
  window.TinyWebcomponentCore = TinyWebcomponentCore
  window.TinyI18nHost = TinyI18nHost
}
