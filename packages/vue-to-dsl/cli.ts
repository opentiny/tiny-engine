#!/usr/bin/env node

/* eslint-disable no-console */
/**
 * Vue To DSL CLI Tool (TypeScript)
 * 命令行工具，用于将Vue SFC文件转换为TinyEngine DSL Schema
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { VueToDslConverter } from './src/converter'

// 解决在 ESM 下使用 __dirname/__filename
const __filename = fileURLToPath(import.meta.url)

// 命令行参数解析
const args = process.argv.slice(2)

const showHelp = args.includes('--help') || args.includes('-h')
if (args.length === 0 || showHelp) {
  console.log(`
使用方法:
  node ${path.basename(__filename)} <vue-file-path> [options]

选项:
  --output, -o    输出文件路径
  --format, -f    输出格式 (json, js) 默认: json
  --help, -h      显示帮助信息

示例:
  node ${path.basename(__filename)} ./components/MyComponent.vue
  node ${path.basename(__filename)} ./components/MyComponent.vue --output ./output/schema.json
  node ${path.basename(__filename)} ./components/MyComponent.vue --format js --output ./output/schema.js
`)
  process.exit(0)
}

// 解析参数
const inputFile = args[0]
let outputFile: string | undefined
let format: 'json' | 'js' = 'json'

for (let i = 1; i < args.length; i += 2) {
  const option = args[i]
  const value = args[i + 1]

  switch (option) {
    case '--output':
    case '-o':
      outputFile = value
      break
    case '--format':
    case '-f':
      if (value === 'json' || value === 'js') {
        format = value
      }
      break
    case '--help':
    case '-h':
      console.log('显示帮助信息...')
      process.exit(0)
      break
  }
}

// 设置默认输出文件
if (!outputFile) {
  const baseName = path.basename(inputFile, '.vue')
  outputFile = `${baseName}-schema.${format}`
}
const outputPath = outputFile as string

/**
 * 获取Schema统计信息
 */
function getSchemaStats(schema: any) {
  return {
    stateCount: schema.state ? Object.keys(schema.state).length : 0,
    methodCount: schema.methods ? Object.keys(schema.methods).length : 0,
    computedCount: schema.computed ? Object.keys(schema.computed).length : 0,
    lifecycleCount: schema.lifeCycles ? Object.keys(schema.lifeCycles).length : 0,
    childrenCount: schema.children ? schema.children.length : 0,
    cssLength: schema.css ? schema.css.length : 0
  }
}

async function main() {
  try {
    console.log('🚀 开始转换Vue文件到DSL Schema...')
    console.log(`📁 输入文件: ${inputFile}`)
    console.log(`📄 输出文件: ${outputPath}`)
    console.log(`📋 输出格式: ${format}`)
    console.log()

    // 检查输入文件是否存在
    try {
      await fs.access(inputFile)
    } catch (error) {
      console.error(`❌ 错误: 文件不存在 - ${inputFile}`)
      process.exit(1)
    }

    // 创建转换器
    const converter = new VueToDslConverter({
      componentMap: {
        button: 'TinyButton',
        input: 'TinyInput',
        form: 'TinyForm'
      },
      preserveComments: false,
      strictMode: false
    })

    // 执行转换
    const result = await converter.convertFromFile(inputFile)

    // 显示转换结果
    if (result.errors.length > 0) {
      console.log('⚠️  转换过程中的错误:')
      result.errors.forEach((error: string) => console.log(`   - ${error}`))
      console.log()
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  转换过程中的警告:')
      result.warnings.forEach((warning: string) => console.log(`   - ${warning}`))
      console.log()
    }

    if (result.dependencies.length > 0) {
      console.log('📦 发现的依赖项:')
      result.dependencies.forEach((dep: string) => console.log(`   - ${dep}`))
      console.log()
    }

    if (!result.schema) {
      console.error('❌ 转换失败，未生成Schema')
      process.exit(1)
    }

    // 生成输出内容
    let outputContent: string
    if (format === 'json') {
      outputContent = JSON.stringify(result.schema, null, 2)
    } else if (format === 'js') {
      outputContent = `// Generated DSL Schema from ${inputFile}
// Generated at: ${new Date().toISOString()}

export default ${JSON.stringify(result.schema, null, 2)}
`
    } else {
      console.error(`❌ 错误: 不支持的输出格式 - ${format}`)
      process.exit(1)
      return
    }

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    if (outputDir !== '.' && outputDir !== '') {
      await fs.mkdir(outputDir, { recursive: true })
    }

    // 写入输出文件
    await fs.writeFile(outputPath, outputContent, 'utf-8')

    console.log('✅ 转换完成！')
    console.log(`📁 输出文件已保存到: ${outputPath}`)

    // 显示Schema统计信息
    const stats = getSchemaStats(result.schema)
    console.log()
    console.log('📊 Schema统计信息:')
    console.log(`   组件名称: ${result.schema.componentName}`)
    console.log(`   文件名称: ${result.schema.fileName}`)
    console.log(`   状态数量: ${stats.stateCount}`)
    console.log(`   方法数量: ${stats.methodCount}`)
    console.log(`   计算属性: ${stats.computedCount}`)
    console.log(`   生命周期: ${stats.lifecycleCount}`)
    console.log(`   子组件数: ${stats.childrenCount}`)
    console.log(`   CSS长度: ${stats.cssLength} 字符`)
  } catch (error: any) {
    console.error('❌ 转换过程中发生错误:')
    console.error(error?.message || error)
    if (error?.stack) console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
void main()
