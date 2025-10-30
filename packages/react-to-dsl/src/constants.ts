export const defaultComponentMap: Record<string, string> = {
  Form: 'TinyForm',
  'Form.Item': 'TinyFormItem',
  Button: 'TinyButton',
  'Radio.Group': 'TinyButtonGroup',
  Select: 'TinySelect',
  'Input.Search': 'TinySearch',
  Input: 'TinyInput',
  Grid: 'TinyGrid',
  'Grid.Item': 'TinyGridItem',
  Col: 'TinyCol',
  Row: 'TinyRow',
  Steps: 'TinyTimeLine',
  'Typography.Text': 'Text',
  Table: 'TinyGrid',
  AntdForm: 'TinyForm',
  AntdFormItem: 'TinyFormItem',
  AntdButton: 'TinyButton',
  AntdButtonGroup: 'TinyButtonGroup',
  AntdSelect: 'TinySelect',
  AntdSearch: 'TinySearch',
  AntdInput: 'TinyInput',
  AntdGrid: 'TinyGrid',
  AntdGridItem: 'TinyGridItem',
  AntdCol: 'TinyCol',
  AntdRow: 'TinyRow',
  AntdTimeLine: 'TinyTimeLine',
  AntdText: 'Text',
  AntdTable: 'TinyGrid'
}

// 组件属性映射示例：key 为“映射后的组件名”，值为属性级规则
export const defaultPropMap: Record<string, Record<string, { rename?: string; mapValue?: (v: any) => any }>> = {
  TinyForm: {
    labelCol: { rename: 'label-position' }
  },
  TinyFormItem: {
    label: { rename: 'label' }
  }
  // 待补充...
}
