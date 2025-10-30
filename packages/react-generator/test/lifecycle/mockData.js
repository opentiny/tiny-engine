/**
 * React生命周期钩子功能测试的模拟数据
 */

// 基础生命周期测试 Schema
export const lifecycleTestSchema = {
  componentName: 'Page',
  fileName: 'LifecycleTestPage',
  css: '',
  props: {},
  state: {},
  methods: {
    handleClick: {
      type: 'JSFunction',
      value: 'function handleClick() { console.log("Button clicked"); }'
    }
  },
  lifeCycles: {
    onMounted: {
      type: 'JSFunction',
      value: 'function onMounted() { console.log("Component mounted") }'
    },
    onBeforeUnmount: {
      type: 'JSFunction',
      value: 'function onBeforeUnmount() { console.log("Component unmounted") }'
    },
    onUpdated: {
      type: 'JSFunction',
      value: 'function onUpdated(prevProps, prevState) { console.log("Component updated") }'
    },
    onErrorCaptured: {
      type: 'JSFunction',
      value: 'function onErrorCaptured(error, errorInfo) { console.log("Error caught:", error) }'
    }
  },
  children: [
    {
      componentName: 'div',
      props: {
        style: 'padding: 20px;'
      },
      children: [
        {
          componentName: 'TinyButton',
          props: {
            onClick: {
              type: 'JSExpression',
              value: 'this.handleClick'
            }
          },
          children: ['点击按钮']
        }
      ],
      id: 'container'
    }
  ]
}

// 复杂生命周期测试 Schema
export const complexLifecycleSchema = {
  componentName: 'Page',
  fileName: 'ComplexLifecyclePage',
  css: '',
  props: {},
  state: {
    inputValue: '',
    isLoading: false,
    data: []
  },
  methods: {
    initializeData: {
      type: 'JSFunction',
      value: 'function initializeData() { this.setState({ isLoading: true }); }'
    },
    setupEventListeners: {
      type: 'JSFunction',
      value: 'function setupEventListeners() { console.log("Setting up listeners"); }'
    },
    cleanup: {
      type: 'JSFunction',
      value: 'function cleanup() { this.setState({ isLoading: false }); }'
    },
    removeEventListeners: {
      type: 'JSFunction',
      value: 'function removeEventListeners() { console.log("Removing listeners"); }'
    },
    handleError: {
      type: 'JSFunction',
      value: 'function handleError(error) { console.error("Handled error:", error); }'
    },
    reportError: {
      type: 'JSFunction',
      value: 'function reportError(error) { console.log("Reporting error:", error); }'
    },
    handleInputChange: {
      type: 'JSFunction',
      value: 'function handleInputChange(e) { this.setState({ inputValue: e.target.value }); }'
    }
  },
  lifeCycles: {
    onMounted: {
      type: 'JSFunction',
      value: 'function onMounted() { this.initializeData(); this.setupEventListeners(); }'
    },
    onBeforeUnmount: {
      type: 'JSFunction',
      value: 'function onBeforeUnmount() { this.cleanup(); this.removeEventListeners(); }'
    },
    onErrorCaptured: {
      type: 'JSFunction',
      value: 'function onErrorCaptured(error, errorInfo) { this.handleError(error); this.reportError(error); }'
    },
    onUpdated: {
      type: 'JSFunction',
      value:
        'function onUpdated(prevProps, prevState) { if (prevState.inputValue !== this.state.inputValue) { console.log("Input value changed"); } }'
    }
  },
  children: [
    {
      componentName: 'div',
      props: {
        style: 'padding: 20px; max-width: 600px; margin: 0 auto;'
      },
      children: [
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '测试输入框',
            value: {
              type: 'JSExpression',
              value: 'this.state.inputValue'
            },
            onChange: {
              type: 'JSExpression',
              value: 'this.handleInputChange'
            }
          },
          id: 'test-input'
        },
        {
          componentName: 'div',
          props: {
            style: 'margin-top: 10px;'
          },
          children: [
            {
              type: 'JSExpression',
              value: 'this.state.isLoading ? "加载中..." : "就绪"'
            }
          ],
          id: 'status'
        }
      ],
      id: 'container'
    }
  ]
}

