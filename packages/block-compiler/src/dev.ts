// @ts-ignore
import { createApp, defineAsyncComponent, h } from 'https://unpkg.com/vue@3.4.23/dist/vue.runtime.esm-browser.js'
import { compile } from './index'
import BlockFileName from '../test/sample/BlockFileName.vue?raw'
import BlockHead from '../test/sample/BlockHead.vue?raw'
import BlockMenu from '../test/sample/BlockMenu.vue?raw'
import BlockTest from '../test/sample/BlockTest.vue?raw'
import BlockJsxTest from '../test/sample/slotModelValueTest.vue?raw'

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
        },
        {
          fileName: 'BlockJsxTest',
          sourceCode: BlockJsxTest
        }
      ],
      {}
    )

    const blockComponents: { [key: string]: unknown } = {}

    // @ts-ignore
    window.getBlockComponentBlobUrl = (name) => {
      return componentMap?.[name]?.blobURL
    }

    for (const [fileName, value] of Object.entries(componentMap)) {
      blockComponents[fileName] = defineAsyncComponent(() => import(/* @vite-ignore */ value.blobURL))
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

    return () =>
      h('div', {}, [
        h(blockComponents.BlockJsxTest),
        h(blockComponents.BlockTest),
        h(blockComponents.BlockHead),
        h(blockComponents.BlockFileName),
        h('span', {}, 'testtest')
      ])
  }
}

const App = createApp(RenderMain)

App.mount(document.querySelector('#app')!)
