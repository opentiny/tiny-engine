// tinyvue组件的亮色主题
export const tinyLightTheme = {
  //功能色
  '--te-common-color-success': 'var(--te-base-success-color)', // 注释，成功-背景色 #5cb300
  '--te-common-color-warning': 'var(--te-base-warn-color)', // 注释，告警-背景色 #ff8800
  '--te-common-color-error': 'var(--te-base-error-color)', // 注释，错误-背景色 #f23030
  '--te-common-color-info': 'var(--te-base-prompt-color)', // 注释，告警-背景色  #1476ff
  '--te-common-color-prompt-secondary': 'var(--te-base-indigo-5)', // 注释，区块提示-背景色 #6e51e0

  // 文本色
  '--te-common-text-primary': 'var(--te-base-dark-5)', // 一级文本色-重要信息/标题颜色/输入类文本颜色 #191919
  '--te-common-text-secondary': 'var(--te-base-gray-31)', // 二级文本色-次要信息/表单标签颜色 #595959
  '--te-common-text-placeholder': 'var(--te-base-gray-43)', // 三级文本色-弱化信息/提示文字 #808080
  '--te-common-text-disabled': 'var(--te-base-gray-18)', // 文本禁用色 #c2c2c2
  '--te-common-text-link': 'var(--te-base-blue-6)', // 链接色 #1476ff
  '--te-common-text-inverse': 'var(--te-base-gray-1)', // 主按钮上的文本色 #fff
  '--te-common-text-dark-inverse': 'var(--te-base-gray-1)', // 深色背景下按钮上的文本色 #fff

  '--te-common-icon-primary': 'var(--te-base-dark-5)', // 重要图标色 #191919
  '--te-common-icon-secondary': 'var(--te-base-gray-43)', // 图标默认色 #808080
  '--te-common-icon-disabled': 'var(--te-base-gray-18)', // 图标禁用色 #c2c2c2
  '--te-common-icon-link': 'var(--te-base-blue-6)', // 图标提示色 #1476ff

  '--te-common-border-default': 'var(--te-base-gray-13)', // 线条-输入框默认色 #dbdbdb
  '--te-common-border-active': 'var(--te-base-dark-5)', // 线条-输入框悬浮色/激活色  #191919
  '--te-common-border-secondary': 'var(--te-base-gray-31)', // 线条-次要按钮描边色  #595959
  '--te-common-border-prompt': 'var(--te-base-gray-13)', // 线条-三级按钮默认色/表单内按钮 #dbdbdb
  '--te-common-border-hover': 'var(--te-base-gray-18)', // 线条-按钮边框悬浮色 #c2c2c2
  '--te-common-border-divider': 'var(--te-base-gray-11)', //线条-白色背景分割线颜色 #ebebeb
  '--te-common-border-bg-divider': 'var(--te-base-gray-13)', // 线条-灰色背景分割线颜色/表头分割线/选块分割线 #dbdbdb

  '--te-common-bg-primary': 'var(--te-base-dark-5)', // 主要按钮-背景色 #191919
  '--te-common-bg-primary-2': 'var(--te-base-blue-6)', // 主色-背景色 #1476ff
  '--te-common-bg-secondary': 'var(--te-base-gray-31)', // 次要按钮-背景色 #595959
  '--te-common-bg-prompt': 'var(--te-base-gray-7)', // 导航按钮-背景色/选块-选中色 #e6e6e6
  '--te-common-bg-container': 'var(--te-base-gray-5)', // 列表悬浮色/表格悬浮色/顶部导航按钮悬浮色/选块背景色/提示背景色 #f5f5f5
  '--te-common-bg-container-weaken': 'var(--te-base-gray-2)', // 浅编辑代码--背景色 #fafafa
  '--te-common-bg-default': 'var(--te-base-gray-1)', // 白色背景-输入框背景/面板背景色 #fff
  '--te-common-bg-component': 'var(--te-base-gray-1)' // 白色背景-输入框等组件默认背景/面板背景色 #fff
}