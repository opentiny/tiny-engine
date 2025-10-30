// backend/server/db/index.js
const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// 1. 从环境变量读取 MySQL 配置
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

// 2. 单例模式：防止重复初始化
let AppDataSource = null;
let initPromise = null;

/**
 * 异步初始化 MySQL 数据库连接
 */
async function initializeDb() {
  // 若已初始化或正在初始化，直接返回Promise
  if (initPromise) return initPromise;

  // 标记正在初始化，避免重复调用
  initPromise = (async () => {
    try {
      console.log('⏳ 正在初始化 MySQL 数据库连接...');
      console.log('🔍 MySQL 配置：', {
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        database: mysqlConfig.database,
        username: mysqlConfig.username,
      });

      const materialModelPath = path.resolve(__dirname, 'models/Material.js');
      if (!fs.existsSync(materialModelPath)) {
        throw new Error(`模型文件不存在：${materialModelPath}`);
      }
      const MaterialSchema = require(materialModelPath);

      // 初始化 TypeORM DataSource（核心修改：适配 MySQL）
      AppDataSource = new DataSource({
        type: 'mysql',
        driver: require('mysql2'),
        ...mysqlConfig,
        entities: [MaterialSchema],
        synchronize: true,
        logging: process.env.NODE_ENV === 'development' ? 'all' : false,
        connectorPackage: 'mysql2',
        extra: {
          connectionLimit: 10,
        },
      });

      // 建立数据库连接
      await AppDataSource.initialize();
      console.log('✅ MySQL 数据库连接成功（TypeORM + mysql2）');

      return AppDataSource;
    } catch (error) {
      console.error('❌ MySQL 数据库初始化失败:', error.message);
      console.error('🔍 完整错误栈:', error.stack);
      process.exit(1); // 初始化失败退出进程
    }
  })();

  return initPromise;
}


module.exports = {
  dbConfig: mysqlConfig,
  dbReadyPromise: initializeDb(),
  get AppDataSource() {
    if (!AppDataSource) {
      throw new Error("AppDataSource is not yet initialized. Please await 'dbReadyPromise' first.");
    }
    return AppDataSource;
  },
  initializeDb,
};