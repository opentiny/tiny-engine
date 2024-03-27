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

const path = require('path')
const fs = require('fs-extra')
const prettier = require('prettier')
const { execSync } = require('child_process')
const { generateCode } = require('../../../dist/tiny-engine-dsl-vue.js')
const { logger } = require('../../utils/logger')

const getPageData = (testCaseFile) => {
  const pageSchema = require(`./${testCaseFile.name}/input/page.schema.json`)
  let blocksData = []
  let componentsMap = []

  if (fs.existsSync(path.resolve(__dirname, `./${testCaseFile.name}/input/blocks.schema.json`))) {
    blocksData = require(`./${testCaseFile.name}/input/blocks.schema.json`)
  }

  if (fs.existsSync(path.resolve(__dirname, `./${testCaseFile.name}/input/components-map.json`))) {
    componentsMap = require(`./${testCaseFile.name}/input/components-map.json`)
  }

  return {
    pageInfo: { schema: pageSchema, name: testCaseFile.pageName || 'page1' },
    componentsMap,
    blocksData
  }
}

const generateFiles = ({ testCaseFile, result }) => {
  fs.mkdirSync(path.resolve(__dirname, `./${testCaseFile.name}/result`), { recursive: true })

  result.forEach((item) => {
    const { panelName, panelValue, errors, filePath, prettierOpts } = item
    // 真实使用时，如果用到了路径别名，此处要映射处理一下
    // filePath.replace('@crm-block', 'src')

    if (errors.length) {
      const messages = errors.map(({ message }) => message).join('\n\n---next error---\n\n')
      logger.error(`生成的 vue 源码校验报错: \n${messages}`)

      return
    }

    fs.outputFileSync(
      path.resolve(__dirname, `./${testCaseFile.name}/result`, filePath, panelName),
      prettier.format(panelValue, prettierOpts)
    )
  })
}

const runEslint = ({ testCaseFile }) => {
  const eslintCmd = `node ./node_modules/eslint/bin/eslint.js test/testcases/full/${testCaseFile.name}/result --ext .js,.vue`
  execSync(eslintCmd, { cwd: process.cwd(), stdio: [0, 1, 2] })
}

const runTestCases = () => {
  const testCaseConfig = require(path.resolve(__dirname, 'index.config.js'))
  const { cases: testCaseFiles } = testCaseConfig
  logger.info(`total test cases: ${testCaseFiles.length} \n`)
  for (const testCaseFile of testCaseFiles) {
    logger.info(`正在运行测试用例：${testCaseFile.description}`)
    // DSL转换
    const result = generateCode(getPageData(testCaseFile))
    // 生成文件
    generateFiles({ testCaseFile, result })
    // eslint
    try {
      runEslint({ testCaseFile })
    } catch {
      logger.error('生成的代码 eslint 静态检查未通过，有以上问题 \n')
    }
  }
}

runTestCases()
