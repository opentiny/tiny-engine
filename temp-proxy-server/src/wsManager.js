// WebSocket连接管理模块
// 用于管理WebSocket连接和工具注册

// 全局变量，用于存储WebSocket连接
let wsConnections = new Set();


// 添加WebSocket连接
export function addWSConnection(connection) {
  wsConnections.add(connection);
  console.log(`WebSocket连接已添加，当前连接数: ${wsConnections.size}`);
  return wsConnections;
}

// 移除WebSocket连接
export function removeWSConnection(connection) {
  const result = wsConnections.delete(connection);
  console.log(`WebSocket连接已移除，当前连接数: ${wsConnections.size}`);
  return result;
}

// 获取所有WebSocket连接
export function getWSConnections() {
  return Array.from(wsConnections);
}


// 向所有连接的WebSocket客户端广播消息
export function broadcastToAll(message) {
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }

  let broadcastCount = 0;
  for (const ws of wsConnections) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(message);
      broadcastCount++;
    }
  }

  console.log(`已向 ${broadcastCount} 个WebSocket客户端广播消息`);
  return broadcastCount;
}

// 初始化模块
export function init() {
  console.log('WebSocket管理模块已初始化');
}

// 发送WebSocket请求
export function sendWebSocketRequest(request) {
  return Array.from(wsConnections)[0].send(JSON.stringify(request));
}

export default {
  addWSConnection,
  removeWSConnection,
  getWSConnections,
  init,
  sendWebSocketRequest,
  broadcastToAll
}; 