const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const materialRoutes = require('./routes/material');
const materialsRoutes = require('./routes/materials'); // 物料管理路由
const errorHandler = require('./middlewares/errorHandler');
const { initializeDb } = require('./db');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// 先初始化数据库，再启动服务
initializeDb()
  .then(() => {
    // 中间件配置
    const allowOrigins = process.env.CORS_ALLOW_ORIGIN || '*';
    const corsOrigin = allowOrigins === '*'
      ? true
      : allowOrigins.split(',').map(origin => origin.trim()).filter(Boolean);

    app.use(cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: allowOrigins !== '*'
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // 路由注册
    app.use('/api/material', materialRoutes);
    app.use('/api/materials', materialsRoutes);

    // 404处理
    app.use((req, res) => {
      res.status(404).json({ code: 404, message: `接口不存在`, success: false });
    });

    // 错误处理
    app.use(errorHandler);

    // 启动服务
    app.listen(PORT, () => {
      console.log(`后端服务启动成功，端口：${PORT}`);
      console.log(`接口文档：http://localhost:${PORT}/api/material/docs`);
    });
  }).catch((err) => {
    console.error('❌ 数据库初始化失败，服务未启动：', err);
    process.exit(1);
  });

// 错误捕获
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  未处理的Promise拒绝:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('⚠️  未捕获的同步错误:', error);
});

module.exports = app;