// 混合生命周期和数据绑定的测试 Schema
export const mixedLifecycleSchema = {
  componentName: 'Page',
  fileName: 'MixedLifecyclePage',
  css: '',
  props: {},
  state: {
    inputValue: '',
    count: 0,
    isVisible: true
  },
  methods: {
    focusInput: {
      type: 'JSFunction',
      value: 'function focusInput() { console.log("Focusing input"); }'
    },
    handleSubmit: {
      type: 'JSFunction',
      value: 'function handleSubmit() { console.log("Submitting:", this.state.inputValue); }'
    },
    incrementCount: {
      type: 'JSFunction',
      value: 'function incrementCount() { this.setState(prev => ({ count: prev.count + 1 })); }'
    },
    toggleVisibility: {
      type: 'JSFunction',
      value: 'function toggleVisibility() { this.setState(prev => ({ isVisible: !prev.isVisible })); }'
    }
  },
  lifeCycles: {
    onMounted: {
      type: 'JSFunction',
      value: 'function onMounted() { console.log("Component mounted"); this.focusInput(); }'
    },
    onBeforeUnmount: {
      type: 'JSFunction',
      value: 'function onBeforeUnmount() { console.log("Component unmounting"); }'
    },
    onUpdated: {
      type: 'JSFunction',
      value:
        'function onUpdated(prevProps, prevState) { if (prevState.count !== this.state.count) { console.log("Count updated to:", this.state.count); } }'
    }
  },
  children: [
    {
      componentName: 'div',
      props: {
        style: 'padding: 20px;'
      },
      children: [
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '请输入内容',
            value: {
              type: 'JSExpression',
              value: 'this.state.inputValue'
            },
            onChange: {
              type: 'JSExpression',
              value: 'this.handleInputChange'
            }
          },
          id: 'input-field'
        },
        {
          componentName: 'TinyButton',
          props: {
            disabled: {
              type: 'JSExpression',
              value: 'this.state.inputValue.length === 0'
            },
            onClick: {
              type: 'JSExpression',
              value: 'this.handleSubmit'
            }
          },
          children: ['提交'],
          id: 'submit-button'
        },
        {
          componentName: 'div',
          props: {
            style: 'margin-top: 10px;'
          },
          children: [
            {
              type: 'JSExpression',
              value: 'this.state.count'
            }
          ],
          id: 'counter'
        },
        {
          componentName: 'TinyButton',
          props: {
            onClick: {
              type: 'JSExpression',
              value: 'this.incrementCount'
            }
          },
          children: ['增加计数'],
          id: 'increment-button'
        },
        {
          componentName: 'TinyButton',
          props: {
            onClick: {
              type: 'JSExpression',
              value: 'this.toggleVisibility'
            }
          },
          children: ['切换显示'],
          id: 'toggle-button'
        },
        {
          componentName: 'div',
          props: {
            style: {
              type: 'JSExpression',
              value: 'this.state.isVisible ? "block" : "none"'
            }
          },
          children: ['这是可切换的内容'],
          id: 'toggle-content'
        }
      ],
      id: 'container'
    }
  ]
}

// 错误边界生命周期测试 Schema
export const errorBoundaryLifecycleSchema = {
  componentName: 'Page',
  fileName: 'ErrorBoundaryPage',
  css: '',
  props: {},
  state: {
    hasError: false,
    error: null,
    errorInfo: null
  },
  methods: {
    simulateError: {
      type: 'JSFunction',
      value: 'function simulateError() { throw new Error("Simulated error"); }'
    },
    resetError: {
      type: 'JSFunction',
      value: 'function resetError() { this.setState({ hasError: false, error: null, errorInfo: null }); }'
    }
  },
  lifeCycles: {
    onErrorCaptured: {
      type: 'JSFunction',
      value:
        'function onErrorCaptured(error, errorInfo) { this.setState({ hasError: true, error, errorInfo }); console.log("Error caught:", error); }'
    },
    onMounted: {
      type: 'JSFunction',
      value: 'function onMounted() { console.log("Error boundary mounted"); }'
    },
    onBeforeUnmount: {
      type: 'JSFunction',
      value: 'function onBeforeUnmount() { console.log("Error boundary unmounting"); }'
    }
  },
  children: [
    {
      componentName: 'div',
      props: {
        style: 'padding: 20px;'
      },
      children: [
        {
          componentName: 'div',
          props: {
            style: 'margin-bottom: 10px;'
          },
          children: [
            {
              type: 'JSExpression',
              value: 'this.state.hasError ? "发生错误" : "正常状态"'
            }
          ],
          id: 'status'
        },
        {
          componentName: 'TinyButton',
          props: {
            onClick: {
              type: 'JSExpression',
              value: 'this.simulateError'
            }
          },
          children: ['触发错误'],
          id: 'error-button'
        },
        {
          componentName: 'TinyButton',
          props: {
            onClick: {
              type: 'JSExpression',
              value: 'this.resetError'
            },
            disabled: {
              type: 'JSExpression',
              value: '!this.state.hasError'
            }
          },
          children: ['重置错误'],
          id: 'reset-button'
        },
        {
          componentName: 'div',
          props: {
            style: 'margin-top: 10px; padding: 10px; background-color: #f5f5f5;'
          },
          children: [
            {
              type: 'JSExpression',
              value: 'this.state.hasError ? "错误信息: " + this.state.error?.message : "无错误"'
            }
          ],
          id: 'error-info'
        }
      ],
      id: 'container'
    }
  ]
}
