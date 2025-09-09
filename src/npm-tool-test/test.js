// 仅导入必要依赖
const fs = require('fs');
const path = require('path');
const { createChecker } = require('vue-component-meta');

// --------------------------
// 1. 配置路径（直接硬编码，简化测试）
// --------------------------
const config = {
  projectRoot: 'D:\\OSPP\\element-plus', // Element Plus 项目根目录
  // tsconfigPath: 'D:\\OSPP\\element-plus\\tsconfig.web.json', // 推荐使用的配置文件
  tsconfigPath: 'D:\\OSPP\\element-plus\\tsconfig.web-merged.json', // 推荐使用的配置文件
  componentPath: 'D:\\OSPP\\element-plus\\packages\\components\\badge\\src\\badge.vue', // 目标组件文件
  outputDir: 'C:\\Users\\zyun\\Desktop\\LowCode-Material-Import\\npm-to-api-json-log' // 测试输出目录
};

// --------------------------
// 2. 简单工具函数（仅保留必要校验/保存逻辑）
// --------------------------
/** 校验文件是否存在 */
function checkFileExists(filePath, tip) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [${tip}] 文件不存在: ${filePath}`);
    process.exit(1); // 直接退出，避免后续无效执行
  }
  console.log(`✅ [${tip}] 路径有效: ${filePath}`);
}

/** 保存结果到文件（便于查看原始元数据） */
function saveResult(filename, data) {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  const savePath = path.join(config.outputDir, filename);
  fs.writeFileSync(savePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`📁 结果已保存至: ${savePath}`);
}

// --------------------------
// 3. 核心测试逻辑
// --------------------------
async function runTest() {
  console.log('===== 开始测试 vue-component-meta 解析 badge.vue =====\n');

  // 步骤1: 校验输入路径
  checkFileExists(config.tsconfigPath, 'TS配置文件');
  checkFileExists(config.componentPath, '目标组件文件');

  // 步骤2: 初始化元数据检查器（核心验证点1）
  console.log('\n🔧 正在初始化元数据检查器...');
  let checker;
  try {
    checker = createChecker(config.tsconfigPath, {
      forceUseTs: true, // 强制解析TS
      // skipLibCheck: true // 跳过库类型检查，加速执行
    });
    console.log('✅ 检查器初始化成功！');
  } catch (err) {
    console.error('❌ 检查器初始化失败:', err.message);
    console.error('📜 错误堆栈:', err.stack);
    process.exit(1);
  }

  // 步骤3: 提取组件元数据（核心验证点2）
  console.log(`\n📊 正在解析组件: ${path.basename(config.componentPath)}`);
  try {
    // 提取原始元数据（不做过滤，保留完整信息）
    const rawMeta = checker.getComponentMeta(config.componentPath);
    
    // 保存原始元数据（便于调试）
    saveResult('badge-raw-meta.json', rawMeta);

    // 简单判断是否提取到有效数据
    if (rawMeta.props?.length || rawMeta.slots?.length || rawMeta.events?.length) {
      console.log('✅ 元数据提取成功！');
      console.log(`- Props数量: ${rawMeta.props?.length || 0}`);
      console.log(`- Slots数量: ${rawMeta.slots?.length || 0}`);
      console.log(`- Events数量: ${rawMeta.events?.length || 0}`);
    } else {
      console.warn('⚠️  元数据提取为空！请查看原始数据文件分析原因');
    }
  } catch (err) {
    console.error('❌ 解析组件失败:', err.message);
    console.error('📜 错误堆栈:', err.stack);
  }

  console.log('\n===== 测试结束 =====');
}

// 启动测试
runTest();