import prettier from 'prettier'
import parserHtml from 'prettier/parser-html'
import parseCss from 'prettier/parser-postcss'
import parserBabel from 'prettier/parser-babel'

/**
 * 文件类型到prettier解析器的映射
 */
const PARSER_MAP = {
  // JavaScript/TypeScript
  js: 'babel',
  jsx: 'babel',
  ts: 'babel',
  tsx: 'babel',
  mjs: 'babel',
  
  // JSON
  json: 'json-stringify',
  
  // CSS/SCSS/Less
  css: 'css',
  scss: 'css',
  less: 'css',
  
  // HTML
  html: 'html',
  htm: 'html',
  
  // Markdown
  md: 'markdown',
  markdown: 'markdown'
}

/**
 * 获取文件扩展名
 * @param {string} fileName 文件名
 * @returns {string} 文件扩展名
 */
function getFileExtension(fileName) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * 获取prettier解析器
 * @param {string} fileName 文件名
 * @returns {string|null} prettier解析器名称
 */
function getParser(fileName) {
  const ext = getFileExtension(fileName)
  return PARSER_MAP[ext] || null
}

/**
 * 获取prettier插件
 * @param {string} parser 解析器名称
 * @returns {Array} prettier插件数组
 */
function getPlugins(parser) {
  const basePlugins = [parserBabel, parseCss, parserHtml]
  
  // 根据解析器类型返回对应的插件
  switch (parser) {
    case 'babel':
      return [parserBabel]
    case 'css':
    case 'scss':
    case 'less':
      return [parseCss]
    case 'html':
      return [parserHtml]
    case 'json-stringify':
      return [] // JSON 不需要额外插件
    case 'markdown':
      return [] // Markdown 不需要额外插件
    default:
      return basePlugins
  }
}

/**
 * 获取默认的prettier配置
 * @returns {Object} prettier配置对象
 */
function getDefaultPrettierConfig() {
  return {
    // 基本配置
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
    
    // React特定配置
    jsxBracketSameLine: false
  }
}

/**
 * 格式化代码
 * @param {string} code 要格式化的代码
 * @param {string} fileName 文件名
 * @param {Object} options 自定义配置选项
 * @returns {string} 格式化后的代码
 */
export function formatCode(code, fileName, options = {}) {
  try {
    const parser = getParser(fileName)
    
    if (!parser) {
      console.warn(`[formatCode] 不支持的文件类型: ${fileName}`)
      return code
    }
    
    const defaultConfig = getDefaultPrettierConfig()
    const mergedConfig = {
      ...defaultConfig,
      ...options,
      parser,
      plugins: getPlugins(parser)
    }
    
    return prettier.format(code, mergedConfig)
  } catch (error) {
    console.error(`[formatCode] 格式化失败: ${fileName}`, error)
    // 格式化失败时返回原始代码
    return code
  }
}

/**
 * 批量格式化文件
 * @param {Array} files 文件数组，每个文件包含 fileContent 和 fileName
 * @param {Object} options prettier配置选项
 * @returns {Array} 格式化后的文件数组
 */
export function formatFiles(files, options = {}) {
  return files.map(file => {
    const { fileContent, fileName, ...rest } = file
    
    try {
      const formattedContent = formatCode(fileContent, fileName, options)
      return {
        ...rest,
        fileName,
        fileContent: formattedContent
      }
    } catch (error) {
      console.error(`[formatFiles] 格式化文件失败: ${fileName}`, error)
      return file
    }
  })
}

/**
 * 检查代码是否需要格式化
 * @param {string} code 代码内容
 * @param {string} fileName 文件名
 * @param {Object} options prettier配置选项
 * @returns {boolean} 是否需要格式化
 */
export function checkFormat(code, fileName, options = {}) {
  try {
    const parser = getParser(fileName)
    
    if (!parser) {
      return false
    }
    
    const defaultConfig = getDefaultPrettierConfig()
    const mergedConfig = {
      ...defaultConfig,
      ...options,
      parser,
      plugins: getPlugins(parser)
    }
    
    return !prettier.check(code, mergedConfig)
  } catch (error) {
    console.error(`[checkFormat] 检查格式化失败: ${fileName}`, error)
    return false
  }
}

export default {
  formatCode,
  formatFiles,
  checkFormat,
  getParser,
  getDefaultPrettierConfig
}
