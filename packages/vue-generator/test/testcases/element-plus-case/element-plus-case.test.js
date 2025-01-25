import { expect, test, describe, vi } from 'vitest'
import path from 'path'
import fs from 'fs'
import dirCompare from 'dir-compare'
import { generateApp } from '@/generator/generateApp'
import { appSchemaDemo01 } from './mockData'
import { logDiffResult } from '../../utils/logDiffResult'

// 需要模拟 import 出来的 favicon.ico 文件， base64 格式，因为在 test 运行环境中直接的 import 出来的不是 bast64 字符串，而是路径
vi.mock('../../../src/templates/vue-template/templateFiles/public/favicon.ico', () => {
  const faviconRelativePath = '../../../src/templates/vue-template/templateFiles/public/favicon.ico'
  const fileBuffer = fs.readFileSync(path.join(__dirname, faviconRelativePath))
  const str = fileBuffer.toString('base64')

  return {
    default: `data:image/x-icon;base64,${str}`
  }
})

describe('generate element-plus material project correctly', () => {
  test('should generate element-plus css import statement 预期生成 element-plus 样式依赖引入', async () => {
    const instance = generateApp()

    const res = await instance.generate(appSchemaDemo01)
    const { genResult } = res

    // 写入文件
    for (const { fileName, path: filePath, fileContent } of genResult) {
      fs.mkdirSync(path.resolve(__dirname, `./result/appdemo01/${filePath}`), { recursive: true })

      if (typeof fileContent === 'string') {
        fs.writeFileSync(
          path.resolve(__dirname, `./result/appdemo01/${filePath}/${fileName}`),
          // 这里需要将换行符替换成 CRLF 格式的
          fileContent.replace(/\r?\n/g, '\r\n')
        )
      } else if (fileContent instanceof Blob) {
        const arrayBuffer = await fileContent.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        fs.writeFileSync(path.resolve(__dirname, `./result/appdemo01/${filePath}/${fileName}`), buffer)
      }
    }

    const compareOptions = {
      compareContent: true,
      ignoreLineEnding: true,
      ignoreAllWhiteSpaces: true,
      ignoreEmptyLines: true
    }

    const path1 = path.resolve(__dirname, './expected/appdemo01')
    const path2 = path.resolve(__dirname, './result/appdemo01')

    // 对比文件差异
    const diffResult = dirCompare.compareSync(path1, path2, compareOptions)

    logDiffResult(diffResult)

    expect(diffResult.same).toBe(true)
  })
})
