module.exports = {
  description:
    'data-binding目录出码模块的测试用例，专门测试数据双向绑定功能，每个case中 input 为页面/区块的schema，output为预期的输出，result为实际的输出(生成的代码)',
  cases: [
    {
      name: 'case1_data-binding',
      pageName: 'DataBindingDemo',
      description: '测试基础数据双向绑定功能'
    },
    {
      name: 'case2_complex-binding',
      pageName: 'ComplexBindingDemo',
      description: '测试复杂数据双向绑定场景（嵌套对象）'
    }
  ],
  input: {
    fileName: 'page.schema.json',
    type: 'json'
  },
  output: {
    fileName: 'output',
    type: 'jsx'
  }
}
