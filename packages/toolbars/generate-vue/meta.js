export default {
  id: 'engine.toolbars.generate-vue',
  type: 'toolbars',
  title: 'generate-vue',
  icon: {
    default: 'generate-code'
  }, // 当组件只有一个图标时默认为default，当有多个图标时，如lock，按照各自组件的规则来
  align: 'right',
  collapesd: false, // 是否折叠到最右侧
  options: {
    splitLine: false, // 右侧是否有分隔线
    text: '出码', // 提示文本，当折叠时显示在图标右侧，纯图标时为提示文本
    render: 'button', // icon/button/slot 对应纯图标/带图标按钮/插槽
    override: false, // 是否覆盖原本dom， render为slot时有效
    props: {}, // render为button时有效
    style: '' // render为button时有效
  }
}
