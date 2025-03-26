# 设计器 Demo for OpenTiny Official site

## 使用 usage

### 启动

```bash
pnpm i
pnpm serve
```

### 构建

```bash
pnpm i
pnpm build:alpha
```

## 修改说明 

### 数据 Mock

**请求拦截**

使用 `axios-mock-adapter`

```javascript
// http 是 axios 实例
mock = new AxiosMockAdapter(http)
// 不拦截 bundle.json 请求
mock.onGet('/mock/bundle.json').passThrough()

// 拦截剩余的请求
mock.onAny().reply((config) => {
  // ...
})
```

**本地数据存储**

使用 `Dexie` 连接 浏览器 IndexDB，将数据存储到 indexDB

```javascript
// 创建实例
export const db = new Dexie('tiny-engine-demo-indexdb')

// 声明数据库表
export const createDB = async () => {
  return db.version(1).stores({
    ...schema
  })
}
```

### 数据库实现 (db)

设计器 Demo 使用 Dexie.js 作为浏览器端的 IndexDB 封装库，实现本地数据持久化。主要包含以下功能：

- **数据库模式定义**：在 `db/schema.js` 中定义了多个表结构，包括 appDetail、appSchema、page、block、blockHistories、user、blockGroup 和 utils 等
- **数据库初始化**：`db/index.js` 提供了数据库的创建、初始化和重置功能
- **数据注入**：通过 `initData` 函数将 mock 目录下的模拟数据导入到 IndexDB 中
- **数据重置**：提供 `resetDataBase` 方法用于清空并重新初始化数据库

### 模拟数据实现 (mock)

mock 目录包含多个 JSON 文件，用于提供设计器 Demo 所需的模拟数据：

- **user.json**: 用户信息
- **appDetail.json**: 应用详情
- **appSchema.json**: 应用结构配置
- **pageList.json**: 页面列表
- **blocks.json**: 区块列表
- **block-groups.json**: 区块分组
- **utilsList.json**: 工具函数列表
- **blockHistories.json**: 区块历史记录

这些模拟数据在应用初始化时会被导入到 IndexDB 中，为设计器提供基础数据支持。

### 插件实现 (plugins)

plugins 目录实现了设计器的自定义插件，主要包括：

- **header 插件**：
  - 自定义设计器顶部导航栏
  - 提供 Logo（跳转回去OpenTiny 官网）、GitHub链接（跳转到TinyEngine 和 TinyEngine 后端）
  - 通过 `id: 'engine.toolbars.header'` 注册为工具栏类型插件

- **resetDatabase 插件**：
  - 提供重置数据库功能的工具栏按钮
  - 使用 `id: 'engine.toolbars.resetDataBase'` 注册
  - 点击时调用 db 模块的 `resetDataBase` 方法重置所有数据

插件通过导出包含 id、type、title、options 和 entry 的对象进行注册，entry 指向插件的 Vue 组件。

### 可组合功能实现 (composable)

composable 目录采用 Vue Composition API 的思想实现了可重用的功能模块：

- **HttpService**：
  - 基于 axios 的 HTTP 请求服务封装
  - 包含请求/响应拦截器配置
  - 统一错误处理和通知
  - 支持开发环境特殊配置
  - 集成了 mock 功能，可拦截 API 请求并返回本地数据

