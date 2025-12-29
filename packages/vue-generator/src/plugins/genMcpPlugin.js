import { mergeOptions } from '../utils/mergeOptions'
import { INSERT_POSITION, JS_EXPRESSION } from '../constant'
import mcpBaseTemplate from '../templates/vue-template/templateFiles/src/mcp/base.ts'
import mcpServerTemplate from '../templates/vue-template/templateFiles/src/mcp/server.ts'
import mcpNavigationToolsTemplate from '../templates/vue-template/templateFiles/src/mcp/tools/navigationTools.ts'
import mcpImportsTemplate from '../templates/vue-template/templateFiles/src/mcp/App.vue.mcp-imports.ts'
import mcpSetupTemplate from '../templates/vue-template/templateFiles/src/mcp/App.vue.mcp-setup.ts'
import mcpTemplateTemplate from '../templates/vue-template/templateFiles/src/mcp/App.vue.mcp-template.ts'
import mcpStyleTemplate from '../templates/vue-template/templateFiles/src/mcp/App.vue.mcp-style.ts'
import mcpOnMountedTemplate from '../templates/vue-template/templateFiles/src/mcp/App.vue.mcp-onMounted.ts'

const defaultOption = {
  enabled: false, // 默认禁用 MCP，用户需要显式启用
  agentRoot: 'https://agent.opentiny.design/api/v1/webmcp-trial/',
  sessionId: '78b66563-95c0-4839-8007-e8af634dd658',
  capabilities: {
    prompts: { listChanged: true },
    resources: { subscribe: true, listChanged: true },
    tools: { listChanged: true },
    completions: {},
    logging: {}
  },
  tools: {
    navigation: true,
    application: true
  },
  customTools: []
}

/**
 * 提取路由信息
 * @param {Array} pageSchema 页面模式数组
 * @returns {Array} 路由列表
 */
function extractRoutes(pageSchema) {
  const routes = pageSchema
    .filter((page) => page.meta && (page.meta.route || page.meta.router))
    .map((page) => {
      const routeField = page.meta.route || page.meta.router
      const routePath = routeField.startsWith('/') ? routeField.slice(1) : routeField
      return routePath || 'home'
    })

  // 如果没有路由，添加默认的 home 路由
  if (routes.length === 0) {
    routes.push('home')
  }

  return routes
}

/**
 * 生成导航工具代码（使用模板）
 * @param {Array} pageSchema 页面模式数组
 * @returns {string} 导航工具代码
 */
function generateNavigationTools(pageSchema) {
  const routes = extractRoutes(pageSchema)
  return mcpNavigationToolsTemplate(null, { routes })
}

/**
 * 生成应用程序特定工具代码
 * @param {Object} schema 应用程序模式
 * @returns {string} 应用程序工具代码
 */
function generateApplicationTools(schema) {
  // 基于全局状态和数据源生成自定义工具
  const globalStates = schema.globalState || []

  let toolsCode = `import { z } from "@opentiny/next-sdk"
import type { WebMcpServer } from "@opentiny/next-sdk"`

  // 为每个全局状态生成工具
  globalStates.forEach((state) => {
    if (state.id && state.state) {
      toolsCode += `
import { use${state.id.charAt(0).toUpperCase() + state.id.slice(1)}Store } from '../../stores/${state.id}'`
    }
  })

  toolsCode += `

export function registerApplicationTools(server: WebMcpServer) {`

  // 为每个全局状态生成管理工具
  globalStates.forEach((state) => {
    if (state.id && state.state) {
      const storeName = state.id.charAt(0).toUpperCase() + state.id.slice(1)
      const stateKeys = Object.keys(state.state)

      toolsCode += `
  const ${state.id}Store = use${storeName}Store()

  server.registerTool(
    "get-${state.id}-state",
    {
      title: "获取${storeName}状态",
      description: "获取当前${storeName}的状态信息",
      inputSchema: {},
    },
    async () => {
      try {
        return {
          content: [{
            type: "text",
            text: \`${storeName}状态：\${JSON.stringify(${state.id}Store.$state, null, 2)}\`
          }],
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: \`获取${storeName}状态失败：\${error}\`
          }],
        }
      }
    }
  )`

      // 为状态中的每个属性生成更新工具
      stateKeys.forEach((key) => {
        toolsCode += `

  server.registerTool(
    "update-${state.id}-${key}",
    {
      title: "更新${storeName}的${key}",
      description: "更新${storeName}状态中的${key}属性",
      inputSchema: {
        value: z.any().describe("新的${key}值"),
      },
    },
    async ({ value }: { value: any }) => {
      try {
        ${state.id}Store.${key} = value
        return {
          content: [{
            type: "text",
            text: \`${storeName}的${key}已更新为：\${JSON.stringify(value)}\`
          }],
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: \`更新${storeName}的${key}失败：\${error}\`
          }],
        }
      }
    }
  )`
      })
    }
  })

  toolsCode += `
}`

  return toolsCode
}

