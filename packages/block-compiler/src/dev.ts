// @ts-ignore
import { createApp, defineAsyncComponent, h } from 'https://unpkg.com/vue@3.4.23/dist/vue.runtime.esm-browser.js'
import { compile } from './index'
import BlockFileName from '../test/sample/BlockFileName.vue?raw'
import BlockHead from '../test/sample/BlockHead.vue?raw'
import BlockMenu from '../test/sample/BlockMenu.vue?raw'
import BlockTest from '../test/sample/BlockTest.vue?raw'

const RenderMain = {
  setup() {
    const componentMap = compile(
      [
        {
          fileName: 'BlockHead',
          sourceCode: BlockHead
        },
        {
          fileName: 'BlockFileName',
          sourceCode: BlockFileName
        },
        {
          fileName: 'BlockMenu',
          sourceCode: BlockMenu
        },
        {
          fileName: 'BlockTest',
          sourceCode: BlockTest
        }
      ],
      {}
    )

    const blockComponents: { [key: string]: any } = {}

    for (const [fileName, value] of Object.entries(componentMap)) {
      blockComponents[fileName] = defineAsyncComponent(() => import(value.blobURL))
    }

    const css = Object.values(componentMap)
      .map((item) => item.style)
      .join('')

    const stylesheet = document.querySelector('#block-stylesheet')

    if (stylesheet) {
      stylesheet.remove()
    } else {
      const newStyleSheet = document.createElement('style')

      newStyleSheet.innerHTML = css

      document.head.appendChild(newStyleSheet)
    }

    return {
      componentMap,
      blockComponents
    }
  },
  // @ts-ignore
  render() {
    // @ts-ignore
    const { blockComponents } = this

    return h('div', {}, [
      h(blockComponents.BlockTest),
      h(blockComponents.BlockHead),
      h(blockComponents.BlockFileName),
      h('span', {}, 'testtest')
    ])
  }
}

const App = createApp(RenderMain)

App.mount(document.querySelector('#app')!)
