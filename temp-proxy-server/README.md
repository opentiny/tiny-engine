# WebSocket MCP工具管理系统

本项目实现了一个基于WebSocket的MCP（Model-Controller-Presenter）工具管理系统，允许前端和后端共享和管理工具。

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

## 使用方法

1. 在 temp-proxy-server 目录下增加 `config.js` 文件

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

2. 启动服务器:
   ```
   node src/index.js
   ```
