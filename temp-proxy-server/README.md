# WebSocket MCP工具管理系统

本项目实现了一个基于WebSocket的MCP（Model-Controller-Presenter）工具管理系统，允许前端和后端共享和管理工具。

## 使用方法

1. 在 temp-proxy-server 目录下增加 `config.js` 文件，配置大模型
大模型要求：需要能够调用工具

```javascript
export default {
  // 大模型的 sk
  apiKey: 'sk-xxxxxxxxxxx',
  // 请求的 url
  apiBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  // 模型名称
  model: 'qwq-32b'
}
```

2. 启动 ai proxy 服务

在终端环境中打开 temp-proxy-server 文件，在该文件夹下运行 `node src/index.js` 启动 ai 服务。

```bash
node src/index.js
```

3. 修改 `.env.development` 环境配置。

在 `designer-demo/env/.env.development` 中修改 `VITE_ORIGIN` 变量，连接到后端环境。（如果是 java 后端启动的服务，则可以不用配置）

```bash
VITE_ORIGIN=http://localhost:9090
```

4. 启动 TinyEngine 设计器。

在根目录中运行 `pnpm serve:frontend` 

```bash
pnpm serve:frontend
```

5. 打开设计器 `http://localhost:8090/?type=app&id=1&tenant=1`

6. 点击左下角机器人 icon。打开 ai 插件。

7. 输入 prompt 测试 AI 调用工具能力。

当前 AI 支持调用工具列表：

**i18n**

- addI18n 新增词条
   示例 prompt：新增词条，中文词条内容为 "你好，世界"，英文词条需要你翻译。
- delI18n 删除词条
   示例 prompt：删除词条，词条中文内容为 "你好，世界"。
- getAlli18n 获取所有词条
   示例 prompt：获取所有词条。
- geti18n 获取指定词条
   示例 prompt：获取词条，词条中文内容为 "你好，世界"。
- updatei18n 更新词条
   示例 prompt：更新词条，词条中文内容为 "你好，世界"，需要更改为 "体验技术"，英文词条需要同步翻译更新。

**material**

- getComponentList 获取组件列表
   示例 prompt：请总结当前所有的物料。
- getComponentDetail 获取某个组件详情
   示例 prompt：请总结 TinyGrid 组件的详情。

**page**

- addPage 新增页面
   示例 prompt：请新增页面，页面名称为 Test，路由为 /test。
- changePageBasicInfo 修改页面基本信息
   示例 prompt：修改 Test 页面的路由为 test-router。
- delPage 删除页面
   示例 prompt：删除页面，页面名称为 Test。
- editSpecificPage 在画布中编辑某个页面
   示例 prompt：在画布中编辑页面，页面名称为 Test。
- getPageDetail 获取页面详情
   示例 prompt：获取页面详情，页面名称为 Test。
- getPageList 获取页面列表
   示例 prompt：请总结当前所有的页面。

**useCanvas**

- addNode 新增节点
   示例 prompt： 请在页面顶部新增一个 按钮组件。
- changeNodeProps 修改节点 props
   示例 prompt： 修改文字为“体验技术”的按钮组件的文字为“ai体验技术”。
- delNode 删除节点
   示例 prompt：删除文字为“ai体验技术”的按钮组件。
- getCurrentSelectedNode 获取当前选中节点
   示例 prompt：请总结当前选中的组件。
- getPageSchema 获取当前页面的 schema
   示例 prompt：请总结当前页面的 schema。
- queryNodeById 根据节点 id 查询节点
   示例 prompt： 请选中 文字为“ai体验技术”的按钮组件。
- selectSpecificNode 选中指定节点
   示例 prompt：选中指定节点，节点 id 为 1。

**layout**（command 转换成 tools 的假示例）

- openPluginPanel 打开插件
   示例 prompt：请打开大纲树插件。
- closePluginPanel 关闭插件
   示例 prompt：请关闭大纲树插件。
- getAllPlugin 查询所有插件
   示例 prompt：请总结当前所有的插件。

## 架构概览

系统分为三个主要模块：

1. **WebSocket管理模块** (`wsManager.js`): 管理WebSocket连接和前端注册的工具。
2. **MCP服务器管理模块** (`mcpServerManager.js`): 管理MCP服务器和后端工具。
3. **主服务器模块** (`index.js`): 提供HTTP和WebSocket服务，处理请求和响应。

## 模块职责

### WebSocket管理模块 (wsManager.js)

负责管理WebSocket连接和前端注册的工具列表：

- 维护一个WebSocket连接池
- 存储前端注册的工具列表
- 提供添加和删除连接的方法
- 提供更新工具列表的方法
- 提供向所有客户端广播消息的功能

### MCP服务器管理模块 (mcpServerManager.js)

负责管理MCP服务器和后端工具：

- 管理MCP服务器的生命周期
- 注册和管理后端工具
- 提供从前端获取工具的方法 (`$getMCPTools`)
- 使用WebSocket管理模块广播工具更新

### 主服务器模块 (index.js)

负责提供HTTP和WebSocket服务：

- 创建Express应用和HTTP服务器
- 创建WebSocket服务器
- 处理WebSocket消息
- 将请求转发到合适的模块
- 提供API代理和静态文件服务

## 通信流程

1. **前端注册工具**:
   - 前端连接到WebSocket服务器
   - 前端发送 `register_tools` 消息
   - 服务器更新 `wsManager` 中的工具列表
   - 服务器向所有连接的客户端广播工具更新

2. **后端获取工具**:
   - 后端调用 `mcpManager.$getMCPTools()`
   - `mcpManager` 从 `wsManager` 获取前端注册的工具
   - `mcpManager` 将前端工具与后端工具合并并返回

3. **后端注册工具**:
   - 后端调用 `mcpManager.registerTools()`
   - 后端工具被添加到 `mcpManager.tools` 列表
   - `mcpManager` 通过 `wsManager` 广播工具更新

## 工具类型

系统中的工具分为两种类型：

1. **前端工具**: 由前端注册，具有 `source: "frontend"` 标记
2. **后端工具**: 由后端MCP服务器提供，工具ID以 `mcp_` 开头
