import { describe, it, expect } from 'vitest'
import { generateCode } from '../../src/generator/page.js'
import fs from 'fs'
import path from 'path'
import {
  lifecycleTestSchema,
  complexLifecycleSchema,
  mixedLifecycleSchema,
  errorBoundaryLifecycleSchema
} from './mockData.js'

// 保存生成的JSX到output目录
const saveJSXToOutput = (jsxContent, fileName) => {
  const outputDir = path.join(__dirname, 'output')
  const outputPath = path.join(outputDir, `${fileName}.jsx`)

  // 确保output目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  try {
    fs.writeFileSync(outputPath, jsxContent, 'utf8')
    console.log(`✅ 已保存: ${outputPath}`)
  } catch (error) {
    console.error(`❌ 保存失败: ${outputPath}`, error)
  }
}

// 测试配置
const testConfigs = {
  basic: {
    schema: lifecycleTestSchema,
    name: 'LifecycleTestPage',
    tests: [
      {
        name: '基础生命周期钩子',
        fileName: '01_basic_lifecycle',
        assertions: [
          'componentDidMount',
          'componentWillUnmount',
          'componentDidUpdate',
          'componentDidCatch',
          "console.log('Component mounted')",
          "console.log('Component unmounted')",
          "console.log('Component updated')",
          "console.log('Error caught:', error)"
        ]
      },
      {
        name: '事件处理方法',
        fileName: '02_event_handlers',
        assertions: ['handleClick', "console.log('Button clicked')"]
      }
    ]
  },
  complex: {
    schema: complexLifecycleSchema,
    name: 'ComplexLifecyclePage',
    tests: [
      {
        name: '复杂生命周期钩子',
        fileName: '03_complex_lifecycle',
        assertions: [
          'componentDidMount',
          'componentWillUnmount',
          'componentDidCatch',
          'componentDidUpdate',
          'initializeData',
          'setupEventListeners',
          'cleanup',
          'removeEventListeners'
        ]
      },
      {
        name: '状态管理代码',
        fileName: '04_state_management',
        assertions: ['inputValue', 'isLoading', 'data', 'setState']
      }
    ]
  },
  mixed: {
    schema: mixedLifecycleSchema,
    name: 'MixedLifecyclePage',
    tests: [
      {
        name: '混合功能代码',
        fileName: '05_mixed_functionality',
        assertions: [
          'componentDidMount',
          'componentWillUnmount',
          'componentDidUpdate',
          'focusInput',
          'handleSubmit',
          'incrementCount',
          'toggleVisibility'
        ]
      },
      {
        name: '数据绑定',
        fileName: '06_data_binding',
        assertions: ['inputValue', 'count', 'isVisible', 'this.state.inputValue']
      }
    ]
  }
}

// 通用测试函数
const runTest = (testConfig, testCase) => {
  const pageInfo = {
    schema: testConfig ? testConfig.schema : testCase.schema,
    name: testConfig ? testConfig.name : testCase.pageName
  }
  const result = generateCode({ pageInfo, componentsMap: [], blocksData: [] })
  const jsxFile = result.find((i) => i.panelName.endsWith('.jsx'))

  expect(result).toBeDefined()
  expect(jsxFile).toBeDefined()

  // 保存生成的JSX到output目录
  saveJSXToOutput(jsxFile.panelValue, testCase.fileName)

  // 执行断言
  testCase.assertions.forEach((assertion) => {
    expect(jsxFile.panelValue).toContain(assertion)
  })
}

describe('React生命周期功能测试', () => {
  describe('基础生命周期测试', () => {
    testConfigs.basic.tests.forEach((testCase) => {
      it(`应该正确生成${testCase.name}`, () => {
        runTest(testConfigs.basic, testCase)
      })
    })
  })

  describe('复杂生命周期测试', () => {
    testConfigs.complex.tests.forEach((testCase) => {
      it(`应该正确生成${testCase.name}`, () => {
        runTest(testConfigs.complex, testCase)
      })
    })
  })

  describe('混合生命周期和数据绑定测试', () => {
    testConfigs.mixed.tests.forEach((testCase) => {
      it(`应该正确生成${testCase.name}`, () => {
        runTest(testConfigs.mixed, testCase)
      })
    })
  })
})
