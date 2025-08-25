import { formatFiles } from '../utils/formatCode'
import { mergeOptions } from '../utils/mergeOptions'

function formatCodePlugin(options = {}) {
  const defaultOption = {
    // prettier配置
    printWidth: 120,
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: true,
    quoteProps: 'as-needed',
    jsxSingleQuote: false,
    trailingComma: 'none',
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    
    // 插件配置
    enableFormat: true, // 是否启用格式化
    skipFiles: [], // 跳过的文件类型
    onlyFiles: [], // 只格式化指定文件类型
    logFormatResult: true // 是否记录格式化结果
  }

  const mergedOption = mergeOptions(defaultOption, options)

  return {
    name: 'tinyEngine-generateCode-plugin-format-code',
    description: '使用prettier格式化生成的代码',
    
    /**
     * 格式化出码
     * @param {tinyEngineDslReact.IAppSchema} schema
     * @param {Object} context 上下文
     * @returns {void}
     */
    run(schema, context) {
      if (!mergedOption.enableFormat) {
        this.addLog('格式化功能已禁用')
        return
      }

      const { genResult } = context
      let formattedCount = 0
      let skippedCount = 0
      let errorCount = 0

      // 过滤需要格式化的文件
      const filesToFormat = genResult.filter(item => {
        const { fileName } = item
        const fileExt = fileName.split('.').pop()?.toLowerCase()

        // 检查是否在跳过列表中
        if (mergedOption.skipFiles.length > 0 && mergedOption.skipFiles.includes(fileExt)) {
          skippedCount++
          return false
        }

        // 检查是否在指定列表中
        if (mergedOption.onlyFiles.length > 0 && !mergedOption.onlyFiles.includes(fileExt)) {
          skippedCount++
          return false
        }

        return true
      })

      // 批量格式化文件
      const formattedFiles = formatFiles(filesToFormat, mergedOption)

      // 更新文件内容
      formattedFiles.forEach((formattedFile, index) => {
        const originalFile = filesToFormat[index]
        
        if (formattedFile.fileContent !== originalFile.fileContent) {
          this.replaceFile(formattedFile)
          formattedCount++
          
          if (mergedOption.logFormatResult) {
            this.addLog(`格式化文件: ${formattedFile.fileName}`)
          }
        }
      })

      // 记录格式化结果
      if (mergedOption.logFormatResult) {
        this.addLog(`格式化完成: 处理${filesToFormat.length}个文件，格式化${formattedCount}个，跳过${skippedCount}个，错误${errorCount}个`)
      }
    }
  }
}

export default formatCodePlugin
