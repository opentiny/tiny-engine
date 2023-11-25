import CanvasCol from './CanvasCol.json'
import CanvasRow from './CanvasRow.json'
import CanvasRowColContainer from './CanvasRowColContainer.json'

export default {
  components: [
    {
      group: '内置组件',
      children: [{ ...CanvasCol.components }, { ...CanvasRow.components }, { ...CanvasRowColContainer.components }]
    }
  ],
  snippets: [
    {
      group: '内置组件',
      children: [{ ...CanvasRowColContainer.snippets }]
    }
  ]
}
