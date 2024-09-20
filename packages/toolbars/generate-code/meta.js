export default {
  id: 'engine.toolbars.generate-code',
  type: 'toolbars',
  title: 'generate-code',
  options: {
    icon: {
      default: 'generate-code'
    }, // 当组件只有一个图标时默认为default，当有多个图标时，如lock，按照各自组件的规则来
    align: 'right',
    collapesd: false, // 是否折叠到最右侧
    renderType: 'button',
    props: {}, // render为button时有效
    style: '', // render为button时有效
    useDefaultClass: true
  }
}
