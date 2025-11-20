# DSL-Vue 转换器

一个用于在 Vue 组件和 DSL 格式之间进行双向转换的工具。

## 主要特性

- **双向转换**: 支持 DSL 到 Vue 和 Vue 到 DSL 的双向转换
- **Monaco 编辑器**: 集成强大的代码编辑器，提供语法高亮和智能提示
- **实时预览**: 支持实时预览转换结果
- **格式支持**: 支持 Vue SFC 和 JSON 格式的 DSL
- **语法高亮**: 完整的语法高亮支持
- **错误提示**: 友好的错误提示和验证

## 技术栈

- Vue 3
- Monaco Editor
- Vite
- @opentiny/tiny-engine-dsl-vue
- @opentiny/tiny-engine-vue-to-dsl

## 快速开始

### 安装依赖

```bash
# 安装项目依赖
pnpm install
```

### 启动开发服务器

```bash
# 进入项目目录
cd packages/vue-dsl-transformer

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看应用

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 使用说明

### DSL 转 Vue

1. 在左侧编辑器中输入 DSL 代码
2. 点击 "DSL 转 Vue" 按钮
3. 在右侧查看转换后的 Vue 组件

### Vue 转 DSL

1. 在右侧编辑器中输入 Vue 组件代码
2. 点击 "Vue 转 DSL" 按钮
3. 在左侧查看转换后的 DSL 代码

### 编辑器模式

- **编辑模式**: 可以切换到"编辑"模式进行代码编辑
- **预览模式**: 切换到"预览"模式查看渲染效果
- **分屏**: 支持分屏同时显示编辑和预览

## 项目结构

```
packages/vue-dsl-transformer/
├── src/
│   ├── components/
│   │   ├── MonacoEditor.vue    # Monaco 编辑器组件
│   ├── App.vue                 # 主应用组件
│   ├── main.js                 # 入口文件
│   ├── style.css               # 全局样式
├── index.html                  # HTML 模板
├── vite.config.js              # Vite 配置
├── package.json                # 项目配置
└── README.md                   # 项目说明
```

## 核心功能

- Vue 组件解析和生成：支持 Vue SFC 格式，包含 template、script、style 三个部分
- DSL 解析和生成：支持类 JSON 格式的 DSL 语法
- 双向转换转换器：在 Vue 和 DSL 之间进行无缝转换
- 代码高亮：支持 Vue 和 DSL 的语法高亮

## 开发说明

主要文件说明：
- 主应用组件：`src/App.vue`
- 编辑器组件：`src/components/MonacoEditor.vue`
- 全局样式：`src/style.css`

## 注意事项

- Vue 组件需要符合 Vue 3 SFC 规范
- DSL 格式需要符合项目定义的 DSL 规范
- 转换过程中会自动进行语法验证和错误提示