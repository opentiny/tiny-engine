import { compile } from './index'
import BlockFileName from '../test/sample/BlockFileName.vue?raw'
import BlockHead from '../test/sample/BlockHead.vue?raw'
import BlockMenu from '../test/sample/BlockMenu.vue?raw'
import BlockTest from '../test/sample/BlockTest.vue?raw'



compile([
  {
    fileName: 'BlockHead.vue',
    sourceCode: BlockHead
  },
  {
    fileName: 'BlockFileName.vue',
    sourceCode: BlockFileName
  },
  {
    fileName: 'BlockMenu.vue',
    sourceCode: BlockMenu
  },
  {
    fileName: 'BlockTest.vue',
    sourceCode: BlockTest
  },
], {})
