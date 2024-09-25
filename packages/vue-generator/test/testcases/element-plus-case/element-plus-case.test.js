import { expect, test, describe } from 'vitest'
import path from 'path'
import fs from 'fs'
import dirCompare from 'dir-compare'
import { generateApp } from '@/generator/generateApp'
import { appSchemaDemo01 } from './mockData'
import { logDiffResult } from '../../utils/logDiffResult'

describe('generate element-plus material project correctly', () => {
  test('should generate element-plus css import statement 预期生成 element-plus 样式依赖引入', async () => {
    const instance = generateApp()

    const res = await instance.generate(appSchemaDemo01)
    const { genResult } = res

    // 写入文件
    genResult.forEach(({ fileName, path: filePath, fileContent }) => {
      fs.mkdirSync(path.resolve(__dirname, `./result/appdemo01/${filePath}`), { recursive: true })
      fs.writeFileSync(
        path.resolve(__dirname, `./result/appdemo01/${filePath}/${fileName}`),
        // 这里需要将换行符替换成 CRLF 格式的
        fileContent.replace(/\r?\n/g, '\r\n')
      )
    })

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
