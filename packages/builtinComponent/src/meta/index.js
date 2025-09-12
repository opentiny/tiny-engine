import CanvasCol from './CanvasCol.json'
import CanvasRow from './CanvasRow.json'
import CanvasRowColContainer from './CanvasRowColContainer.json'
import CanvasFlexBox from './CanvasFlexBox.json'
import CanvasSection from './CanvasSection.json'
import CanvasNavigation from './CanvasNavigation.json'

export default {
  components: [
    CanvasCol.component,
    CanvasRow.component,
    CanvasRowColContainer.component,
    CanvasFlexBox.component,
    CanvasSection.component,
    CanvasNavigation.component
  ],
  snippets: [
    {
      group: 'layout',
      label: {
        zh_CN: '布局与容器'
      },
      children: [CanvasRowColContainer.snippet, CanvasFlexBox.snippet, CanvasSection.snippet]
    },
    {
      group: 'advanced',
      label: {
        zh_CN: '高级元素'
      },
      children: [CanvasNavigation.snippet]
    }
  ]
}