/**
 * 工具生成器注册表（配置驱动）
 * 新增工具只需在此添加对应的生成函数
 */
const toolGenerators = {
  navigation: generateNavigationTools,
  application: generateApplicationTools
}

/**
 * 生成 MCP 服务器文件（使用模板）
 * @param {Array} enabledTools 启用的工具类别
 * @returns {string} MCP 服务器代码
 */
function generateMcpServer(enabledTools) {
  return mcpServerTemplate(null, { enabledTools })
}

/**
 * 生成基础配置文件（使用模板）
 * @param {Object} config MCP 配置
 * @returns {string} 基础配置代码
 */
function generateBaseConfig(config) {
  return mcpBaseTemplate(null, {
    agentRoot: config.agentRoot,
    sessionId: config.sessionId
  })
}

/**
 * 修改 main.ts/main.js 文件以包含 MCP 样式
 * @param {string} originalContent 原始 main.ts/main.js 内容
 * @returns {string} 修改后的内容
 */
function modifyMainTs(originalContent) {
  // 检查是否已经包含两个样式导入
  const hasTinyRobot = originalContent.includes('@opentiny/tiny-robot/dist/style.css')
  const hasNextRemoter = originalContent.includes('@opentiny/next-remoter/dist/style.css')

  // 如果两个都已存在，直接返回
  if (hasTinyRobot && hasNextRemoter) {
    return originalContent
  }

  // 查找第一个 import 语句的位置
  const lines = originalContent.split('\n')
  let insertIndex = 0

  // 找到第一个非注释的 import 语句后插入
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('import ') && !line.includes('//')) {
      insertIndex = i + 1
      break
    }
  }

  // 只插入缺失的样式导入
  if (!hasTinyRobot) {
    lines.splice(insertIndex, 0, "import '@opentiny/tiny-robot/dist/style.css'")
    insertIndex++ // 更新插入位置
  }

  if (!hasNextRemoter) {
    lines.splice(insertIndex, 0, "import '@opentiny/next-remoter/dist/style.css'")
  }

  return lines.join('\n')
}

/**
 * 辅助函数：添加必要的 imports
 * @param {string} newScript 新脚本内容
 * @param {string} existingScript 现有脚本内容
 * @returns {string} 修改后的脚本
 */
function addRequiredImports(newScript, existingScript) {
  if (!existingScript.includes('provide')) {
    newScript = `import { provide, onMounted } from "vue";\n${newScript}`
  } else if (!existingScript.includes('onMounted')) {
    newScript = newScript.replace('import { provide', 'import { provide, onMounted')
  }

  if (!existingScript.includes('useRouter')) {
    newScript = `import { useRouter } from "vue-router";\n${newScript}`
  }

  return newScript
}

/**
 * 辅助函数：添加或修改 onMounted
 * @param {string} newScript 新脚本内容
 * @param {string} existingScript 现有脚本内容
 * @param {string} mcpOnMountedCode MCP onMounted 代码
 * @returns {string} 修改后的脚本
 */
function addOrModifyOnMounted(newScript, existingScript, mcpOnMountedCode) {
  if (existingScript.includes('onMounted(')) {
    // 已有 onMounted，在其中添加 MCP 初始化
    newScript = newScript.replace(/onMounted\(\(\) => \{([\s\S]*?)\}\)/, (_, content) => {
      return `onMounted(() => {${content}\n${mcpOnMountedCode}\n})`
    })
  } else {
    // 没有 onMounted，添加新的
    newScript += `\n\nonMounted(() => {\n${mcpOnMountedCode}\n});`
  }
  return newScript
}

