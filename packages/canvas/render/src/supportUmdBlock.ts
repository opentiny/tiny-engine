import * as Vue from 'vue'
import * as VueI18n from 'vue-i18n'
import * as TinyWebcomponentCore from '@opentiny/tiny-engine-webcomponent-core'
import * as TinyVueIcon from '@opentiny/vue-icon'
import TinyVue from '@opentiny/vue'
import TinyI18nHost from '@opentiny/tiny-engine-common/js/i18n'
import { camelize, capitalize } from '@vue/shared'
import { blockSlotDataMap, getComponent } from './material-function'

declare global {
  interface Window {
    Vue: typeof Vue
    VueI18n: typeof VueI18n
    TinyVue: typeof TinyVue
    TinyVueIcon: typeof TinyVueIcon
    TinyI18nHost: typeof TinyI18nHost
    TinyWebcomponentCore: typeof TinyWebcomponentCore
  }
}
// 和 @opentiny/tiny-engine-block-build 打包umd方式相适配
export function supportUmdBlock() {
  // 不能采用new Proxy代理Vue的方案，在编译后的vue会报错警告，采用一下方案扩展用于注入一些区块加载逻辑
  window.Vue = {
    ...Vue,
    resolveComponent(...args) {
      // 此处先执行vue内部的解析组件的方法，如果可以拿到组件对象则直接返回，反之则去注册区块
      const component = Vue.resolveComponent(args[0])
      if (component && typeof component === 'string') {
        return getComponent(capitalize(camelize(args[0])))
      } else {
        return component
      }
    },
    // renderSlot方法第三个参数是作用域插槽传递的数据，格式{ data: vue.unref(state).componentData }
    renderSlot(...args) {
      // 获取当前vue的实例
      const instance = Vue.getCurrentInstance()

      // 获取当前区块名称
      const blockName = instance.attrs.dataTag as string

      const [, slotName, slotData] = args

      // 如果是作用域插槽，则获取作用域插槽传递过来的参数
      if (slotData) {
        if (blockSlotDataMap[blockName]) {
          blockSlotDataMap[blockName][slotName] = slotData
        } else {
          blockSlotDataMap[blockName] = { [slotName]: slotData }
        }
      }

      /**
       * vue源码中的renderSlot会忽略default插槽的名称，所以这里必须手动添加args第三个参数的name值
       * vue源码如右所示：if (name !== 'default') props.name = name; return createVNode('slot', props, fallback && fallback());
       **/
      if (slotName === 'default') {
        args[2] = args[2] || {}
        args[2].name = slotName
      }

      return Vue.renderSlot(...args)
    }
  }

  window.VueI18n = VueI18n
  window.TinyVue = TinyVue
  window.TinyVueIcon = TinyVueIcon
  window.TinyWebcomponentCore = TinyWebcomponentCore
  window.TinyI18nHost = TinyI18nHost
}
