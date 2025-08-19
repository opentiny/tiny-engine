/**
 * 数据绑定功能测试的模拟数据
 */

// 基础数据绑定测试 Schema
export const basicDataBindingSchema = {
  meta: {
    name: 'BasicDataBindingTest',
    description: 'Test basic data binding functionality'
  },
  componentsMap: [
    {
      componentName: 'TinyInput',
      exportName: 'Input',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    },
    {
      componentName: 'TinySelect',
      exportName: 'Select',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    }
  ],
  pageSchema: [
    {
      componentName: 'div',
      fileName: 'BasicDataBindingPage',
      meta: {
        id: 'basic-page',
        isPage: true,
        parentId: '0',
        router: '/basic-data-binding'
      },
      props: {
        class: 'test-container'
      },
      children: [
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '请输入用户名',
            // 测试数据绑定 - 输入框绑定到用户名字段
            modelValue: {
              type: 'JSExpression',
              value: 'state.username',
              model: true
            }
          }
        },
        {
          componentName: 'TinySelect',
          props: {
            placeholder: '请选择角色',
            // 测试数据绑定 - 选择框绑定到角色字段
            modelValue: {
              type: 'JSExpression',
              value: 'state.role',
              model: true
            }
          }
        },
        {
          componentName: 'input',
          props: {
            type: 'checkbox',
            // 测试原生checkbox的数据绑定
            checked: {
              type: 'JSExpression',
              value: 'state.agreed',
              model: true
            }
          }
        }
      ],
      state: {
        username: '',
        role: '',
        agreed: false
      }
    }
  ],
  blockSchema: [],
  globalState: [],
  dataSource: { list: [] },
  utils: []
}

// 高级数据绑定测试 Schema
export const advancedDataBindingSchema = {
  meta: {
    name: 'AdvancedDataBindingTest',
    description: 'Test advanced data binding functionality with nested objects'
  },
  componentsMap: [
    {
      componentName: 'TinyInput',
      exportName: 'Input',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    },
    {
      componentName: 'TinySelect',
      exportName: 'Select',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    },
    {
      componentName: 'TinySwitch',
      exportName: 'Switch',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    },
    {
      componentName: 'TinyRadio',
      exportName: 'Radio',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    }
  ],
  pageSchema: [
    {
      componentName: 'div',
      fileName: 'AdvancedFormPage',
      meta: {
        id: 'advanced-page',
        isPage: true,
        parentId: '0',
        router: '/advanced-form'
      },
      props: {
        class: 'advanced-form-container'
      },
      children: [
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '请输入用户名',
            modelValue: {
              type: 'JSExpression',
              model: true,
              value: 'state.formData.username'
            }
          }
        },
        {
          componentName: 'TinySwitch',
          props: {
            modelValue: {
              type: 'JSExpression',
              model: true,
              value: 'state.formData.enabled'
            }
          }
        },
        {
          componentName: 'TinyRadio',
          props: {
            value: 'male',
            checked: {
              type: 'JSExpression',
              model: true,
              value: 'state.formData.gender'
            }
          }
        },
        {
          componentName: 'TinyRadio',
          props: {
            value: 'female',
            checked: {
              type: 'JSExpression',
              model: true,
              value: 'state.formData.gender'
            }
          }
        },
        {
          componentName: 'textarea',
          props: {
            placeholder: '请输入备注',
            modelValue: {
              type: 'JSExpression',
              model: true,
              value: 'state.formData.remarks'
            }
          }
        },
        {
          componentName: 'select',
          props: {
            modelValue: {
              type: 'JSExpression',
              model: true,
              value: 'state.formData.category'
            }
          }
        },
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '详细地址',
            modelValue: {
              type: 'JSExpression',
              model: true,
              value: 'state.formData.address.detail'
            }
          }
        },
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '邮政编码',
            modelValue: {
              type: 'JSExpression',
              model: true,
              value: 'state.formData.address.zipCode'
            }
          }
        }
      ],
      state: {
        formData: {
          username: '',
          enabled: false,
          gender: '',
          remarks: '',
          category: '',
          address: {
            detail: '',
            zipCode: ''
          }
        }
      }
    }
  ],
  blockSchema: [],
  globalState: [],
  dataSource: { list: [] },
  utils: []
}

