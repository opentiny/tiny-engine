module.exports = {
  description:
    'full目录出码模块的测试用例，每个case中 input 为页面/区块的schema，output为预期的输出，result为实际的输出(生成的代码)',
  cases: [
    {
      name: 'case1_normal',
      pageName: 'FormTable',
      description: '测试代码生成流程'
    },
    {
      name: 'case2_prop-accessor',
      pageName: 'UsePropAccessor',
      description: '测试区块的 prop 支持 accessor 协议'
    },
    {
      name: 'case3_state-accessor',
      pageName: 'UseStateAccessor',
      description: '测试区块的 state 支持 accessor 协议'
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
