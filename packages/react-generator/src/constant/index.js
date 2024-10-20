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
 * 组件映射关系，默认使用 Tiny React 组件，支持传入其它组件库的映射关系
 * @summary 建议：添加时，按照组件名称的字母序排列
 */
const DEFAULT_COMPONENTS_MAP = [
  {
    componentName: 'TinyAlert',
    exportName: 'Alert',
    package: '@opentiny/vue',
    version: '^3.10.0',
    destructuring: true
  }
]

// 内置组件映射关系
const BUILTIN_COMPONENTS_MAP = [
  {
    componentName: 'CanvasRow',
    exportName: 'CanvasRow',
    package: '@opentiny/tiny-engine-builtin-component',
    version: '^0.1.0',
    destructuring: true
  },
  {
    componentName: 'CanvasCol',
    exportName: 'CanvasCol',
    package: '@opentiny/tiny-engine-builtin-component',
    version: '^0.1.0',
    destructuring: true
  },
  {
    componentName: 'CanvasRowColContainer',
    exportName: 'CanvasRowColContainer',
    package: '@opentiny/tiny-engine-builtin-component',
    version: '^0.1.0',
    destructuring: true
  }
]

const AntdComponents = [
  {
    componentName: 'AntdButton',
    destructuring: true,
    exportName: 'Button',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdCheckbox',
    destructuring: true,
    exportName: 'Checkbox',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdCheckboxGroup',
    destructuring: true,
    exportName: 'Checkbox',
    subName: 'Group',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdInput',
    destructuring: true,
    exportName: 'Input',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdRadio',
    destructuring: true,
    exportName: 'Radio',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdRadioButton',
    destructuring: true,
    exportName: 'Radio',
    subName: 'Button',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdRadioGroup',
    destructuring: true,
    exportName: 'Radio',
    subName: 'Group',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdSelect',
    destructuring: true,
    exportName: 'Select',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdTable',
    destructuring: true,
    exportName: 'Table',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdForm',
    destructuring: true,
    exportName: 'Form',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdFormItem',
    destructuring: true,
    exportName: 'Form',
    subName: 'Item',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdSwitch',
    destructuring: true,
    exportName: 'Switch',
    package: 'antd',
    version: '^5.16.0'
  }
]

/**
 * 内部保留组件名称，出码时可能需要特殊处理
 */
const BUILTIN_COMPONENT_NAME = {
  PAGE: 'Page',
  BLOCK: 'Block',
  TEMPLATE: 'Template',
  SLOT: 'Slot',
  COLLECTION: 'Collection',
  TEXT: 'Text',
  ICON: 'Icon'
}

/**
 * 图标组件名，统一前缀为 TinyIcon，与从组件库引入的方法名 iconXxx 区分开
 */
const TINY_ICON = 'TinyIcon'

/**
 * 占位标识，用于解开字符串的双引号，输出原始表达式
 */
const UNWRAP_QUOTES = {
  start: '#QUOTES_START#',
  end: '#QUOTES_END#'
}

const IntrinsicElements = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'big',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'center',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noindex',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'search',
  'slot',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'template',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
  'webview',
  'svg',
  'animate',
  'animateMotion',
  'animateTransform',
  'circle',
  'clipPath',
  'defs',
  'desc',
  'ellipse',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  'filter',
  'foreignObject',
  'g',
  'image',
  'line',
  'linearGradient',
  'marker',
  'mask',
  'metadata',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'set',
  'stop',
  'switch',
  'symbol',
  'text',
  'textPath',
  'tspan',
  'use',
  'view'
]

/**
 * 协议中的类型
 */
export const [JS_EXPRESSION, JS_FUNCTION, JS_I18N, JS_RESOURCE, JS_SLOT] = [
  'JSExpression',
  'JSFunction',
  'i18n',
  'JSResource',
  'JSSlot'
]

export {
  DEFAULT_COMPONENTS_MAP,
  BUILTIN_COMPONENT_NAME,
  TINY_ICON,
  UNWRAP_QUOTES,
  BUILTIN_COMPONENTS_MAP,
  IntrinsicElements,
  AntdComponents
}
