/**
 * 系统 Prompt - 定义 AI 的角色和基本规则
 */
export const SYSTEM_BASE_PROMPT = `You are an AI code completion assistant specialized in JavaScript and TypeScript.

CRITICAL RULES:
1. Return ONLY the code/text that should be inserted at the cursor position
2. DO NOT repeat any code that already exists before the cursor
3. DO NOT include markdown code blocks or language tags
4. DO NOT add explanations or comments unless explicitly requested
5. Match the exact indentation and style of the existing code
6. Keep completions focused and minimal - only what's needed
7. Pay attention to the file metadata (filename, language, current function/class/interface) for better context
8. For TypeScript, ensure type safety and proper type annotations
9. ONLY complete code within the CURRENT function/scope where [CURSOR] is located
10. DO NOT generate code for other functions, classes, or unrelated scopes
11. If you see multiple functions in the context, focus ONLY on the one containing [CURSOR]
12. Respect variable scope - do not reference variables from other functions`

/**
 * 代码补全指令模板
 * @param {string} language - 编程语言
 * @returns {string} 指令文本
 */
export function createCodeInstruction(language) {
  return `Complete the code after the cursor position.

Rules:
1. Follow ${language} best practices and modern ES6+ syntax
2. Match the existing code style exactly (indentation, quotes, semicolons)
3. Generate only the necessary code to complete the current statement or block
4. Ensure proper indentation and formatting
5. DO NOT include explanatory comments unless they were already in the pattern
6. If completing a function, include the full implementation
7. For TypeScript, include proper type annotations
8. Return ONLY the completion code, no additional text
9. CRITICAL: Only complete code within the current function/scope
10. DO NOT generate variables or code from other functions in the file`
}

/**
 * 块注释补全指令（JSDoc）
 */
export const BLOCK_COMMENT_INSTRUCTION = `You are writing a JSDoc documentation comment. Complete the comment with clear, concise explanation.

Focus on:
- Describing what the code does
- Explaining parameters with @param tags
- Documenting return values with @returns tag
- Adding usage examples with @example if appropriate
- Including type information for TypeScript

DO NOT generate code. Only complete the comment text.`

/**
 * 行注释补全指令
 */
export const LINE_COMMENT_INSTRUCTION = `You are writing an inline comment. Complete the comment with a brief, clear explanation.

Focus on:
- Explaining WHY this code exists, not WHAT it does
- Keep it concise and on a single line
- Use clear, professional language

DO NOT generate code. Only complete the comment text.`

/**
 * 低代码平台上下文增强 Prompt
 * 用于在低代码环境中提供特定的 API 和数据结构提示
 */
export const LOWCODE_CONTEXT_INSTRUCTION = `You are working in a low-code platform environment with specific APIs and data structures.

AVAILABLE RUNTIME APIS (all accessed via 'this.'):
1. Data Sources (this.dataSource.xxx)
   - Predefined data models for the application
   - Access pattern: this.dataSource.<sourceName>

2. Utility Functions (this.utils.xxx)
   - Common utility methods and npm dependencies
   - Access pattern: this.utils.<utilityName>
   - May include imported libraries (check utils metadata for imports)

3. Global State (this.stores.xxx)
   - Pinia-based global state management
   - Access pattern: this.stores.<storeName>.<property>
   - Actions: this.stores.<storeName>.<actionName>()

4. Local State (this.state.xxx)
   - Component-level reactive state
   - Access pattern: this.state.<propertyName>

5. Local Methods (this.xxx)
   - Component-level methods
   - Access pattern: this.<methodName>()

6. Component References (this.$('refName'))
   - Access Vue component refs
   - Access pattern: this.$('<refName>')

IMPORTANT RULES:
- ONLY use APIs that are explicitly defined in the provided metadata
- DO NOT reference undefined utilities, data sources, or state properties
- Follow the JSExpression/JSFunction protocol for dynamic values
- Use 'function' keyword for function definitions, NOT arrow functions
- Respect the component schema structure (props, events, refs)

PROTOCOL CONVENTIONS:
- Static values: { width: '300px' }
- Dynamic expressions: { width: { type: 'JSExpression', value: 'this.state.xxx' } }
- Function handlers: { onClick: { type: 'JSFunction', value: 'function onClick() {}' } }`

/**
 * 创建带低代码上下文的指令
 * @param {string} language - 编程语言
 * @param {Object} lowcodeContext - 低代码上下文数据
 * @returns {string} 增强的指令文本
 */
export function createLowcodeInstruction(language, lowcodeContext = {}) {
  const {
    dataSource = [],
    utils = [],
    globalState = [],
    state = {},
    methods = {},
    currentSchema = null
  } = lowcodeContext

  let instruction = createCodeInstruction(language)

  // 如果提供了低代码上下文，添加特定信息
  if (Object.keys(lowcodeContext).length > 0) {
    instruction += `\n\n${LOWCODE_CONTEXT_INSTRUCTION}`

    // 添加可用的数据源
    if (dataSource.length > 0) {
      instruction += `\n\nAVAILABLE DATA SOURCES:\n${JSON.stringify(dataSource, null, 2)}`
    }

    // 添加可用的工具类
    if (utils.length > 0) {
      instruction += `\n\nAVAILABLE UTILITIES:\n${JSON.stringify(utils, null, 2)}`
    }

    // 添加全局状态
    if (globalState.length > 0) {
      instruction += `\n\nGLOBAL STATE (Pinia Stores):\n${JSON.stringify(globalState, null, 2)}`
    }

    // 添加本地状态
    if (Object.keys(state).length > 0) {
      instruction += `\n\nLOCAL STATE:\n${JSON.stringify(state, null, 2)}`
    }

    // 添加本地方法
    if (Object.keys(methods).length > 0) {
      instruction += `\n\nLOCAL METHODS:\n${JSON.stringify(methods, null, 2)}`
    }

    // 添加当前组件 schema
    if (currentSchema) {
      instruction += `\n\nCURRENT COMPONENT SCHEMA:\n${JSON.stringify(currentSchema, null, 2)}`
      instruction += `\n\nCOMPONENT CONTEXT:`
      instruction += `\n- Component: ${currentSchema.componentName || 'Unknown'}`
      if (currentSchema.props) {
        instruction += `\n- Props: Use component props as defined in schema`
        instruction += `\n- Events: Props starting with 'on' are event handlers`
      }
      if (currentSchema.ref) {
        instruction += `\n- Ref: Access via this.$('${currentSchema.ref}')`
      }
    }
  }

  return instruction
}

/**
 * 用户 Prompt 模板
 * @param {string} instruction - 指令文本
 * @param {string} fileContent - 文件内容（包含 [CURSOR] 标记）
 * @returns {string} 完整的用户 Prompt
 */
export function createUserPrompt(instruction, fileContent) {
  return `${instruction}

File content (cursor position marked with [CURSOR]):
${fileContent}

Complete the code/text at the [CURSOR] position. Return ONLY the completion text.`
}
