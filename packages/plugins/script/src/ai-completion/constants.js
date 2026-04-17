/**
 * Qwen Coder API 配置（阿里云百炼）
 */
export const QWEN_CONFIG = {
  COMPLETION_PATH: '/completions', // Completions API 路径（追加到 baseUrl）
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
 * DeepSeek Coder API 配置
 */
export const DEEPSEEK_CONFIG = {
  COMPLETION_PATH: '/beta', // FIM 补全 API 路径
  PATH_REPLACE: '/v1', // 需要从 baseUrl 中替换的路径
  DEFAULT_TEMPERATURE: 0,
  TOP_P: 1.0,

  // FIM (Fill-In-the-Middle) 配置
  FIM: {
    MAX_PREFIX_LINES: 100,
    MAX_SUFFIX_LINES: 50,
    MAX_TOKENS: 4096 // FIM 最大补全长度 4K
  }
}

/**
 * 模型配置
 */
export const MODEL_CONFIG = {
  QWEN: {
    TYPE: 'qwen',
    COMPLETION_MODELS: ['qwen-coder-turbo-latest', 'qwen-coder-turbo-0919', 'qwen-coder-turbo'],
    COMPLETION_MODEL_PATTERNS: [/^qwen2\.5-coder-(7|14|32)b-instruct$/]
  },
  DEEPSEEK: {
    TYPE: 'deepseek',
    COMPLETION_MODELS: ['deepseek-chat', 'deepseek-coder'],
    COMPLETION_MODEL_PATTERNS: []
  },
  UNKNOWN: {
    TYPE: 'unknown'
  }
}

/**
 * HTTP 请求配置
 */
export const HTTP_CONFIG = {
  METHOD: 'POST',
  CONTENT_TYPE: 'application/json',
  STREAM: false,
  REQUEST_TIMEOUT_MS: 15000
}

/**
 * 默认配置
 */
export const DEFAULTS = {
  LANGUAGE: 'javascript'
}

/**
 * 错误消息配置
 */
export const ERROR_MESSAGES = {
  CONFIG_MISSING: 'AI 配置未设置（缺少 model/apiKey/baseUrl）',
  API_KEY_MISSING: 'AI 配置未设置（缺少 API Key）',
  UNSUPPORTED_MODEL: '当前代码补全模型未配置可用的补全协议，请在模型设置中指定协议或选择内置代码模型',
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

// 停止符配置（API 限制：最多 16 个）
export const STOP_SEQUENCES = {
  CORE: ['\n\n', '```'],
  NEW_SCOPE: ['\nfunction ', '\nclass ', '\nexport ', '\nimport '],
  BLOCK_END: ['\n}', '\n};']
}

// 上下文特定停止符
export const CONTEXT_STOP_SEQUENCES = {
  EXPRESSION: [';', ',', '\n)'],
  COMMENT: ['\n\n', '*/'],
  OBJECT: ['\n}', '\n};'],
  FUNCTION: ['\n}', '\nfunction ', '\nreturn ']
}

// FIM 标记配置
export const FIM_CONFIG = {
  MARKERS: {
    PREFIX: '<|fim_prefix|>',
    SUFFIX: '<|fim_suffix|>',
    MIDDLE: '<|fim_middle|>',
    CURSOR: '[CURSOR]'
  }
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
  // 匹配接口定义（TS）
  INTERFACE: /interface\s+(\w+)/,
  // 匹配类型定义（TS）
  TYPE: /type\s+(\w+)/
}