/**
 * 辅助函数：添加 MCP 模板
 * @param {string} content 内容
 * @param {string} mcpTemplate MCP 模板代码
 * @returns {string} 修改后的内容
 */
function addMcpTemplate(content, mcpTemplate) {
  if (!content.includes('<TinyRemoter')) {
    content = content.replace('</template>', `${mcpTemplate}\n  </template>`)
  }
  return content
}

/**
 * 辅助函数：添加 MCP 样式
 * @param {string} content 内容
 * @param {string} mcpStyle MCP 样式代码
 * @returns {string} 修改后的内容
 */
function addMcpStyle(content, mcpStyle) {
  if (content.includes('<style')) {
    content = content.replace(/<\/style>/, `${mcpStyle}\n</style>`)
  } else {
    content += `\n\n<style scoped>${mcpStyle}\n</style>`
  }
  return content
}

/**
 * 辅助函数：创建新的 script setup
 * @param {string} originalContent 原始内容
 * @param {string} mcpImports MCP imports
 * @param {string} mcpSetup MCP setup 代码
 * @param {string} mcpTemplate MCP 模板
 * @param {string} mcpStyle MCP 样式
 * @param {string} mcpOnMountedCode MCP onMounted 代码
 * @returns {string} 修改后的内容
 */
function createNewScriptSetup(originalContent, mcpImports, mcpSetup, mcpTemplate, mcpStyle, mcpOnMountedCode) {
  const mcpScript = `<script setup lang="ts">
${mcpImports}
import { useRouter } from "vue-router";
import { I18nInjectionKey } from 'vue-i18n'
import { provide, onMounted } from 'vue'
import i18n from './i18n'

provide(I18nInjectionKey, i18n)

const router = useRouter();
${mcpSetup}

onMounted(() => {
${mcpOnMountedCode}
});
</script>`

  let modifiedContent = originalContent.replace(/<template>/, `${mcpScript}\n\n<template>`)
  modifiedContent = addMcpTemplate(modifiedContent, mcpTemplate)
  modifiedContent = addMcpStyle(modifiedContent, mcpStyle)

  return modifiedContent
}

/**
 * 辅助函数：修改已有的 script setup
 * @param {string} originalContent 原始内容
 * @param {Object} scriptSetupMatch script setup 匹配结果
 * @param {string} mcpImports MCP imports
 * @param {string} mcpSetup MCP setup 代码
 * @param {string} mcpTemplate MCP 模板
 * @param {string} mcpStyle MCP 样式
 * @param {string} mcpOnMountedCode MCP onMounted 代码
 * @returns {string} 修改后的内容
 */
function modifyExistingScriptSetup(
  originalContent,
  scriptSetupMatch,
  mcpImports,
  mcpSetup,
  mcpTemplate,
  mcpStyle,
  mcpOnMountedCode
) {
  const existingScript = scriptSetupMatch[1]
  let newScript = existingScript

  // 添加必要的 imports
  newScript = addRequiredImports(newScript, existingScript)
  newScript = `${mcpImports}\n${newScript}`

  // 添加 router 变量（如果不存在）
  if (!existingScript.includes('const router')) {
    newScript += `\nconst router = useRouter();`
  }

  // 添加 MCP 设置代码
  newScript += mcpSetup

  // 修改或添加 onMounted
  newScript = addOrModifyOnMounted(newScript, existingScript, mcpOnMountedCode)

  // 替换原始脚本
  let modifiedContent = originalContent.replace(
    scriptSetupMatch[0],
    `<script setup lang="ts">\n${newScript}\n</script>`
  )

  // 添加模板和样式
  modifiedContent = addMcpTemplate(modifiedContent, mcpTemplate)
  modifiedContent = addMcpStyle(modifiedContent, mcpStyle)

  return modifiedContent
}

/**
 * 修改 App.vue 文件以包含 MCP 集成
 * @param {string} originalContent 原始 App.vue 内容
 * @param {Object} config MCP 配置
 * @returns {string} 修改后的 App.vue 内容
 */
