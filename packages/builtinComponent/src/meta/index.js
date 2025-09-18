import CanvasCol from './CanvasCol.json'
import CanvasRow from './CanvasRow.json'
import CanvasRowColContainer from './CanvasRowColContainer.json'
import CanvasFlexBox from './CanvasFlexBox.json'
import CanvasSection from './CanvasSection.json'
import BaseForm from './BaseForm.json'
import BaseTable from './BaseTable.json'
import BasePage from './BasePage.json'

export default {
  components: [
    CanvasCol.component,
    CanvasRow.component,
    CanvasRowColContainer.component,
    CanvasFlexBox.component,
    CanvasSection.component,
    BaseForm.component,
    BaseTable.component,
    BasePage.component
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
      group: 'model',
      label: {
        zh_CN: '模型组件'
      },
      children: [BaseForm.snippet, BaseTable.snippet, BasePage.snippet]
    }
  ]
}
