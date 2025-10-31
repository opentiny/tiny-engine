module.exports = {
  description:
    'lifecycle目录出码模块的测试用例，专门测试React生命周期功能，每个case中 input 为页面/区块的schema，output为预期的输出，result为实际的输出(生成的代码)',
  cases: [
    {
      name: 'case1_basic-lifecycle',
      pageName: 'LifecycleTestPage',
      description: '测试基础生命周期钩子功能'
    },
    {
      name: 'case2_complex-lifecycle',
      pageName: 'ComplexLifecyclePage',
      description: '测试复杂生命周期场景'
    },
    {
      name: 'case3_mixed-lifecycle',
      pageName: 'MixedLifecyclePage',
      description: '测试混合生命周期和数据绑定'
    },
    {
      name: 'case4_error-boundary',
      pageName: 'ErrorBoundaryPage',
      description: '测试错误边界生命周期'
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
