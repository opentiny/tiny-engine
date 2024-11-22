// @ts-ignore
import { createApp, defineAsyncComponent, h } from 'https://unpkg.com/vue@3.4.23/dist/vue.runtime.esm-browser.js'
// import TinyI18nHost, { I18nInjectionKey } from '@opentiny/tiny-engine-common/js/i18n'

import { compile } from './index'
import BlockFileName from '../test/sample/BlockFileName.vue?raw'
import BlockHead from '../test/sample/BlockHead.vue?raw'
import BlockMenu from '../test/sample/BlockMenu.vue?raw'
import BlockTest from '../test/sample/BlockTest.vue?raw'



// console.log('window.vue', window.vue)
// console.log('createApp', createApp)

const RenderMain = {
  setup() {
    const componentMap = compile([
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
    ], {})

    const blockComponents: { [key: string]: any } = {

    }

    for(const [fileName, value] of Object.entries(componentMap)) {
      blockComponents[fileName] = defineAsyncComponent(() => import(value.blobURL))
    }

    // const BlockHeadTest = defineAsyncComponent(() => import(componentMap['BlockHead.vue'].blobURL))
    // const BlockFileNameTest = defineAsyncComponent(() => import(componentMap['BlockFileName.vue'].blobURL))

    const css = Object.values(componentMap).map((item) => item.style).join('')

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
      // BlockHeadTest,
      // BlockFileNameTest
    }
  },
  // @ts-ignore
  render() {
    // console.log('componentMap', this.componentMap)
    // @ts-ignore
    const { blockComponents } = this

    // console.log()

    return h('div', {}, [
      // h(import(componentMap['BlockHead.vue'].blobURL)),
      h(blockComponents.BlockTest),
      h(blockComponents.BlockHead),
      h(blockComponents.BlockFileName),
      h('span', {}, 'testtest')
    ])
  }
}

const App = createApp(RenderMain)

App.mount(document.querySelector('#app')!)

