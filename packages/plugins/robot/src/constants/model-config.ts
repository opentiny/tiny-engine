const reasoningExtraBody = {
  extraBody: {
    enable: {
      enable_thinking: true,
      thinking_budget: 1000
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
          reasoning: reasoningExtraBody
        }
      },
      // 备注：千问多模态模型不支持工具调用；
      {
        label: 'Qwen VL视觉理解模型（PLUS）',
        name: 'qwen3-vl-plus',
        capabilities: {
          vision: true,
          reasoning: reasoningExtraBody
        }
      },
      {
        label: 'Qwen Coder编程模型（PLUS）',
        name: 'qwen3-coder-plus',
        capabilities: {
          toolCalling: true,
          reasoning: reasoningExtraBody
        }
      },
      {
        label: 'DeepSeek（v3.2）',
        name: 'deepseek-v3.2-exp',
        capabilities: {
          toolCalling: true,
          reasoning: reasoningExtraBody
        }
      },
      // 小参数模型
      {
        label: 'Qwen 通用模型（Flash）',
        name: 'qwen-flash',
        capabilities: {
          compact: true
        }
      },
      {
        label: 'Qwen Coder编程模型（Flash）',
        name: 'qwen3-coder-flash',
        capabilities: {
          compact: true
        }
      },
      { label: 'Qwen3（14b）', name: 'qwen3-14b', capabilities: { compact: true } },
      { label: 'Qwen3（8b）', name: 'qwen3-8b', capabilities: { compact: true } }
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
          }
        }
      }
    ]
  },
  {
    provider: 'GLM',
    label: '智谱模型',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    allowEmptyApiKey: false,
    models: [
      {
        label: 'GLM视觉理解模型',
        name: 'glm-4.5v',
        capabilities: {
          vision: true,
          reasoning: {
            extraBody: {
              enable: {
                thinking: {
                  type: 'enabled'
                }
              },
              disable: null
            }
          }
        }
      },
      {
        label: 'GLM-4.5推理模型',
        name: 'glm-4.5',
        capabilities: {
          toolCalling: true,
          reasoning: {
            extraBody: {
              enable: {
                thinking: {
                  type: 'enabled'
                }
              },
              disable: null
            }
          }
        }
      },
      {
        label: 'GLM-4.5 air推理模型',
        name: 'glm-4.5-air',
        capabilities: {
          toolCalling: true,
          reasoning: {
            extraBody: {
              enable: {
                thinking: {
                  type: 'enabled'
                }
              },
              disable: null
            }
          }
        }
      }
    ]
  },
  {
    provider: 'Google',
    label: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    allowEmptyApiKey: true,
    models: [
      {
        label: 'Google: Gemini 3 Pro',
        name: 'gemini-3-pro-preview',
        capabilities: {
          vision: true,
          toolCalling: true,
          reasoning: true
        }
      },
      {
        label: 'Google: Gemini 2.5 Pro',
        name: 'gemini-2.5-pro',
        capabilities: {
          toolCalling: true,
          reasoning: true
        }
      }
    ]
  },
  {
    provider: 'OpenRouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    allowEmptyApiKey: false,
    models: [
      {
        label: 'Google: Gemini 3 Pro',
        name: 'gemini-3-pro-preview',
        capabilities: {
          toolCalling: true,
          reasoning: true
        }
      },
      {
        label: 'Google: Gemini 2.5 Pro',
        name: 'google/gemini-2.5-pro',
        capabilities: {
          toolCalling: true,
          reasoning: true
        }
      }
    ]
  }
]
