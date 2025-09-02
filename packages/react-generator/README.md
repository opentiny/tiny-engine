# @opentiny/tiny-engine-dsl-react

[![pnpm version](https://img.shields.io/pnpm/v/@opentiny/tiny-engine-dsl-react.svg)](https://www.npmjs.com/package/@opentiny/tiny-engine-dsl-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个DSL到React代码生成器，支持将TinyEngine设计器的DSL schema转换为可运行的React应用代码。

## ✨ 特性

- 🚀 **完整的React应用生成** - 支持生成完整的React应用，包括页面、组件、路由等
- 🔄 **数据双向绑定** - 支持JSDataBinding和JSExpression的双向数据绑定
- ⚡ **生命周期管理** - 自动转换React组件生命周期方法
- 🎨 **代码格式化** - 集成Prettier，自动格式化生成的代码
- 🔌 **插件化架构** - 支持自定义插件扩展功能
- 🌍 **国际化支持** - 内置i18n国际化功能
- 📦 **依赖管理** - 自动处理组件依赖和包管理
- 🎯 **类型安全** - 提供完整的TypeScript类型定义

## 📦 安装

```bash
pnpm install @opentiny/tiny-engine-dsl-react
```

## 🚀 快速开始

### 基础使用

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-react'

// 创建代码生成器实例
const generator = generateApp()

// 生成React应用代码
const result = generator.generate(schema)
console.log(result)
```

### 生成完整应用

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-react'

const generator = generateApp({
  pluginConfig: {
    // 自定义配置
    formatCode: {
      enableFormat: true,
      printWidth: 100
    }
  }
})

// 生成完整的React应用
const appCode = generator.generate(schema)
```

## 📚 核心功能

### 1. 数据双向绑定

支持将DSL中的`JSDataBinding`和带有`model`属性的`JSExpression`转换为React的`useState`和事件处理逻辑。

#### 使用示例

```javascript
// DSL Schema
{
  "componentName": "TinyInput",
  "props": {
    "value": {
      "type": "JSDataBinding",
      "value": "this.state.username"
    }
  }
}

// 生成的React代码
const [state, setState] = useState({ username: '' })

<TinyInput
  value={state.username}
  onChange={e => setState(prev => ({ ...prev, username: e.target.value }))}
/>
```

#### 嵌套对象绑定

```javascript
// DSL Schema
{
  "componentName": "TinyInput",
  "props": {
    "value": {
      "type": "JSDataBinding", 
      "value": "this.state.userInfo.name"
    }
  }
}

// 生成的React代码
<TinyInput
  value={state.userInfo.name}
  onChange={e => setState(prev => ({ 
    ...prev, 
    userInfo: { ...prev.userInfo, name: e.target.value } 
  }))}
/>
```

### 2. 生命周期管理

自动转换React组件的生命周期方法。

#### 支持的生命周期

- `componentDidMount` - 组件挂载后
- `componentWillUnmount` - 组件卸载前
- `componentDidUpdate` - 组件更新后
- `componentDidCatch` - 错误边界捕获
- `componentWillMount` - 组件挂载前
- `shouldComponentUpdate` - 控制组件更新

#### 使用示例

```javascript
// DSL Schema
{
  "lifeCycles": {
    "componentDidMount": {
      "type": "JSFunction",
      "value": "function componentDidMount() { console.log('Component mounted') }"
    },
    "componentWillUnmount": {
      "type": "JSFunction", 
      "value": "function componentWillUnmount() { console.log('Component unmounted') }"
    }
  }
}

// 生成的React代码
class MyComponent extends React.Component {
  componentDidMount() {
    console.log('Component mounted')
  }

  componentWillUnmount() {
    console.log('Component unmounted')
  }

  render() {
    return <div>Hello World</div>
  }
}
```

### 3. 代码格式化

集成Prettier，自动格式化生成的代码。

#### 配置选项

```javascript
const generator = generateApp({
  pluginConfig: {
    formatCode: {
      // Prettier 配置
      printWidth: 100,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
      
      // 插件配置
      enableFormat: true,
      skipFiles: ['txt', 'log'],
      onlyFiles: ['js', 'jsx', 'ts', 'tsx'],
      logFormatResult: true
    }
  }
})
```

#### 禁用格式化

```javascript
const generator = generateApp({
  pluginConfig: {
    formatCode: {
      enableFormat: false
    }
  }
})
```

### 4. 插件系统

支持自定义插件扩展功能。

#### 内置插件

- **template** - 模板生成插件
- **block** - 区块生成插件
- **page** - 页面生成插件
- **dataSource** - 数据源插件
- **dependencies** - 依赖管理插件
- **i18n** - 国际化插件
- **router** - 路由插件
- **utils** - 工具函数插件
- **globalState** - 全局状态插件
- **formatCode** - 代码格式化插件
- **parseSchema** - Schema解析插件

#### 自定义插件

```javascript
const customPlugin = {
  name: 'customPlugin',
  transform: (schema, context) => {
    // 自定义转换逻辑
    return schema
  }
}

const generator = generateApp({
  customPlugins: {
    transform: [customPlugin]
  }
})
```

## 🔧 API 参考

### generateApp(config)

创建代码生成器实例。

#### 参数

- `config` (Object) - 配置对象
  - `pluginConfig` (Object) - 插件配置
  - `customPlugins` (Object) - 自定义插件
  - `customContext` (Object) - 自定义上下文

#### 返回值

返回代码生成器实例，包含以下方法：

- `generate(schema)` - 生成代码
- `generatePage(schema)` - 生成页面代码
- `generateBlock(schema)` - 生成区块代码

### CodeGenerator

代码生成器类。

```javascript
import { CodeGenerator } from '@opentiny/tiny-engine-dsl-react'

const generator = new CodeGenerator({
  plugins: {
    transformStart: [],
    transform: [],
    transformEnd: []
  },
  context: {}
})
```

### 开发环境

```bash
# 安装依赖
pnpm install
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test test/data-binding
pnpm test test/lifecycle
pnpm test test/formatCode

# 运行完整测试套件
pnpm run test:latest
```

### 测试用例

- **data-binding** - 数据双向绑定功能测试
- **lifecycle** - 生命周期功能测试
- **formatCode** - 代码格式化功能测试
- **generator** - 代码生成器核心功能测试
- **unit** - 单元测试

## 📁 项目结构

```
src/
├── generator/          # 代码生成器核心
│   ├── codeGenerator.js
│   ├── generateApp.js
│   ├── generateJsx.js
│   ├── page.js
│   └── parseImport.js
├── plugins/            # 插件系统
│   ├── formatCodePlugin.js
│   ├── genBlockPlugin.js
│   ├── genPagePlugin.js
│   └── ...
├── templates/          # 代码模板
│   └── react-template/
├── parser/             # DSL解析器
├── pre-processor/      # 预处理器
├── utils/              # 工具函数
└── constant/           # 常量定义
```

## 🎯 设计理念

### 代码生成架构

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Plugin    │    │  Template   │    │   Parser    │    │ Generator   │
│   插件系统   │───▶│   模板系统   │───▶│  解析器     │───▶│  代码生成器  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```