// 边界条件测试 Schema
export const edgeCaseDataBindingSchema = {
  meta: {
    name: 'EdgeCaseDataBindingTest',
    description: 'Test edge cases and error handling for data binding'
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
      fileName: 'EdgeCaseDataBindingPage',
      meta: {
        id: 'edge-case-page',
        isPage: true,
        parentId: '0',
        router: '/edge-case-data-binding'
      },
      props: {
        class: 'edge-case-container'
      },
      children: [
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '空字段测试',
            modelValue: {
              type: 'JSExpression',
              value: '' // 空字段
            }
          }
        },
        {
          componentName: 'TinyInput',
          props: {
            placeholder: 'this前缀清理',
            modelValue: {
              type: 'JSExpression',
              model: true,
              value: 'this.state.withThis'
            }
          }
        },
        {
          componentName: 'TinyInput',
          props: {
            placeholder: '深层嵌套',
            modelValue: {
              type: 'JSExpression',
              model: true,
              value: 'state.level1.level2.level3.deepField'
            }
          }
        }
      ],
      state: {
        noComponentType: '',
        withThis: '',
        level1: {
          level2: {
            level3: {
              deepField: ''
            }
          }
        }
      }
    }
  ],
  blockSchema: [],
  globalState: [],
  dataSource: { list: [] },
  utils: []
}

// 复杂表单测试 Schema
export const complexFormDataBindingSchema = {
  meta: {
    name: 'ComplexFormDataBindingTest',
    description: 'Test complex form with multiple data binding scenarios'
  },
  componentsMap: [
    {
      componentName: 'TinyInput',
      exportName: 'Input',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    },
    {
      componentName: 'TinySelect',
      exportName: 'Select',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    },
    {
      componentName: 'TinyCheckbox',
      exportName: 'Checkbox',
      package: '@opentiny/vue',
      version: '^3.10.0',
      destructuring: true
    }
  ],
  pageSchema: [
    {
      componentName: 'form',
      fileName: 'ComplexFormPage',
      meta: {
        id: 'complex-form-page',
        isPage: true,
        parentId: '0',
        router: '/complex-form'
      },
      props: {
        class: 'complex-form'
      },
      children: [
        // 用户信息部分
        {
          componentName: 'div',
          props: { class: 'user-section' },
          children: [
            {
              componentName: 'TinyInput',
              props: {
                placeholder: '姓名',
                modelValue: {
                  type: 'JSExpression',
                  model: true,
                  value: 'state.user.profile.name'
                }
              }
            },
            {
              componentName: 'TinyInput',
              props: {
                type: 'email',
                placeholder: '邮箱',
                modelValue: {
                  type: 'JSExpression',
                  model: true,
                  value: 'state.user.profile.email'
                }
              }
            }
          ]
        },
        // 偏好设置部分
        {
          componentName: 'div',
          props: { class: 'preferences-section' },
          children: [
            {
              componentName: 'TinySelect',
              props: {
                placeholder: '语言偏好',
                modelValue: {
                  type: 'JSExpression',
                  model: true,
                  value: 'state.user.preferences.language'
                }
              }
            },
            {
              componentName: 'TinyCheckbox',
              props: {
                label: '接收邮件通知',
                checked: {
                  type: 'JSExpression',
                  model: true,
                  value: 'state.user.preferences.emailNotifications'
                }
              }
            }
          ]
        }
      ],
      state: {
        user: {
          profile: {
            name: '',
            email: ''
          },
          preferences: {
            language: '',
            emailNotifications: false
          }
        }
      }
    }
  ],
  blockSchema: [],
  globalState: [],
  dataSource: { list: [] },
  utils: []
}
