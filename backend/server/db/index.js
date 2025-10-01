// backend/server/db/index.js
const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

// 1. 确保数据目录存在（不变）
const dbPath = path.resolve(__dirname, '../../data/materials.db');
const dataDir = path.dirname(dbPath);
console.log('🔍 调试：data目录路径', dataDir);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📂 已创建数据库存储目录：${dataDir}`);
} else {
  console.log(`📂 数据库存储目录已存在：${dataDir}`);
}

// 2. 单例模式：防止重复初始化
let AppDataSource = null;
let sqlDb = null;
let initPromise = null; // 用Promise确保初始化只执行一次

/**
 * 异步初始化数据库连接（单例）
 */
async function initializeDb() {
  // 若已初始化或正在初始化，直接返回Promise
  if (initPromise) return initPromise;

  // 标记正在初始化，避免重复调用
  initPromise = (async () => {
    try {
      console.log('⏳ 正在加载 sql.js 引擎...');
      const SQL = await initSqlJs();
      const { Database } = SQL;

      // 读取已有数据库文件
      let dbBuffer = null;
      if (fs.existsSync(dbPath)) {
        dbBuffer = fs.readFileSync(dbPath);
        console.log('🔍 调试：已加载现有数据库文件');
      }

      // 初始化sql.js实例
      sqlDb = new Database(dbBuffer);
      console.log('✅ sql.js Database 实例创建成功');

      // 3. 关键修复：使用绝对路径加载模型（避免相对路径歧义）
      const materialModelPath = path.resolve(__dirname, 'models/Material.js');
      console.log('🔍 调试：模型文件路径', materialModelPath);
      // 验证模型文件是否存在
      if (!fs.existsSync(materialModelPath)) {
        throw new Error(`模型文件不存在：${materialModelPath}`);
      }
      const MaterialSchema = require(materialModelPath);

      // 4. 初始化TypeORM DataSource（显式传入模型）
      AppDataSource = new DataSource({
        type: 'sqljs',
        driver: SQL,
        location: undefined,
        // 直接传入加载的模型（而非glob路径，避免解析失败）
        entities: [MaterialSchema],
        synchronize: true, // 自动同步模型到数据库
        logging: process.env.NODE_ENV === 'development' ? 'all' : false,
        extra: {
          db: sqlDb,
          // onUpdate: (db) => {
          //   try {
          //     process.stdout.write(`\n⚠️ 【强制输出】onUpdate 开始执行\n`);
          //     // 1. 导出内存中的数据库数据
          //     const data = db.export();
          //     // 2. 验证dbPath是否正确（绝对路径）
          //     console.log(`🔍 调试：准备写入文件，路径=${dbPath}，数据长度=${data.length}`);
          //     // 3. 写入文件（用Buffer包装，确保二进制格式正确）
          //     fs.writeFileSync(dbPath, Buffer.from(data));
          //     // 4. 验证文件是否生成
          //     const stats = fs.statSync(dbPath);
          //     process.stdout.write(`⚠️ 【强制输出】数据持久化成功，文件大小=${stats.size} bytes\n`);
          //     console.log(`✅ 数据已持久化到磁盘，文件大小=${stats.size} bytes`);
          //   } catch (writeError) {
          //     console.error('❌ 数据持久化失败:', writeError.message);
          //   }
          // }
        }
      });

      // 5. 连接数据库
      await AppDataSource.initialize();
      console.log('✅ 数据库连接成功（TypeORM + sql.js）');

      // 插入测试数据（不变）
      const materialRepository = AppDataSource.getRepository('Material');
      const existingTestData = await materialRepository.findOneBy({
        taskId: 'init-test-001'
      });

      if (!existingTestData) {
        const testMaterial = materialRepository.create({
          taskId: 'init-test-001',
          importType: 'url',
          source: 'https://init-test.com',
          componentName: 'InitTestButton',
          content: { label: '初始化测试按钮', type: 'primary' },
          status: 'active'
        });
        await materialRepository.save(testMaterial);
        console.log('✅ 测试数据插入成功');
      } else {
        console.log('✅ 测试数据已存在');
      }

      // 强制生成文件
      const data = sqlDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
      console.log('✅ 强制生成 materials.db 文件');

      return AppDataSource;
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error.message);
      console.error('🔍 调试：完整错误栈', error.stack);
      process.exit(1); // 初始化失败退出进程
    }
  })();

  return initPromise;
}

// 导出（保持不变）
module.exports = {
  dbPath,
  dbReadyPromise: initializeDb(), // 首次调用初始化
  get AppDataSource() {
    if (!AppDataSource) {
      throw new Error("AppDataSource is not yet initialized. Please await 'dbReadyPromise' first.");
    }
    return AppDataSource;
  },
  initializeDb,
  get sqlDb() { // 新增：导出 sqlDb 实例（getter 确保初始化后访问）
    if (!sqlDb) {
      throw new Error("sqlDb is not yet initialized. Please await 'dbReadyPromise' first.");
    }
    return sqlDb;
  }
};