function modifyAppVue(originalContent, config) {
  // 如果已经包含 MCP 集成，则不重复添加
  if (originalContent.includes('TinyRemoter') || originalContent.includes('mcpServerManager')) {
    return originalContent
  }

  // 获取模板内容
  const mcpImports = mcpImportsTemplate()
  const mcpSetup = mcpSetupTemplate(null, { capabilities: config.capabilities })
  const mcpTemplate = mcpTemplateTemplate()
  const mcpStyle = mcpStyleTemplate()
  const mcpOnMountedCode = mcpOnMountedTemplate()

  // 提取 script setup 部分
  const scriptSetupMatch = originalContent.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)

  if (!scriptSetupMatch) {
    // 没有 script setup，创建完整的新 script
    return createNewScriptSetup(originalContent, mcpImports, mcpSetup, mcpTemplate, mcpStyle, mcpOnMountedCode)
  }

  // 已有 script setup，修改它
  return modifyExistingScriptSetup(
    originalContent,
    scriptSetupMatch,
    mcpImports,
    mcpSetup,
    mcpTemplate,
    mcpStyle,
    mcpOnMountedCode
  )
}

/**
 * 检测组件是否包含 tiny_mcp_config 配置
 * @param {Object} schema 组件 schema
 * @returns {boolean} 是否包含 MCP 配置
 */
function hasTinyMcpConfig(schema) {
  if (!schema || typeof schema !== 'object') {
    return false
  }

  // 检查当前组件的 props
  if (schema.props && schema.props.tiny_mcp_config) {
    return true
  }

  // 递归检查子组件
  if (Array.isArray(schema.children)) {
    return schema.children.some((child) => hasTinyMcpConfig(child))
  }

  return false
}

/**
 * 检测页面 schema 是否包含 tiny_mcp_config 配置
 * @param {Object} pageSchema 页面 schema
 * @returns {boolean} 是否包含 MCP 配置
 */
function pageHasTinyMcpConfig(pageSchema) {
  if (!pageSchema || typeof pageSchema !== 'object') {
    return false
  }

  return hasTinyMcpConfig(pageSchema)
}

/**
 * 转换 tiny_mcp_config 配置格式
 * @param {Object} schema 组件 schema
 * @returns {Object} 转换后的 schema
 */
function transformTinyMcpConfig(schema) {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  // 处理当前组件的 tiny_mcp_config
  if (schema.props && schema.props.tiny_mcp_config) {
    const mcpConfig = schema.props.tiny_mcp_config

    // 检查是否是简单格式（只有 id 和 description）
    if (
      mcpConfig &&
      typeof mcpConfig === 'object' &&
      mcpConfig.id &&
      mcpConfig.description &&
      !mcpConfig.server &&
      !mcpConfig.business
    ) {
      // 转换为完整格式
      schema.props.tiny_mcp_config = {
        type: JS_EXPRESSION,
        value: `{
          server,
          business: {
            id: ${JSON.stringify(mcpConfig.id)},
            description: ${JSON.stringify(mcpConfig.description)}
          }
        }`
      }
    }
  }

  // 递归处理子组件
  if (Array.isArray(schema.children)) {
    schema.children = schema.children.map((child) => transformTinyMcpConfig(child))
  }

  return schema
}

/**
 * 验证 MCP 插件配置
 * @param {Object} config MCP 配置
 * @returns {Object} 验证结果
 */
