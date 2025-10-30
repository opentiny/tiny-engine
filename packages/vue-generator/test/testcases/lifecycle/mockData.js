/**
 * 生命周期钩子功能测试的模拟数据
 */

// 基础生命周期测试 Schema
export const lifecycleTestSchema = {
  meta: {
    name: 'LifecycleTest',
    description: 'Test lifecycle hooks functionality'
  },
  componentsMap: [
    {
      componentName: 'TinyButton',
      exportName: 'Button',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    }
  ],
  pageSchema: [
    {
      componentName: 'div',
      fileName: 'LifecycleTestPage',
      meta: {
        id: 'lifecycle-page',
        isPage: true,
        parentId: '0',
        router: '/lifecycle-test'
      },
      props: {
        class: 'lifecycle-container'
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
        onUnmounted: {
          type: 'JSFunction',
          value: 'function onUnmounted() { console.log("Component unmounted") }'
        },
        onUpdated: {
          type: 'JSFunction',
          value: 'function onUpdated() { console.log("Component updated") }'
        },
        onBeforeMount: {
          type: 'JSFunction',
          value: 'function onBeforeMount() { console.log("Before mount") }'
        }
      }
    }
  ],
  blockSchema: [],
  globalState: [],
  dataSource: { list: [] },
  utils: []
}

// 复杂生命周期测试 Schema
export const complexLifecycleSchema = {
  meta: {
    name: 'ComplexLifecycleTest',
    description: 'Test complex lifecycle scenarios'
  },
  componentsMap: [
    {
      componentName: 'TinyInput',
      exportName: 'Input',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    }
  ],
  pageSchema: [
    {
      componentName: 'div',
      fileName: 'ComplexLifecyclePage',
      meta: {
        id: 'complex-lifecycle-page',
        isPage: true,
        parentId: '0',
        router: '/complex-lifecycle'
      },
      props: {
        class: 'complex-component'
      },
      children: [
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '测试输入框'
          }
        }
      ],
      state: {
        inputValue: '',
        isLoading: false
      },
      methods: {
        initializeData: {
          type: 'JSFunction',
          value: 'function initializeData() { this.isLoading = true; }'
        },
        setupEventListeners: {
          type: 'JSFunction',
          value: 'function setupEventListeners() { console.log("Setting up listeners"); }'
        },
        cleanup: {
          type: 'JSFunction',
          value: 'function cleanup() { this.isLoading = false; }'
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
        }
      },
      lifeCycles: {
        onMounted: {
          type: 'JSFunction',
          value: 'function onMounted() { initializeData(); setupEventListeners() }'
        },
        onBeforeUnmount: {
          type: 'JSFunction',
          value: 'function onBeforeUnmount() { cleanup(); removeEventListeners() }'
        },
        onErrorCaptured: {
          type: 'JSFunction',
          value: 'function onErrorCaptured() { handleError(error); reportError(error) }'
        }
      }
    }
  ],
  blockSchema: [],
  globalState: [],
  dataSource: { list: [] },
  utils: []
}

// 混合生命周期和其他功能的测试 Schema
export const mixedLifecycleSchema = {
  meta: {
    name: 'MixedLifecycleTest',
    description: 'Test lifecycle hooks mixed with other features'
  },
  componentsMap: [
    {
      componentName: 'TinyButton',
      exportName: 'Button',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    },
    {
      componentName: 'TinyInput',
      exportName: 'Input',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    }
  ],
  pageSchema: [
    {
      componentName: 'div',
      fileName: 'MixedLifecyclePage',
      meta: {
        id: 'mixed-page',
        isPage: true,
        parentId: '0',
        router: '/mixed-lifecycle'
      },
      props: {
        class: 'mixed-container'
      },
      children: [
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '请输入内容',
            // 数据绑定
            value: {
              type: 'JSDataBinding',
              field: 'state.inputValue'
            },
            // 生命周期钩子
            onMounted: {
              type: 'JSFunction',
              value: 'function onMounted() { focusInput() }'
            }
          }
        },
        {
          componentName: 'TinyButton',
          props: {
            // JS表达式
            disabled: {
              type: 'JSExpression',
              value: 'this.inputValue.length === 0'
            },
            // 事件处理
            onClick: {
              type: 'JSExpression',
              value: 'this.handleSubmit'
            },
            // 生命周期钩子
            onBeforeMount: {
              type: 'JSFunction',
              value: 'function onBeforeMount() { console.log("Button preparing to mount") }'
            }
          },
          children: ['提交']
        }
      ],
      state: {
        inputValue: ''
      },
      methods: {
        focusInput: {
          type: 'JSFunction',
          value: 'function focusInput() { console.log("Focusing input"); }'
        },
        handleSubmit: {
          type: 'JSFunction',
          value: 'function handleSubmit() { console.log("Submitting:", this.inputValue); }'
        }
      },
      lifeCycles: {}
    }
  ],
  blockSchema: [],
  globalState: [],
  dataSource: { list: [] },
  utils: []
}
