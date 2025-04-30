// 静态文件服务器，用于提供dist目录下的静态文件
// 同时将API请求代理到localhost:9090
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import aiService from './ai.js';
import http from 'http';
import { WebSocketServer } from 'ws';
import mcpManager from './mcpServerManager.js';
import wsManager from './wsManager.js';
import BuiltinMCPServer  from './builtinMcpServer.js';
// import fs from 'fs';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4060;
// const WS_PORT = process.env.WS_PORT || 4061;
const WS_PORT = 4090;

// 初始化WebSocket管理模块
wsManager.init();

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocketServer({ port: WS_PORT });

// WebSocket连接处理
wss.on('connection', (ws) => {
  console.log('WebSocket客户端已连接');
  
  // 将连接添加到连接池
  wsManager.addWSConnection(ws);
  mcpManager.initBuiltinServer(new BuiltinMCPServer(mcpManager), true);
  
  // 处理接收到的消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('index.js 收到WebSocket消息:', data);
      
      // 根据消息类型处理不同的请求
      switch(data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          break;
        
        // case 'get_registered_tools':
        //   // 处理获取注册工具的请求
        //   handleGetRegisteredTools(ws, data);
        //   break;
          
        // case 'register_builtin_tools':
        //   // 处理注册工具的请求
        //   // handleRegisterTools(ws, data);
        //   console.log('data', data)
        //   mcpManager.registerBuiltinTool(data.tools);
        //   mcpManager.initBuiltinServer(new BuiltinMCPServer(mcpManager), true);
        //   break;
        
        // case 'get_builtin_tools':
        //   // 处理获取内置工具的请求（仅由MCPManager内部调用）
        //   handleGetBuiltinTools(ws, data);
        //   break;
        
        case 'chat':
          // 调用AI服务处理聊天请求
          // handleChatRequest(ws, data);
          aiService.chat(data)
          break;
        default:
          console.log('index.js default handler:', data);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: '未知的消息类型' 
          }));
      }
    } catch (error) {
      console.error('处理WebSocket消息出错:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: '处理消息时出错: ' + error.message 
      }));
    }
  });
  
  // 处理连接关闭
  ws.on('close', () => {
    console.log('WebSocket客户端已断开连接');
    // 从连接池中移除连接
    wsManager.removeWSConnection(ws);
  });
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome', 
    message: '已连接到WebSocket服务器'
  }));
});

// 添加解析JSON请求体的中间件
// app.use(express.json());
// // 添加解析URL编码请求体的中间件
// app.use(express.urlencoded({ extended: true }));

// 创建通用代理配置
const createProxyConfig = (path, target = 'http://localhost:9090') => {
  return {
    logger: console,
    target,
    changeOrigin: true,
    pathRewrite: { '^/': path + '/' }, // 将所有请求路径重写为/platform-center开头
    onProxyReq: (proxyReq, req) => {
      // 记录代理请求信息
      console.log('req', res)
      console.log(`代理请求: ${req.method} ${req.url} -> http://localhost:9090${req.url}`);
    },
    onError: (err, req, res) => {
      // eslint-disable-next-line no-console
      console.error(`${path}代理错误:`, err);
      res.status(500).send(`代理${path}请求到API服务器时出错`);
    }
  };
};

// 配置静态文件服务
// app.use(express.static(path.join(__dirname, 'dist')));
// 处理 /preview 请求，返回 preview.html
// app.get('/preview', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'preview.html'));
// });

// 配置三个不同路径的API代理
// 拦截 /app-center/api/chat 请求，交给 ai.js 处理

// app.use('/app-center/api/chat', (req, res) => {
//   aiService.chat(req, res);
// });
app.use('/app-center/api/ai/chat', createProxyMiddleware(createProxyConfig('/platform-center')));
app.use('/platform-center', createProxyMiddleware(createProxyConfig('/platform-center')));
app.use('/app-center', createProxyMiddleware(createProxyConfig('/app-center')));
app.use('/material-center', createProxyMiddleware(createProxyConfig('/material-center')));

// 其他请求转发到前端
app.get('*', createProxyMiddleware(createProxyConfig('*', 'http://localhost:8090')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

// 启动服务器
server.listen(PORT, () => {
  // 启动时的日志信息
  // eslint-disable-next-line no-console
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket服务器运行在 ws://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`静态文件从 ${path.join(__dirname, 'dist')} 提供服务`);
  // eslint-disable-next-line no-console
  console.log(`API请求被代理到 http://localhost:9090`);
});