function validateMcpConfig(config) {
  const errors = []
  const warnings = []

  // 验证必需的配置项
  if (config.enabled && typeof config.enabled !== 'boolean') {
    errors.push('enabled 必须是布尔值')
  }

  if (config.agentRoot && typeof config.agentRoot !== 'string') {
    errors.push('agentRoot 必须是字符串')
  }

  if (config.sessionId && typeof config.sessionId !== 'string') {
    errors.push('sessionId 必须是字符串')
  }

  // 验证 URL 格式
  if (config.agentRoot && config.agentRoot !== '') {
    try {
      new URL(config.agentRoot)
    } catch (e) {
      errors.push('agentRoot 必须是有效的 URL')
    }
  }

  // 验证工具配置
  if (config.tools && typeof config.tools !== 'object') {
    errors.push('tools 必须是对象')
  } else if (config.tools) {
    const validTools = ['navigation', 'application']
    Object.keys(config.tools).forEach((tool) => {
      if (!validTools.includes(tool)) {
        warnings.push(`未知的工具类型: ${tool}`)
      }
      if (typeof config.tools[tool] !== 'boolean') {
        errors.push(`工具 ${tool} 的值必须是布尔值`)
      }
    })
  }

  // 验证自定义工具
  if (config.customTools && !Array.isArray(config.customTools)) {
    errors.push('customTools 必须是数组')
  } else if (config.customTools) {
    config.customTools.forEach((tool, index) => {
      if (!tool.name || typeof tool.name !== 'string') {
        errors.push(`自定义工具 ${index} 必须有有效的 name 属性`)
      }
      if (!tool.implementation || typeof tool.implementation !== 'string') {
        errors.push(`自定义工具 ${index} 必须有有效的 implementation 属性`)
      }
    })
  }

  // 验证能力配置
  if (config.capabilities && typeof config.capabilities !== 'object') {
    errors.push('capabilities 必须是对象')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

function genMcpPlugin(options = {}) {
  // 验证配置
  const validation = validateMcpConfig(options)
  if (!validation.isValid) {
    throw new Error(`MCP 插件配置无效: ${validation.errors.join(', ')}`)
  }

  // 输出警告
  if (validation.warnings.length > 0) {
    validation.warnings.forEach((warning) => {
      // eslint-disable-next-line no-console
      console.warn('MCP 插件配置警告:', warning)
    })
  }

  const realOptions = mergeOptions(defaultOption, options)

  return {
    name: 'tinyEngine-generateCode-plugin-mcp',
    description: 'generate MCP (Model Context Protocol) integration files',

    /**
     * 生成 MCP 集成文件
     * @param {import('@opentiny/tiny-engine-dsl-vue').IAppSchema} schema
     * @returns
     */
    run(schema) {
      // 如果 MCP 未启用，直接返回空数组，不生成任何文件
      if (!realOptions.enabled) {
        return []
      }

      try {
        const files = []
        const { tools } = realOptions

        // 确定启用的工具类别
        const enabledTools = Object.keys(tools).filter((tool) => tools[tool])

        // 生成基础配置文件
        files.push({
          fileType: 'ts',
          fileName: 'base.ts',
          path: './src',
          fileContent: generateBaseConfig(realOptions)
        })

        // 生成 MCP 服务器文件
        files.push({
          fileType: 'ts',
          fileName: 'server.ts',
          path: './src/mcp',
          fileContent: generateMcpServer(enabledTools)
        })

        // 使用配置驱动的方式生成工具文件
        Object.entries(tools).forEach(([toolName, enabled]) => {
          if (enabled && toolGenerators[toolName]) {
            try {
              const generator = toolGenerators[toolName]
              const toolFileName = `${toolName}Tools.ts`

              files.push({
                fileType: 'ts',
                fileName: toolFileName,
                path: './src/mcp/tools',
                fileContent: generator(toolName === 'navigation' ? schema.pageSchema || [] : schema)
              })
            } catch (error) {
              if (this.addLog) {
                this.addLog({
                  type: 'warning',
                  message: `${toolName} 工具生成失败: ${error.message}`,
                  plugin: 'genMcpPlugin'
                })
              }
            }
          } else if (enabled && !toolGenerators[toolName]) {
            // 工具已启用但未找到对应的生成器
            if (this.addLog) {
              this.addLog({
                type: 'warning',
                message: `未找到 ${toolName} 工具的生成器，请检查 toolGenerators 配置`,
                plugin: 'genMcpPlugin'
              })
            }
          }
        })

        // 检查并处理页面中的 tiny_mcp_config 配置
        let hasPageMcpConfig = false
        const pagesWithMcpConfig = []

        if (schema.pageSchema && Array.isArray(schema.pageSchema)) {
          schema.pageSchema.forEach((page) => {
            if (pageHasTinyMcpConfig(page)) {
              hasPageMcpConfig = true
              pagesWithMcpConfig.push({
                fileName: page.fileName || page.id || 'unknown-page',
                schema: page
              })
              // 转换页面中的 tiny_mcp_config 配置
              transformTinyMcpConfig(page)
            }
          })
        }

        // 只有在 MCP 启用时才修改 App.vue 和 main.ts 文件
        if (realOptions.enabled) {
          // 修改 App.vue 文件
          const existingAppVue = this.getFile('./src', 'App.vue')
          if (existingAppVue) {
            const modifiedAppVue = modifyAppVue(existingAppVue.fileContent, realOptions)
            this.replaceFile({
              fileType: 'vue',
              fileName: 'App.vue',
              path: './src',
              fileContent: modifiedAppVue
            })
          }

          // 修改 main.ts 文件以包含 MCP 样式
          const existingMainTs = this.getFile('./src', 'main.ts') || this.getFile('./src', 'main.js')
          if (existingMainTs && existingMainTs.fileName) {
            const modifiedMainTs = modifyMainTs(existingMainTs.fileContent)
            this.replaceFile({
              fileType: existingMainTs.fileName.endsWith('.ts') ? 'ts' : 'js',
              fileName: existingMainTs.fileName,
              path: './src',
              fileContent: modifiedMainTs
            })
          }
        }

        // 如果检测到页面使用了 tiny_mcp_config，添加日志信息
        if (hasPageMcpConfig && this.addLog) {
          this.addLog({
            type: 'info',
            message: '检测到页面使用了 tiny_mcp_config，已自动转换为完整格式',
            plugin: 'genMcpPlugin'
          })
        }

        return files
      } catch (error) {
        // 记录错误但不中断整个生成过程
        // eslint-disable-next-line no-console
        console.error('MCP 插件生成失败:', error)

        // 添加错误日志到上下文
        if (this.addLog) {
          this.addLog({
            type: 'error',
            message: `MCP 插件生成失败: ${error.message}`,
            plugin: 'genMcpPlugin',
            stack: error.stack
          })
        }

        // 优雅降级：返回空数组，让其他插件继续工作
        return []
      }
    }
  }
}

// 导出属性转换钩子，供其他生成器使用
export const handleTinyMcpConfigAttrHook = (schemaData, globalHooks, config) => {
  // 早期返回：如果 MCP 未启用，直接返回，不处理任何 tiny_mcp_config
  if (config?.mcpEnabled === false) {
    return
  }

  const { schema: { props = {} } = {} } = schemaData || {}

  // 检查是否有 tiny_mcp_config 属性
  if (props.tiny_mcp_config) {
    const mcpConfig = props.tiny_mcp_config

    // 检查是否是简单格式（只有 id 和 description，且不是 JSExpression）
    if (
      mcpConfig &&
      typeof mcpConfig === 'object' &&
      !mcpConfig.type && // 不是 JSExpression 或其他特殊类型
      mcpConfig.id &&
      mcpConfig.description &&
      !mcpConfig.server &&
      !mcpConfig.business
    ) {
      // 转换为完整格式的 JSExpression
      const transformedConfig = {
        type: 'JSExpression',
        value: `{ server, business: { id: ${JSON.stringify(mcpConfig.id)}, description: ${JSON.stringify(
          mcpConfig.description
        )} } }`
      }

      // 更新 props
      props.tiny_mcp_config = transformedConfig

      // 确保页面中有 server 变量的导入
      if (globalHooks && globalHooks.addImport) {
        globalHooks.addImport('../mcp/server', {
          destructuring: true,
          componentName: 'usePageMcpServer',
          exportName: 'usePageMcpServer'
        })
      }

      // 添加页面级别的 MCP 服务器初始化代码
      if (globalHooks && globalHooks.addStatement) {
        const pageId = config?.pageId || config?.fileName || 'current-page'

        // 使用 JSON.stringify 来转义 pageId，防止特殊字符破坏生成的代码
        const pageIdLiteral = JSON.stringify(pageId)
        const descriptionLiteral = JSON.stringify(`${pageId}页面`)

        // 添加必要的导入
        globalHooks.addImport('vue', {
          destructuring: true,
          componentName: 'onMounted',
          exportName: 'onMounted'
        })

        globalHooks.addImport('vue', {
          destructuring: true,
          componentName: 'onUnmounted',
          exportName: 'onUnmounted'
        })

        // 添加 MCP 服务器初始化代码
        globalHooks.addStatement({
          position: INSERT_POSITION.AFTER_METHODS,
          value: `
// 使用统一管理的页面服务器
const { server, connect, disconnect } = usePageMcpServer(${pageIdLiteral}, {
  business: {
    id: ${pageIdLiteral},
    description: ${descriptionLiteral}
  }
})

// 连接服务器
onMounted(async () => {
  await connect()
})

// 组件卸载时清理资源（自动断开连接）
onUnmounted(() => {
  disconnect()
})`,
          key: 'mcpServerInit'
        })
      }
    }
  }
}

export default genMcpPlugin
