/**
 * Qwen Coder API 配置（阿里云百炼）
 */
export const QWEN_CONFIG = {
  API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/completions',
  MODEL: 'qwen2.5-coder-32b-instruct',
  DEFAULT_TEMPERATURE: 0.05,
  TOP_P: 0.95,
  PRESENCE_PENALTY: 0.2,

  // FIM (Fill-In-the-Middle) 优化配置
  FIM: {
    MAX_PREFIX_LINES: 100,
    MAX_SUFFIX_LINES: 50
  }
}

/**
 * 模型配置
 */
export const MODEL_CONFIG = {
  QWEN: {
    TYPE: 'qwen',
    KEYWORDS: ['qwen'] // 移除 'coder'，避免误匹配 deepseek-coder
  },
  DEEPSEEK: {
    TYPE: 'deepseek',
    KEYWORDS: ['deepseek']
  },
  UNKNOWN: {
    TYPE: 'unknown',
    KEYWORDS: []
  }
}

/**
 * API 端点配置
 */
export const API_ENDPOINTS = {
  COMPLETIONS_PATH: '/completions',
  CHAT_COMPLETIONS: '/app-center/api/chat/completions'
}

/**
 * HTTP 请求配置
 */
export const HTTP_CONFIG = {
  METHOD: 'POST',
  CONTENT_TYPE: 'application/json',
  STREAM: false
}

/**
 * 默认配置
 */
export const DEFAULTS = {
  LANGUAGE: 'javascript',
  LOG_PREVIEW_LENGTH: 100,
  TECHNOLOGIES: []
}

/**
 * 错误消息配置
 */
export const ERROR_MESSAGES = {
  CONFIG_MISSING: 'AI 配置未设置（缺少 model/apiKey/baseUrl）',
  NO_COMPLETION: '未收到有效的补全结果',
  REQUEST_FAILED: '请求失败',
  QWEN_API_ERROR: 'Qwen API 错误'
}

/**
 * 通用模型配置
 */
export const MODEL_COMMON_CONFIG = {
  // Token 限制
  TOKEN_LIMITS: {
    EXPRESSION: 64,
    STATEMENT: 256,
    FUNCTION: 200,
    CLASS: 256,
    DEFAULT: 128
  },

  // 清理规则
  CLEANUP_PATTERNS: {
    MARKDOWN_CODE_BLOCK: /^```[\w]*\n?|```$/g,
    TRAILING_SEMICOLON: /;\s*$/,
    LEADING_EMPTY_LINES: /^\n+/,
    TRAILING_EMPTY_LINES: /\n+$/
  },

  // 智能截断配置
  TRUNCATION: {
    MAX_LINES: {
      EXPRESSION: 1,
      OBJECT: 5,
      DEFAULT: 10
    },
    CUTOFF_KEYWORDS: ['function ', 'class ', 'export ', 'import '],
    BLOCK_ENDINGS: ['}', '};']
  }
}

/**
 * 通用停止符配置（JS/TS）
 */
export const STOP_SEQUENCES = [
  // 通用停止符
  '\n\n',
  '```',

  // JS/TS 语言特性
  '\nfunction ',
  '\nclass ',
  '\nconst ',
  '\nlet ',
  '\nvar ',
  '\nexport ',
  '\nimport ',
  '\ninterface ',
  '\ntype ',
  '\nenum ',

  // 注释边界
  '\n//',
  '\n/*',

  // 代码块边界
  '\n}',
  '\n};'
]

/**
 * FIM (Fill-In-the-Middle) 配置
 */
export const FIM_CONFIG = {
  MARKERS: {
    PREFIX: '<|fim_prefix|>',
    SUFFIX: '<|fim_suffix|>',
    MIDDLE: '<|fim_middle|>',
    CURSOR: '[CURSOR]'
  },

  // FIM 专用停止符（会与 STOP_SEQUENCES 合并）
  FIM_MARKERS_STOPS: ['<|fim_prefix|>', '<|fim_suffix|>', '<|fim_middle|>'],

  // 上下文特定的额外停止符
  CONTEXT_STOPS: {
    EXPRESSION: [';', '\n)', ','],
    STATEMENT: [], // 使用通用停止符即可
    OBJECT: [] // 使用通用停止符即可
  },

  META_INFO_PATTERN:
    /^(\/\/ File:.*\n)?(\/\/ Language:.*\n)?(\/\/ Current .*\n)*(\/\/ IMPORTANT:.*\n)*(\/\/ Technologies:.*\n)?(\/\/ NOTE:.*\n)*\n*/
}

/**
 * 代码上下文分析配置
 */
export const CONTEXT_CONFIG = {
  MAX_LINES_TO_SCAN: 20
}

/**
 * 代码模式匹配（JS/TS）
 */
export const CODE_PATTERNS = {
  // 匹配函数定义：function name() / const name = () => / name() {
  FUNCTION: /function\s+(\w+)|const\s+(\w+)\s*=.*=>|(\w+)\s*\([^)]*\)\s*{/,
  // 匹配类定义
  CLASS: /class\s+(\w+)/,
  // 匹配接口定义（TS）
  INTERFACE: /interface\s+(\w+)/,
  // 匹配类型定义（TS）
  TYPE: /type\s+(\w+)/
}
