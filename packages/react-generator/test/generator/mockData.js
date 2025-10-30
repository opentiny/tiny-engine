export const appSchemaDemo01 = {
  dataSource: {
    list: [
      {
        id: 132,
        name: 'getAllComponent',
        options: {
          options: [],
          type: 'array'
        },
        tpl: null,
        app: '918',
        desc: null,
        created_at: '2022-06-28T06:26:26.000Z',
        updated_at: '2022-06-28T07:02:30.000Z'
      },
      {
        id: 133,
        name: 'getAllList',
        options: {
          columns: [
            {
              name: 'test',
              title: '测试',
              field: 'test',
              type: 'string',
              format: {}
            },
            {
              name: 'test1',
              title: '测试1',
              field: 'test1',
              type: 'string',
              format: {}
            }
          ],
          type: 'array',
          options: [
            {
              test: 'test1',
              test1: 'test1',
              _id: '341efc48'
            },
            {
              test: 'test2',
              test1: 'test1',
              _id: 'b86b516c'
            },
            {
              test: 'test3',
              test1: 'test1',
              _id: 'f680cd78'
            }
          ],
          options: {
            uri: '',
            method: 'GET'
          },
          dataHandler: {
            type: 'JSFunction',
            value: 'function dataHandler(data) { \n return data \n}'
          },
          willFetch: {
            type: 'JSFunction',
            value: 'function willFetch(option) {\n  return option \n}'
          },
          shouldFetch: {
            type: 'JSFunction',
            value: 'function shouldFetch(option) {\n  return true \n}'
          },
          errorHandler: {
            type: 'JSFunction',
            value: 'function errorHandler(err) {}'
          }
        },
        tpl: null,
        app: '918',
        desc: null,
        created_at: '2022-06-28T07:32:16.000Z',
        updated_at: '2023-01-19T03:29:11.000Z'
      }
    ],
    dataHandler: {
      type: 'JSFunction',
      value: 'function dataHanlder(res){\n return res;\n}'
    }
  },
  globalState: [
    {
      id: 'testState',
      state: {
        name: 'testName',
        license: '',
        age: 18,
        food: ['apple', 'orange', 'banana', 19],
        desc: {
          description: 'hello world',
          money: 100,
          other: '',
          rest: ['a', 'b', 'c', 20]
        }
      },
      getters: {
        getAge: {
          type: 'JSFunction',
          value: 'function getAge() {\n return this.age \n}'
        },
        getName: {
          type: 'JSFunction',
          value: 'function getName() {\n return this.name \n}'
        }
      },
      actions: {
        setAge: {
          type: 'JSFunction',
          value: 'function setAge(age) {\n this.age = age; \n}'
        },
        setName: {
          type: 'JSFunction',
          value: 'function setName(name) {\n this.name = name; \n}'
        }
      }
    }
  ],
  utils: [
    {
      name: 'axios',
      type: 'npm',
      content: {
        type: 'JSFunction',
        value: '',
        package: 'axios',
        destructuring: false,
        exportName: 'axios'
      }
    },
    {
      name: 'Button',
      type: 'npm',
      content: {
        package: 'antd',
        version: '5.0.0',
        exportName: 'Button',
        subName: '',
        destructuring: true,
        main: ''
      }
    },
    {
      name: 'Input',
      type: 'npm',
      content: {
        package: 'antd',
        version: '5.0.0',
        exportName: 'Input',
        subName: '',
        destructuring: true,
        main: ''
      }
    },
    {
      name: 'Typography',
      type: 'npm',
      content: {
        package: 'antd',
        version: '5.0.0',
        exportName: 'Typography',
        subName: '',
        destructuring: true,
        main: ''
      }
    },
    {
      name: 'Menu',
      type: 'npm',
      content: {
        type: 'JSFunction',
        value: '',
        package: 'antd',
        exportName: 'Menu',
        destructuring: true
      }
    },
    {
      name: 'Modal',
      type: 'npm',
      content: {
        package: 'antd',
        version: '5.0.0',
        exportName: 'Modal',
        subName: '',
        destructuring: true,
        main: ''
      }
    },
    {
      name: 'test',
      type: 'function',
      content: {
        type: 'JSFunction',
        value: "function test() {\r\n  return 'test'\r\n}"
      }
    },
    {
      name: 'util',
      type: 'function',
      content: {
        type: 'JSFunction',
        value: 'function util () {\r\n  console.log(321)\r\n}'
      }
    }
  ],
  i18n: {
    en_US: {
      'lowcode.c257d5e8': 'search',
      'lowcode.f53187a0': 'test',
      'lowcode.97ad00dd': 'createMaterial'
    },
    zh_CN: {
      'lowcode.c257d5e8': '查询',
      'lowcode.f53187a0': '测试',
      'lowcode.97ad00dd': '创建物料资产包'
    }
  },
  pageSchema: [
    {
      state: {
        inputValue: '',
        count: 0
      },
      methods: {
        handleClick: {
          type: 'JSFunction',
          value: 'function handleClick() {\n  this.setState({ count: this.state.count + 1 })\n}'
        },
        handleInputChange: {
          type: 'JSFunction',
          value: 'function handleInputChange(e) {\n  this.setState({ inputValue: e.target.value })\n}'
        }
      },
      componentName: 'Page',
      css: '.page-container {\n  padding: 20px;\n  background: #f5f5f5;\n  max-width: 600px;\n  margin: 0 auto;\n  border-radius: 8px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n}',
      props: {},
      lifeCycles: {
        onMounted: {
          type: 'JSFunction',
          value: 'function onMounted() {\n  console.log("Component mounted");\n}'
        }
      },
      children: [
        {
          componentName: 'div',
          props: {
            className: 'page-container'
          },
          children: [
            {
              componentName: 'Typography',
              props: {
                variant: 'h1',
                style: { marginBottom: '20px' }
              },
              children: ['React Demo Page']
            },
            {
              componentName: 'Input',
              props: {
                placeholder: '请输入内容',
                value: {
                  type: 'JSExpression',
                  value: 'state.inputValue',
                  model: true
                },
                onChange: {
                  type: 'JSExpression',
                  value: 'this.handleInputChange'
                },
                style: { marginBottom: '10px' }
              }
            },
            {
              componentName: 'Button',
              props: {
                type: 'primary',
                onClick: {
                  type: 'JSExpression',
                  value: 'this.handleClick'
                },
                style: { marginBottom: '10px' }
              },
              children: [
                {
                  type: 'JSExpression',
                  value: '"点击次数: " + state.count'
                }
              ]
            },
            {
              componentName: 'Typography',
              props: {
                variant: 'body1'
              },
              children: [
                {
                  type: 'JSExpression',
                  value: '"输入内容: " + state.inputValue'
                }
              ]
            }
          ]
        }
      ],
      dataSource: {
        list: []
      },
      utils: [],
      bridge: [],
      inputs: [],
      outputs: [],
      fileName: 'DemoPage',
      meta: {
        name: 'DemoPage',
        id: '5bhD7p5FUsUOTFRN',
        app: '918',
        router: 'demopage',
        tenant: 1,
        isBody: false,
        parentId: '0',
        group: 'staticPages',
        depth: 0,
        isPage: true,
        isDefault: false,
        occupier: {
          id: 86,
          username: '开发者',
          email: 'developer@lowcode.com',
          confirmationToken: 'dfb2c162-351f-4f44-ad5f-8998',
          is_admin: true
        },
        isHome: false,
        message: 'Page auto save',
        _id: '5bhD7p5FUsUOTFRN'
      }
    },
    {
      state: {
        dataDisk: [1, 2, 3],
        // 表单相关状态
        formData: {
          zone: '1',
          cpu: '1',
          cpuArch: '1',
          memory: '1',
          storageType: '1',
          storageSize: '40',
          diskType: '1',
          diskSize: '100',
          networkType: '1',
          bandwidth: '1',
          instanceType: '1',
          instanceCount: '1'
        },
        // 输入框相关状态
        inputValues: {
          diskLabel: '',
          systemDisk: '',
          dataDiskSize: '',
          networkConfig: ''
        }
      },
      methods: {
        handleFormSubmit: {
          type: 'JSFunction',
          value:
            'function handleFormSubmit() { console.log("Form submitted with data:", this.state.formData); alert("Form submitted successfully!"); }'
        }
      },
      componentName: 'Page',
      css: 'body {\r\n  background-color:#eef0f5 ;\r\n  margin-bottom: 80px;\r\n}',
      props: {},
      children: [
        {
          componentName: 'div',
          props: {
            style: { paddingBottom: '10px', paddingTop: '10px' }
          },
          id: '2b2cabf0',
          children: [
            {
              componentName: 'Steps',
              props: {
                current: 1,
                items: [
                  {
                    title: '基础配置'
                  },
                  {
                    title: '网络配置'
                  },
                  {
                    title: '高级配置'
                  },
                  {
                    title: '确认配置'
                  }
                ],
                direction: 'horizontal',
                style: { borderRadius: '0px' }
              },
              id: 'dd764b17'
            }
          ]
        },
        {
          componentName: 'div',
          props: {
            style: {
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '4px',
              borderColor: '#fff',
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '10px',
              paddingRight: '10px',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
              backgroundColor: '#fff',
              marginBottom: '10px'
            }
          },
          id: '30c94cc8',
          children: [
            {
              componentName: 'Form',
              props: {
                labelCol: { span: 6 },
                wrapperCol: { span: 18 },
                layout: 'horizontal',
                style: { borderRadius: '0px' }
              },
              children: [
                {
                  componentName: 'Form.Item',
                  props: {
                    label: '计费模式'
                  },
                  children: [
                    {
                      componentName: 'Radio.Group',
                      props: {
                        options: [
                          {
                            label: '包年/包月',
                            value: '1'
                          },
                          {
                            label: '按需计费',
                            value: '2'
                          }
                        ],
                        value: {
                          type: 'JSExpression',
                          value: 'state.formData.storageType',
                          model: true
                        }
                      },
                      id: 'a8d84361'
                    }
                  ],
                  id: '9f39f3e7'
                },
                {
                  componentName: 'Form.Item',
                  props: {
                    label: '区域'
                  },
                  children: [
                    {
                      componentName: 'Radio.Group',
                      props: {
                        options: [
                          {
                            label: '乌兰察布二零一',
                            value: '1'
                          }
                        ],
                        value: '1',
                        style: { borderRadius: '0px', marginRight: '10px' }
                      },
                      id: 'c97ccd99'
                    },
                    {
                      componentName: 'Typography.Text',
                      props: {
                        children: '温馨提示：页面左上角切换区域',
                        style: { color: '#8a8e99', fontSize: '12px' }
                      },
                      id: '20923497'
                    },
                    {
                      componentName: 'Typography.Text',
                      props: {
                        children:
                          '不同区域的云服务产品之间内网互不相通；请就近选择靠近您业务的区域，可减少网络时延，提高访问速度',
                        style: { display: 'block', color: '#8a8e99', borderRadius: '0px', fontSize: '12px' }
                      },
                      id: '54780a26'
                    }
                  ],
                  id: '4966384d'
                },
                {
                  componentName: 'Form.Item',
                  props: {
                    label: '可用区',
                    style: { borderRadius: '0px' }
                  },
                  children: [
                    {
                      componentName: 'Radio.Group',
                      props: {
                        options: [
                          {
                            label: '可用区1',
                            value: '1'
                          },
                          {
                            label: '可用区2',
                            value: '2'
                          },
                          {
                            label: '可用区3',
                            value: '3'
                          }
                        ],
                        value: {
                          type: 'JSExpression',
                          value: 'state.formData.zone',
                          model: true
                        }
                      },
                      id: '6184481b'
                    }
                  ],
                  id: '690837bf'
                }
              ],
              id: 'b6a425d4'
            }
          ]
        },
        {
          componentName: 'div',
          props: {
            style: {
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '4px',
              borderColor: '#fff',
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '10px',
              paddingRight: '10px',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
              backgroundColor: '#fff',
              marginBottom: '10px'
            }
          },
          children: [
            {
              componentName: 'Form',
              props: {
                labelCol: { span: 6 },
                wrapperCol: { span: 18 },
                layout: 'horizontal',
                style: { borderRadius: '0px' }
              },
              children: [
                {
                  componentName: 'Form.Item',
                  props: {
                    label: 'CPU架构'
                  },
                  children: [
                    {
                      componentName: 'Radio.Group',
                      props: {
                        options: [
                          {
                            label: 'x86计算',
                            value: '1'
                          },
                          {
                            label: '鲲鹏计算',
                            value: '2'
                          }
                        ],
                        value: {
                          type: 'JSExpression',
                          value: 'state.formData.cpuArch',
                          model: true
                        }
                      },
                      id: '7d33ced7'
                    }
                  ],
                  id: '05ed5a79'
                },
                {
                  componentName: 'Form.Item',
                  props: {
                    label: '区域'
                  },
                  children: [
                    {
                      componentName: 'div',
                      props: {
                        style: { display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }
                      },
                      id: '606edf78',
                      children: [
                        {
                          componentName: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center', marginRight: '10px' }
                          },
                          id: 'f3f98246',
                          children: [
                            {
                              componentName: 'Typography.Text',
                              props: {
                                children: 'vCPUs',
                                style: { width: '80px' }
                              },
                              id: 'c287437e'
                            },
                            {
                              componentName: 'Select',
                              props: {
                                value: {
                                  type: 'JSExpression',
                                  value: 'state.formData.cpu',
                                  model: true
                                },
                                placeholder: '请选择',
                                options: [
                                  {
                                    value: '1',
                                    label: '1 vCPU'
                                  },
                                  {
                                    value: '2',
                                    label: '2 vCPU'
                                  }
                                ]
                              },
                              id: '4c43286b'
                            }
                          ]
                        },
                        {
                          componentName: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center', marginRight: '10px' }
                          },
                          children: [
                            {
                              componentName: 'Typography.Text',
                              props: {
                                children: '内存',
                                style: { width: '80px', borderRadius: '0px' }
                              },
                              id: '38b8fa1f'
                            },
                            {
                              componentName: 'Select',
                              props: {
                                value: {
                                  type: 'JSExpression',
                                  value: 'state.formData.memory',
                                  model: true
                                },
                                placeholder: '请选择',
                                options: [
                                  {
                                    value: '1',
                                    label: '黄金糕'
                                  },
                                  {
                                    value: '2',
                                    label: '双皮奶'
                                  }
                                ]
                              },
                              id: 'cd33328e'
                            }
                          ],
                          id: '2b2c678f'
                        },
                        {
                          componentName: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center' }
                          },
                          children: [
                            {
                              componentName: 'Typography.Text',
                              props: {
                                children: '规格名称',
                                style: { width: '120px' }
                              },
                              id: 'd3eb6352'
                            },
                            {
                              componentName: 'Input.Search',
                              props: {
                                placeholder: '输入关键词',
                                value: {
                                  type: 'JSExpression',
                                  value: 'state.inputValues.diskLabel',
                                  model: true
                                }
                              },
                              id: '21cb9282'
                            }
                          ],
                          id: 'b8e0f35c'
                        }
                      ]
                    },
                    {
                      componentName: 'div',
                      props: {
                        style: { borderRadius: '0px' }
                      },
                      id: '5000c83e',
                      children: [
                        {
                          componentName: 'Radio.Group',
                          props: {
                            options: [
                              {
                                label: '通用计算型',
                                value: '1'
                              },
                              {
                                label: '通用计算增强型',
                                value: '2'
                              },
                              {
                                label: '内存优化型',
                                value: '3'
                              },
                              {
                                label: '内存优化型',
                                value: '4'
                              },
                              {
                                label: '磁盘增强型',
                                value: '5'
                              },
                              {
                                label: '超高I/O型',
                                value: '6'
                              },
                              {
                                label: 'GPU加速型',
                                value: '7'
                              }
                            ],
                            value: {
                              type: 'JSExpression',
                              value: 'state.formData.instanceType',
                              model: true
                            },
                            style: { borderRadius: '0px', marginTop: '12px' }
                          },
                          id: 'b8724703'
                        },
                        {
                          componentName: 'Table',
                          props: {
                            editConfig: {
                              trigger: 'click',
                              mode: 'cell',
                              showStatus: true
                            },
                            columns: [
                              {
                                type: 'radio',
                                width: 60
                              },
                              {
                                field: 'employees',
                                title: '规格名称'
                              },
                              {
                                field: 'created_date',
                                title: 'vCPUs | 内存(GiB)',
                                sortable: true
                              },
                              {
                                field: 'city',
                                title: 'CPU',
                                sortable: true
                              },
                              {
                                title: '基准 / 最大带宽\t',
                                sortable: true
                              },
                              {
                                title: '内网收发包',
                                sortable: true
                              }
                            ],
                            options: [
                              {
                                id: '1',
                                name: 'GFD科技有限公司',
                                city: '福州',
                                employees: 800,
                                created_date: '2014-04-30 00:56:00',
                                boole: false
                              },
                              {
                                id: '2',
                                name: 'WWW科技有限公司',
                                city: '深圳',
                                employees: 300,
                                created_date: '2016-07-08 12:36:22',
                                boole: true
                              }
                            ],
                            style: { marginTop: '12px', borderRadius: '0px' },
                            'auto-resize': true
                          },
                          id: '77701c25'
                        },
                        {
                          componentName: 'div',
                          props: {
                            style: { marginTop: '12px', borderRadius: '0px' }
                          },
                          id: '3339838b',
                          children: [
                            {
                              componentName: 'Typography.Text',
                              props: {
                                children: '当前规格',
                                style: { width: '150px', display: 'inline-block' }
                              },
                              id: '203b012b'
                            },
                            {
                              componentName: 'Typography.Text',
                              props: {
                                children: '通用计算型 | Si2.large.2 | 2vCPUs | 4 GiB',
                                style: { fontWeight: '700' }
                              },
                              id: '87723f52'
                            }
                          ]
                        }
                      ]
                    }
                  ],
                  id: '657fb2fc'
                }
              ],
              id: 'd19b15cf'
            }
          ],
          id: '9991228b'
        },
        {
          componentName: 'div',
          props: {
            style: {
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '4px',
              borderColor: '#fff',
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '10px',
              paddingRight: '10px',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
              backgroundColor: '#fff',
              marginBottom: '10px'
            }
          },
          children: [
            {
              componentName: 'Form',
              props: {
                labelCol: '80px',
                layout: 'top',
                layout: false,
                'label-position': 'left ',
                'label-width': '150px',
                style: { borderRadius: '0px' }
              },
              children: [
                {
                  componentName: 'Form.Item',
                  props: {
                    label: '镜像',
                    style: { borderRadius: '0px' }
                  },
                  children: [
                    {
                      componentName: 'Radio.Group',
                      props: {
                        options: [
                          {
                            label: '公共镜像',
                            value: '1'
                          },
                          {
                            label: '私有镜像',
                            value: '2'
                          },
                          {
                            label: '共享镜像',
                            value: '3'
                          }
                        ],
                        value: {
                          type: 'JSExpression',
                          value: 'state.formData.imageType',
                          model: true
                        }
                      },
                      id: '922b14cb'
                    },
                    {
                      componentName: 'div',
                      props: {
                        style: { display: 'flex', marginTop: '12px', borderRadius: '0px' }
                      },
                      id: '6b679524',
                      children: [
                        {
                          componentName: 'Select',
                          props: {
                            value: {
                              type: 'JSExpression',
                              value: 'state.formData.storageType',
                              model: true
                            },
                            placeholder: '请选择',
                            options: [
                              {
                                value: '1',
                                label: '黄金糕'
                              },
                              {
                                value: '2',
                                label: '双皮奶'
                              }
                            ],
                            style: { width: '170px', marginRight: '10px' }
                          },
                          id: '4851fff7'
                        },
                        {
                          componentName: 'Select',
                          props: {
                            value: {
                              type: 'JSExpression',
                              value: 'state.formData.storageSize',
                              model: true
                            },
                            placeholder: '请选择',
                            options: [
                              {
                                value: '1',
                                label: '黄金糕'
                              },
                              {
                                value: '2',
                                label: '双皮奶'
                              }
                            ],
                            style: { width: '340px' }
                          },
                          id: 'a7183eb7'
                        }
                      ]
                    },
                    {
                      componentName: 'div',
                      props: {
                        style: { marginTop: '12px' }
                      },
                      id: '57aee314',
                      children: [
                        {
                          componentName: 'Typography.Text',
                          props: {
                            label: '请注意操作系统的语言类型。',
                            style: { color: '#e37d29' }
                          },
                          id: '56d36c27'
                        }
                      ]
                    }
                  ],
                  id: 'e3b02436'
                }
              ],
              id: '59aebf2b'
            }
          ],
          id: '87ff7b99'
        },
        {
          componentName: 'div',
          props: {
            style: {
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '4px',
              borderColor: '#fff',
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '10px',
              paddingRight: '10px',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
              backgroundColor: '#fff',
              marginBottom: '10px'
            }
          },
          children: [
            {
              componentName: 'Form',
              props: {
                labelCol: '80px',
                layout: 'top',
                layout: false,
                'label-position': 'left ',
                'label-width': '150px',
                style: { borderRadius: '0px' }
              },
              children: [
                {
                  componentName: 'Form.Item',
                  props: {
                    label: '系统盘',
                    style: { borderRadius: '0px' }
                  },
                  children: [
                    {
                      componentName: 'div',
                      props: {
                        style: { display: 'flex' }
                      },
                      id: 'cddba5b8',
                      children: [
                        {
                          componentName: 'Select',
                          props: {
                            value: {
                              type: 'JSExpression',
                              value: 'state.formData.storageType',
                              model: true
                            },
                            placeholder: '请选择',
                            options: [
                              {
                                value: '1',
                                label: '黄金糕'
                              },
                              {
                                value: '2',
                                label: '双皮奶'
                              }
                            ],
                            style: { width: '200px', marginRight: '10px' }
                          },
                          id: 'a97fbe15'
                        },
                        {
                          componentName: 'Input',
                          props: {
                            placeholder: '请输入',
                            value: {
                              type: 'JSExpression',
                              value: 'state.inputValues.systemDisk',
                              model: true
                            },
                            style: { width: '120px', marginRight: '10px' }
                          },
                          id: '1cde4c0f'
                        },
                        {
                          componentName: 'Typography.Text',
                          props: {
                            label: 'GiB   \nIOPS上限240，IOPS突发上限5,000',
                            style: { color: '#575d6c', fontSize: '12px' }
                          },
                          id: '2815d82d'
                        }
                      ]
                    }
                  ],
                  id: '50239a3a'
                }
              ],
              id: 'e8582986'
            },
            {
              componentName: 'Form',
              props: {
                labelCol: '80px',
                layout: 'top',
                layout: false,
                'label-position': 'left ',
                'label-width': '150px',
                style: { borderRadius: '0px' }
              },
              children: [
                {
                  componentName: 'Form.Item',
                  props: {
                    label: '数据盘',
                    style: { borderRadius: '0px' }
                  },
                  children: [
                    {
                      componentName: 'div',
                      props: {
                        style: { marginTop: '12px', display: 'flex' }
                      },
                      id: '728c9825',
                      children: [
                        {
                          componentName: 'Icon',
                          props: {
                            style: { marginRight: '10px', width: '16px', height: '16px' },
                            name: 'DatabaseOutlined'
                          },
                          id: 'fded6930'
                        },
                        {
                          componentName: 'Select',
                          props: {
                            value: {
                              type: 'JSExpression',
                              value: 'state.formData.diskType',
                              model: true
                            },
                            placeholder: '请选择',
                            options: [
                              {
                                value: '1',
                                label: '黄金糕'
                              },
                              {
                                value: '2',
                                label: '双皮奶'
                              }
                            ],
                            style: { width: '200px', marginRight: '10px' }
                          },
                          id: '62734e3f'
                        },
                        {
                          componentName: 'Input',
                          props: {
                            placeholder: '请输入',
                            value: {
                              type: 'JSExpression',
                              value: 'state.inputValues.dataDiskSize',
                              model: true
                            },
                            style: { width: '120px', marginRight: '10px' }
                          },
                          id: '667c7926'
                        },
                        {
                          componentName: 'Typography.Text',
                          props: {
                            label: 'GiB   \nIOPS上限600，IOPS突发上限5,000',
                            style: { color: '#575d6c', fontSize: '12px', marginRight: '10px' }
                          },
                          id: 'e7bc36d6'
                        },
                        {
                          componentName: 'Input',
                          props: {
                            placeholder: '请输入',
                            value: {
                              type: 'JSExpression',
                              value: 'state.inputValues.diskLabel',
                              model: true
                            },
                            style: { width: '120px' }
                          },
                          id: '1bd56dc0'
                        }
                      ],
                      loop: {
                        type: 'JSExpression',
                        value: 'this.state.dataDisk'
                      }
                    },
                    {
                      componentName: 'div',
                      props: {
                        style: { display: 'flex', marginTop: '12px', borderRadius: '0px' }
                      },
                      children: [
                        {
                          componentName: 'Icon',
                          props: {
                            name: 'PlusOutlined',
                            style: { width: '16px', height: '16px', marginRight: '10px' }
                          },
                          id: '65c89f2b'
                        },
                        {
                          componentName: 'Typography.Text',
                          props: {
                            label: '增加一块数据盘',
                            style: { fontSize: '12px', borderRadius: '0px', marginRight: '10px' }
                          },
                          id: 'cb344071'
                        },
                        {
                          componentName: 'Typography.Text',
                          props: {
                            label: '您还可以挂载 21 块磁盘（云硬盘）',
                            style: { color: '#8a8e99', fontSize: '12px' }
                          },
                          id: '80eea996'
                        }
                      ],
                      id: 'e9e530ab'
                    }
                  ],
                  id: '078e03ef'
                }
              ],
              id: 'ccef886e'
            }
          ],
          id: '0fb7bd74'
        },
        {
          componentName: 'div',
          props: {
            style: {
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: '#ffffff',
              paddingTop: '10px',
              paddingLeft: '10px',
              paddingRight: '10px',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
              backgroundColor: '#fff',
              position: 'fixed',
              inset: 'auto 0% 0% 0%',
              height: '80px',
              lineHeight: '80px',
              borderRadius: '0px'
            }
          },
          children: [
            {
              componentName: 'Row',
              props: {
                style: { borderRadius: '0px', height: '100%' }
              },
              children: [
                {
                  componentName: 'Col',
                  props: {
                    span: '16'
                  },
                  id: 'b9d051a5',
                  children: [
                    {
                      componentName: 'Row',
                      props: {
                        style: { borderRadius: '0px' }
                      },
                      children: [
                        {
                          componentName: 'Col',
                          props: {
                            span: '6'
                          },
                          id: '02352776',
                          children: [
                            {
                              componentName: 'Typography.Text',
                              props: {
                                children: '购买量',
                                style: { marginRight: '10px' }
                              },
                              id: '0cd9ed5c'
                            },
                            {
                              componentName: 'Input',
                              props: {
                                placeholder: '请输入',
                                value: {
                                  type: 'JSExpression',
                                  value: 'state.formData.instanceCount',
                                  model: true
                                },
                                style: { width: '120px', marginRight: '10px' }
                              },
                              id: '2f9cf442'
                            },
                            {
                              componentName: 'Typography.Text',
                              props: {
                                children: '台'
                              },
                              id: 'facd4481'
                            }
                          ]
                        },
                        {
                          componentName: 'Col',
                          props: {
                            span: '7'
                          },
                          id: '82b6c659',
                          children: [
                            {
                              componentName: 'div',
                              props: {},
                              id: '9cd65874',
                              children: [
                                {
                                  componentName: 'Typography.Text',
                                  props: {
                                    children: '配置费用',
                                    style: { fontSize: '12px' }
                                  },
                                  id: 'b5a0a0da'
                                },
                                {
                                  componentName: 'Typography.Text',
                                  props: {
                                    children: '¥1.5776',
                                    style: { paddingLeft: '10px', color: '#de504e' }
                                  },
                                  id: 'd9464214'
                                },
                                {
                                  componentName: 'Typography.Text',
                                  props: {
                                    children: '/小时',
                                    style: { fontSize: '12px' }
                                  },
                                  id: 'af7cc5e6'
                                }
                              ]
                            },
                            {
                              componentName: 'div',
                              props: {},
                              id: '89063830',
                              children: [
                                {
                                  componentName: 'Typography.Text',
                                  props: {
                                    children: '参考价格，具体扣费请以账单为准。',
                                    style: { fontSize: '12px', borderRadius: '0px' }
                                  },
                                  id: 'd8995fbc'
                                },
                                {
                                  componentName: 'Typography.Text',
                                  props: {
                                    children: '了解计费详情',
                                    style: { fontSize: '12px', color: '#344899' }
                                  },
                                  id: 'b383c3e2'
                                }
                              ]
                            }
                          ]
                        }
                      ],
                      id: '94fc0e43'
                    }
                  ]
                },
                {
                  componentName: 'Col',
                  props: {
                    span: '8',
                    style: {
                      display: 'flex',
                      flexDirection: 'row-reverse',
                      borderRadius: '0px',
                      height: '100%',
                      justifyContent: 'flex-start',
                      alignItems: 'center'
                    }
                  },
                  id: '10b73009',
                  children: [
                    {
                      componentName: 'Button',
                      props: {
                        type: 'primary',
                        style: { maxWidth: 'unset' },
                        danger: true,
                        onClick: {
                          type: 'JSExpression',
                          value: 'handleFormSubmit'
                        }
                      },
                      children: '下一步: 网络配置',
                      id: '0b584011'
                    }
                  ]
                }
              ],
              id: 'd414a473'
            }
          ],
          id: 'e8ec029b'
        }
      ],
      fileName: 'createVm',
      meta: {
        name: 'createVm',
        id: '1',
        app: '918',
        router: 'createVm',
        tenant: 1,
        isBody: false,
        parentId: '0',
        group: 'staticPages',
        depth: 0,
        isPage: true,
        isDefault: false,
        occupier: {
          id: 86,
          username: '开发者',
          email: 'developer@lowcode.com',
          confirmationToken: 'dfb2c162-351f-4f44-ad5f-8998',
          is_admin: true
        },
        isHome: true,
        _id: '1'
      }
    }
  ],
  componentsMap: [
    {
      componentName: 'Button',
      package: 'antd',
      exportName: 'Button',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Input',
      package: 'antd',
      exportName: 'Input',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Typography',
      package: 'antd',
      exportName: 'Typography',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Modal',
      package: 'antd',
      exportName: 'Modal',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Form',
      package: 'antd',
      exportName: 'Form',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Select',
      package: 'antd',
      exportName: 'Select',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Table',
      package: 'antd',
      exportName: 'Table',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Card',
      package: 'antd',
      exportName: 'Card',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Row',
      package: 'antd',
      exportName: 'Row',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Col',
      package: 'antd',
      exportName: 'Col',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Tabs',
      package: 'antd',
      exportName: 'Tabs',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'TabPane',
      package: 'antd',
      exportName: 'Tabs.TabPane',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Menu',
      package: 'antd',
      exportName: 'Menu',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'MenuItem',
      package: 'antd',
      exportName: 'Menu.Item',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Steps',
      package: 'antd',
      exportName: 'Steps',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Form.Item',
      package: 'antd',
      exportName: 'Form',
      destructuring: false,
      version: '5.0.0'
    },
    {
      componentName: 'Radio',
      package: 'antd',
      exportName: 'Radio',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Radio.Group',
      package: 'antd',
      exportName: 'Radio',
      destructuring: false,
      version: '5.0.0'
    },
    {
      componentName: 'Typography.Text',
      package: 'antd',
      exportName: 'Typography',
      destructuring: false,
      version: '5.0.0'
    },
    {
      componentName: 'DatabaseOutlined',
      package: '@ant-design/icons',
      exportName: 'DatabaseOutlined',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'PlusOutlined',
      package: '@ant-design/icons',
      exportName: 'PlusOutlined',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Dropdown',
      package: 'antd',
      exportName: 'Dropdown',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Tooltip',
      package: 'antd',
      exportName: 'Tooltip',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Popover',
      package: 'antd',
      exportName: 'Popover',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Alert',
      package: 'antd',
      exportName: 'Alert',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Message',
      package: 'antd',
      exportName: 'message',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Notification',
      package: 'antd',
      exportName: 'notification',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Spin',
      package: 'antd',
      exportName: 'Spin',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Progress',
      package: 'antd',
      exportName: 'Progress',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Slider',
      package: 'antd',
      exportName: 'Slider',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Switch',
      package: 'antd',
      exportName: 'Switch',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Checkbox',
      package: 'antd',
      exportName: 'Checkbox',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Radio',
      package: 'antd',
      exportName: 'Radio',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'DatePicker',
      package: 'antd',
      exportName: 'DatePicker',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'TimePicker',
      package: 'antd',
      exportName: 'TimePicker',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Upload',
      package: 'antd',
      exportName: 'Upload',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Transfer',
      package: 'antd',
      exportName: 'Transfer',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Tree',
      package: 'antd',
      exportName: 'Tree',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Cascader',
      package: 'antd',
      exportName: 'Cascader',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Rate',
      package: 'antd',
      exportName: 'Rate',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Badge',
      package: 'antd',
      exportName: 'Badge',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Avatar',
      package: 'antd',
      exportName: 'Avatar',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Tag',
      package: 'antd',
      exportName: 'Tag',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Divider',
      package: 'antd',
      exportName: 'Divider',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Breadcrumb',
      package: 'antd',
      exportName: 'Breadcrumb',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Steps',
      package: 'antd',
      exportName: 'Steps',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Timeline',
      package: 'antd',
      exportName: 'Timeline',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Calendar',
      package: 'antd',
      exportName: 'Calendar',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Carousel',
      package: 'antd',
      exportName: 'Carousel',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Collapse',
      package: 'antd',
      exportName: 'Collapse',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Drawer',
      package: 'antd',
      exportName: 'Drawer',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Skeleton',
      package: 'antd',
      exportName: 'Skeleton',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'BackTop',
      package: 'antd',
      exportName: 'BackTop',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Anchor',
      package: 'antd',
      exportName: 'Anchor',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'Affix',
      package: 'antd',
      exportName: 'Affix',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'ConfigProvider',
      package: 'antd',
      exportName: 'ConfigProvider',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'LocaleProvider',
      package: 'antd',
      exportName: 'ConfigProvider',
      destructuring: true,
      version: '5.0.0'
    },
    {
      componentName: 'PortalHome',
      main: 'common/components/home',
      destructuring: false,
      version: '1.0.0'
    },
    {
      componentName: 'PreviewBlock1',
      main: 'preview',
      destructuring: false,
      version: '1.0.0'
    },
    {
      componentName: 'PortalHeader',
      main: 'common',
      destructuring: false,
      version: '1.0.0'
    },
    {
      componentName: 'PortalBlock',
      main: 'portal',
      destructuring: false,
      version: '1.0.0'
    },
    {
      componentName: 'PortalPermissionBlock',
      main: '',
      destructuring: false,
      version: '1.0.0'
    }
  ],
  meta: {
    name: 'react-demo-app',
    tenant: 1,
    git_group: '',
    project_name: '',
    description: 'React demo应用',
    branch: 'develop',
    is_demo: null,
    global_state: [],
    appId: '918',
    creator: '',
    gmt_create: '2022-06-08 03:19:01',
    gmt_modified: '2023-08-23 10:22:28'
  }
}
