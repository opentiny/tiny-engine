/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

/**
 * @typedef {Object} ConvertOptions
 * @property {Object} componentMap - 组件映射配置
 * @property {boolean} preserveComments - 是否保留注释
 * @property {boolean} strictMode - 是否严格模式
 * @property {Object} customParsers - 自定义解析器
 */

/**
 * @typedef {Object} ConvertResult
 * @property {Object} schema - 生成的Schema
 * @property {Array<string>} dependencies - 依赖列表
 * @property {Array<string>} errors - 错误列表
 * @property {Array<string>} warnings - 警告列表
 */

/**
 * @typedef {Object} PageSchema
 * @property {string} componentName - 组件名称，固定为'Page'
 * @property {string} fileName - 文件名
 * @property {string} path - 路径
 * @property {Object} meta - 元信息
 * @property {Object} state - 状态
 * @property {Object} methods - 方法
 * @property {Object} computed - 计算属性
 * @property {Object} lifecycle - 生命周期
 * @property {Array} props - 属性
 * @property {string} css - 样式
 * @property {Array} children - 子组件
 */

/**
 * @typedef {Object} TemplateSchema
 * @property {string} componentName - 组件名称
 * @property {Object} props - 属性
 * @property {Array} children - 子组件
 * @property {string} condition - 条件渲染
 * @property {string} loop - 循环渲染
 * @property {string} key - 唯一键
 * @property {string} ref - 引用
 */

/**
 * @typedef {Object} ScriptSchema
 * @property {Object} state - 状态
 * @property {Object} methods - 方法
 * @property {Object} computed - 计算属性
 * @property {Object} lifecycle - 生命周期
 * @property {Array} imports - 导入项
 * @property {Array} props - 属性
 * @property {Array} emits - 事件
 */

/**
 * @typedef {Object} StyleSchema
 * @property {string} css - CSS内容
 * @property {boolean} scoped - 是否scoped
 * @property {string} lang - 样式语言
 */

export {}
