const reasoningExtraBody = {
  extraBody: {
    enable: {
      enable_thinking: true,
      thinking_budget: 1000
    },
    disable: null
  }
}

const jsonOutputExtraBody = {
  extraBody: {
    enable: { response_format: { type: 'json_object' } },
    disable: null
  }
}

const bailianJsonOutputExtraBody = {
  extraBody: {
    enable: {
      response_format: { type: 'json_object' },
      enable_thinking: false // 千问模型不支持思考模式下输出json
    },
    disable: null
  }
}

export const DEFAULT_LLM_MODELS = [
  {
    provider: 'bailian',
    label: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    allowEmptyApiKey: false,
    models: [
      // Agent/chat
      {
        label: 'Qwen 通用模型（Plus）',
        name: 'qwen-plus',
        capabilities: {
          toolCalling: true,
          reasoning: reasoningExtraBody,
          jsonOutput: bailianJsonOutputExtraBody
        }
      },
      // 备注：千问多模态模型不支持工具调用；
      {
        label: 'Qwen VL视觉理解模型（PLUS）',
        name: 'qwen3-vl-plus',
        capabilities: {
          vision: true,
          reasoning: reasoningExtraBody,
          jsonOutput: bailianJsonOutputExtraBody
        }
      },
      {
        label: 'Qwen Coder编程模型（PLUS）',
        name: 'qwen3-coder-plus',
        capabilities: {
          toolCalling: true,
          reasoning: reasoningExtraBody,
          jsonOutput: bailianJsonOutputExtraBody
        }
      },
      {
        label: 'DeepSeek（v3.2）',
        name: 'deepseek-v3.2-exp',
        capabilities: {
          toolCalling: true,
          reasoning: reasoningExtraBody,
          jsonOutput: bailianJsonOutputExtraBody
        }
      },
      // 小参数模型
      {
        label: 'Qwen 通用模型（Flash）',
        name: 'qwen-flash',
        capabilities: {
          toolCalling: true,
          compact: true,
          jsonOutput: bailianJsonOutputExtraBody
        }
      },
      {
        label: 'Qwen Coder编程模型（Flash）',
        name: 'qwen3-coder-flash',
        capabilities: {
          toolCalling: true,
          compact: true,
          jsonOutput: bailianJsonOutputExtraBody
        }
      },
      {
        label: 'Qwen3（14b）',
        name: 'qwen3-14b',
        capabilities: { compact: true, toolCalling: true, jsonOutput: bailianJsonOutputExtraBody }
      },
      {
        label: 'Qwen3（8b）',
        name: 'qwen3-8b',
        capabilities: { compact: true, toolCalling: true, jsonOutput: bailianJsonOutputExtraBody }
      }
    ]
  },
  {
    provider: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    allowEmptyApiKey: false,
    models: [
      {
        label: 'DeepSeek',
        name: 'deepseek-chat',
        capabilities: {
          toolCalling: true,
          reasoning: {
            extraBody: {
              enable: { model: 'deepseek-reasoner' },
              disable: { model: 'deepseek-chat' }
            }
          },
          jsonOutput: jsonOutputExtraBody
        }
      }
    ]
  }
]
