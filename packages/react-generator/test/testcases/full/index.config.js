/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

module.exports = {
  description:
    'full目录出码模块的测试用例，每个case中 input 为页面/区块的schema，output为预期的输出，result为实际的输出(生成的代码)',
  cases: [
    {
      name: 'case1_normal',
      pageName: 'FormTable',
      description: '测试代码生成流程'
    }
  ],
  input: {
    fileName: 'page.schema.json',
    type: 'json'
  },
  output: {
    fileName: 'output',
    type: 'vue'
  }
}
