const path = require('path');
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env') // 从 server/ 目录向上一级（根目录）查找 .env
});

const express = require('express');
const cors = require('cors');
const materialRoutes = require('./routes/material');
const errorHandler = require('./middlewares/errorHandler');

// 初始化Express
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// 中间件配置
app.use(cors({
  origin: process.env.CORS_ALLOW_ORIGIN || '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // 支持较大的config参数
app.use(express.urlencoded({ extended: true }));

// 注册路由
app.use('/api/material', materialRoutes);

// 404处理
app.use((req, res, next) => {
  res.status(404).json({
    code: 404,
    message: `接口 ${req.originalUrl} 不存在`,
    success: false
  });
});

// 全局错误处理中间件
app.use(errorHandler);

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  未处理的 Promise 拒绝:', promise, '原因:', reason);
  // 记录到日志文件（推荐）
  // fs.appendFileSync('error.log', `[${new Date()}] unhandledRejection: ${reason}\n`);
});

// 捕获未捕获的同步错误
process.on('uncaughtException', (error) => {
  console.error('⚠️  未捕获的同步错误:', error);
  // 记录到日志文件
  // fs.appendFileSync('error.log', `[${new Date()}] uncaughtException: ${error.stack}\n`);
  // 非致命错误可尝试不退出进程
  // process.exit(1); // 仅在无法恢复时退出
});

// 启动服务
app.listen(PORT, () => {
  console.log(`后端服务启动成功，端口：${PORT}`);
  console.log(`接口文档：http://localhost:${PORT}/api/material/docs`);
});

module.exports = app;