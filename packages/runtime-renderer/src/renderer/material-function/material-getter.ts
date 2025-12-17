import { h, defineAsyncComponent, reactive, defineComponent } from 'vue'
import { isHTMLTag } from '@vue/shared'
import {
  CanvasRow,
  CanvasCol,
  CanvasRowColContainer,
  CanvasFlexBox,
  CanvasSection,
  CanvasNavigation,
  FormModel,
  TableModel,
  PageModel
} from '@opentiny/tiny-engine-builtin-component'
import BlockLoadError from '../../components/BlockLoadError.vue'
import {
  CanvasBox,
  CanvasText,
  CanvasIcon,
  CanvasSlot,
  CanvasImg,
  CanvasPlaceholder,
  CanvasRouterLink,
  CanvasRouterView
} from '../builtin'
import { getBlockCompileResult } from './blockComplier'
import { addTagTask } from '../app-function/importMap'
import config from '../../../config.ts'

export const Mapper: any = {
  Icon: CanvasIcon,
  Text: CanvasText,
  div: CanvasBox,
  Slot: CanvasSlot,
  slot: CanvasSlot,
  Template: CanvasBox,
  Img: CanvasImg,
  CanvasSection,
  CanvasFlexBox,
  CanvasRow,
  CanvasCol,
  CanvasRowColContainer,
  CanvasPlaceholder,
  FormModel,
  TableModel,
  PageModel,
  RouterView: CanvasRouterView,
  RouterLink: CanvasRouterLink,
  CanvasNavigation
}
const getNative = (name: string) => {
  return window.TinyLowcodeComponent?.[name]
}

const getBlock = (name: string) => {
  return window.blocks?.[name]
}

const blockComponentsBlobUrlMap = new Map<string, any>()

// TODO: 这里的全局 getter 方法名，可以做成配置化
const loadBlockComponent = async (name: string) => {
  try {
    if (blockComponentsBlobUrlMap.has(name)) {
      return import(/* @vite-ignore */ blockComponentsBlobUrlMap.get(name))
    }

    const blocksBlob = (await getBlockCompileResult(name)) as Array<{ blobURL: string; style: string }>

    for (const [fileName, value] of Object.entries(blocksBlob)) {
      blockComponentsBlobUrlMap.set(fileName, value.blobURL)

      if (!value.style) {
        continue
      }

      // 注册 JS，以区块为维度
      addTagTask({
        id: fileName,
        tag: 'style',
        textContent: value.style,
        type: config.enableTailwindCSS ? 'text/tailwindcss' : 'text/css'
      })
    }

    return import(/* @vite-ignore */ blockComponentsBlobUrlMap.get(name))
  } catch (error) {
    // 加载错误提示
    return h(BlockLoadError, { name })
  }
}

window.loadBlockComponent = loadBlockComponent

export const getBlockComponent = (name: string) => {
  return defineAsyncComponent(() => loadBlockComponent(name))
}

// 移除区块缓存
export const removeBlockCompsCache = () => {
  blockComponentsBlobUrlMap.forEach((_, fileName) => {
    const stylesheet = document.querySelector(`#${fileName}`)
    stylesheet?.remove?.()
  })

  blockComponentsBlobUrlMap.clear()
}

// 获取图标组件
export const getIcon = (name: string) => {
  return defineComponent({
    name: 'Icon',
    render() {
      return h(CanvasIcon, { name, ...this.$props })
    }
  })
}

export const getComponent = (name: string) => {
  return Mapper[name] || getNative(name) || getBlock(name) || (isHTMLTag(name) ? name : getBlockComponent(name))
}

export const blockSlotDataMap = reactive<Record<string, any>>({})
