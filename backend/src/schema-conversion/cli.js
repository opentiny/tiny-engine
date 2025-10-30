const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});
const fs = require('fs');
const { postProcessSchemas } = require('../post-processing/post-process-schemas');
// const { extractApiFromUrl } = require('../api-generation/web-based-api-generator');
const { extractApiFromUrl } = require('../api-generation/web-table-based-api-generator');
const { generateComponentApiJson } = require('../api-generation/file-based-api-generator');
const { batchConvertToTinyEngineSchema } = require('./convertor');

/**
 * 解析命令行参数
 * @returns {Object} 包含解析后的参数（url, target, componentName, outputDir, tableSelector, sourceType, schemaLogDir, apiLogDir）
 *   - target: 源码目录路径（code类型）或NPM包名（npm类型）
 *   - componentName: NPM类型必填，目标组件名
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const result = {};

  // 遍历解析参数（新增--componentName处理）
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        result.url = args[i + 1];
        i++;
        break;
      case '--target': // 重命名--dir为--target，适配code/npm两种类型（目录/NPM包名）
        result.target = args[i + 1];
        i++;
        break;
      case '--componentName': // 新增：NPM类型必填的组件名参数
        result.componentName = args[i + 1];
        i++;
        break;
      case '--outputDir':
        result.outputDir = args[i + 1];
        i++;
        break;
      case '--tableSelector':
        result.tableSelector = args[i + 1];
        i++;
        break;
      case '--sourceType':
        result.sourceType = args[i + 1];
        i++;
        break;
      case '--schemaLogDir':
        result.schemaLogDir = args[i + 1];
        i++;
        break;
      case '--apiLogDir':
        result.apiLogDir = args[i + 1];
        i++;
        break;
      default:
        console.warn(`忽略未知参数: ${args[i]}`);
    }
  }

  // 1. 必传公共参数校验
  if (!result.outputDir) {
    console.error('必须使用 --outputDir 指定输出目录路径！');
    printUsage(); // 统一打印用法
    process.exit(1);
  }

  // 2. URL模式校验（无变化）
  if (result.url) {
    if (!result.tableSelector) {
      console.error('通过 --url 爬取时，必须使用 --tableSelector 指定表格选择器！');
      printUsage();
      process.exit(1);
    }
    return result;
  }

  // 3. 源码/NPM模式校验（基于--target和--sourceType）
  if (!result.target) {
    console.error('请提供 --target 参数（源码目录路径或NPM包名）！');
    printUsage();
    process.exit(1);
  }

  // 3.1 校验sourceType有效性
  result.sourceType = result.sourceType || 'code';
  if (!['code', 'npm'].includes(result.sourceType)) {
    console.error(`无效的sourceType: ${result.sourceType}，必须是"code"或"npm"`);
    printUsage();
    process.exit(1);
  }

  // 3.2 按sourceType区分校验
  if (result.sourceType === 'code') {
    // code类型：校验target是否为目录
    if (!fs.existsSync(result.target) || !fs.lstatSync(result.target).isDirectory()) {
      console.error(`code类型的--target必须是存在的目录: ${result.target}`);
      process.exit(1);
    }
  } else if (result.sourceType === 'npm') {
    // npm类型：校验componentName是否存在
    if (!result.componentName || typeof result.componentName !== 'string' || result.componentName.trim() === '') {
      console.error('npm类型必须使用 --componentName 指定目标组件名（如button）！');
      printUsage();
      process.exit(1);
    }
    // 修剪空格，避免无效字符
    result.componentName = result.componentName.trim();
  }

  // 4. 输出目录、日志目录可写性校验（无变化）
  // 4.1 输出目录
  try {
    const outputDir = path.resolve(result.outputDir);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const testFile = path.join(outputDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error(`输出目录 ${result.outputDir} 不可写或无法创建: ${error.message}`);
    process.exit(1);
  }

  // 4.2 schema日志目录
  result.schemaLogDir = result.schemaLogDir || path.resolve(__dirname, '../../schema-log');
  try {
    const logDir = path.resolve(result.schemaLogDir);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const testFile = path.join(logDir, '.log-write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error(`日志路径 ${result.schemaLogDir} 不可写或无法创建: ${error.message}`);
    process.exit(1);
  }

  // 4.3 API日志目录
  result.apiLogDir = result.apiLogDir || path.resolve(__dirname, '../../raw-api-log');
  try {
    const apiDir = path.resolve(result.apiLogDir);
    if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });
    const testFile = path.join(apiDir, '.api-log-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error(`API日志路径 ${result.apiLogDir} 不可写或无法创建: ${error.message}`);
    process.exit(1);
  }

  return result;
}

/**
 * 保存单个API JSON到指定目录，文件名格式为“组件名-时间戳.json”
 * @param {string} componentName - 组件名（用于生成文件名）
 * @param {Object} apiJson - 要保存的结构化API JSON数据
 * @param {string} baseDir - 保存的基础目录
 * @returns {string} 保存的文件绝对路径
 */
function saveApiJsonToFile(componentName, apiJson, baseDir) {
  try {
    // 1. 生成时间戳（格式：YYYYMMDDHHmmss，避免特殊字符）
    const timestamp = new Date().toISOString()
      .replace(/[-T:\.Z]/g, "")
      .slice(0, 14); // 保留到秒级，如20240520143025

    // 2. 构建文件名：组件名-时间戳.json（移除组件名中可能的特殊字符）
    const safeComponentName = componentName.replace(/[^\w\u4e00-\u9fa5]/g, "-"); // 只保留字母、数字、中文、横线
    const fileName = `${safeComponentName}-${timestamp}.json`;

    // 3. 构建完整保存路径（确保目录存在）
    const saveDir = path.resolve(baseDir);
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true }); // 递归创建目录（支持多级目录）
      console.log(`📂 已创建API保存目录：${saveDir}`);
    }
    const savePath = path.join(saveDir, fileName);

    // 4. 写入JSON文件（格式化输出，缩进2个空格）
    fs.writeFileSync(savePath, JSON.stringify(apiJson, null, 2), "utf-8");
    return savePath;
  } catch (error) {
    console.error("❌ 保存API JSON文件失败：", error.message);
    throw new Error("文件保存失败，请检查目录权限或路径合法性");
  }
}
/**
 * 批量保存API数组中的每个元素到文件
 * @param {Array<Object>} apiArray - 待保存的API对象数组
 * @param {string} [apiLogDir="../../raw-api-log"] - 保存目录路径
 * @returns {Object} 保存结果汇总（successCount: 成功数量, failCount: 失败数量, failures: 失败详情数组）
 */
function saveApiArrayToFiles(apiArray, apiLogDir = "../../raw-api-log") {
  // 初始化结果统计
  const result = {
    successCount: 0,
    failCount: 0,
    failures: []
  };

  // 边界校验：空数组直接返回
  if (!Array.isArray(apiArray) || apiArray.length === 0) {
    console.warn("⚠️  待保存的API数组为空，跳过保存");
    return result;
  }

  console.log(`\n--- 开始保存API JSON文件（共${apiArray.length}个）---`);

  // 遍历数组保存每个API对象
  apiArray.forEach((apiObj, index) => {
    // 提取组件名（优先从components键获取，无则用索引兜底）
    const componentName =
      apiObj && apiObj.components && typeof apiObj.components === 'object'
        ? (Object.keys(apiObj.components)[0] || `unknown-component-${index + 1}`)
        : `unknown-component-${index + 1}`;
    const sequence = `${index + 1}/${apiArray.length}`; // 进度标识（如 1/5）

    try {
      const savePath = saveApiJsonToFile(componentName, apiObj, apiLogDir);
      console.log(`[${sequence}] ✅ 已保存API（${componentName}）: ${savePath}`);
      result.successCount++;
    } catch (error) {
      const errorMsg = error.message;
      console.warn(`[${sequence}] ❌ 保存API失败（${componentName}）: ${errorMsg}`);
      // 记录失败详情（便于后续追溯）
      result.failures.push({
        index,
        componentName,
        error: errorMsg
      });
      result.failCount++;
    }
  });

  // 输出保存汇总
  console.log(`\n--- API JSON文件保存完成 ---`);
  console.log(`📊 汇总：成功 ${result.successCount} 个 | 失败 ${result.failCount} 个`);
  if (result.failCount > 0) {
    console.warn(`⚠️  失败详情：${JSON.stringify(result.failures.map(f => f.componentName))}`);
  }

  return result;
}

/**
 * 打印命令行用法说明（独立函数，便于维护）
 */
function printUsage() {
  console.log('\n=== 命令行用法说明 ===');
  console.log('用法1（URL 爬取）:');
  console.log('  node cli.js --url https://xxx --tableSelector .vp-table --outputDir ./output --apiLogDir ./api-logs');
  console.log('\n用法2（本地源码目录）:');
  console.log('  node cli.js --sourceType code --target ./components/button --outputDir ./output --apiLogDir ./api-logs');
  console.log('\n用法3（NPM包）:');
  console.log('  node cli.js --sourceType npm --target element-plus --componentName button --outputDir ./output --apiLogDir ./api-logs');
  console.log('\n参数说明:');
  console.log('  --url: 爬取目标URL（仅URL模式）');
  console.log('  --tableSelector: 表格CSS选择器（仅URL模式）');
  console.log('  --target: 源码目录路径（code模式）或NPM包名（npm模式）');
  console.log('  --componentName: 目标组件名（仅npm模式必填）');
  console.log('  --sourceType: 来源类型（code/npm，默认code）');
  console.log('  --outputDir: 最终物料输出目录（必填）');
  console.log('  --apiLogDir: 原始API JSON保存目录（默认../../raw-api-log）');
  console.log('  --schemaLogDir: 转换日志保存目录（默认../../schema-log）');
}

/**
 * 主函数（支持三种方式：URL爬取、本地源码、NPM包）
 */
async function main() {
  try {
    // 1. 解析命令行参数
    const {
      url, tableSelector, target, componentName,
      outputDir, sourceType, schemaLogDir, apiLogDir
    } = parseCommandLineArgs();

    let apiArray;

    // 2. 根据参数类型获取API数组
    if (url) {
      // 方式1：URL 爬取
      console.log(`开始爬取 URL: ${url}，使用表格选择器: ${tableSelector}`);
      apiArray = await extractApiFromUrl(url, tableSelector);
      if (!Array.isArray(apiArray) || apiArray.length === 0) {
        throw new Error("从URL爬取的API数组为空或格式不正确");
      }
      console.log(`爬取完成：共 ${apiArray.length} 个子组件`);

    } else if (target) {
      // 方式2：源码/NPM包生成（适配generateComponentApiJson的完整参数）
      console.log(`开始处理 ${sourceType === 'code' ? '源码目录' : 'NPM包'}: ${target}（组件：${componentName || '默认'}）`);
      // 关键修改：npm类型传递componentName，code类型无需传递（第三个参数留空）
      apiArray = await generateComponentApiJson(target, sourceType, componentName);

      if (!Array.isArray(apiArray) || apiArray.length === 0) {
        throw new Error("生成的API数组为空或格式不正确");
      }
      console.log(`API生成完成：共 ${apiArray.length} 个子组件`);

    } else {
      throw new Error("未提供有效的URL或target参数");
    }

    // 3. 批量保存API
    const saveResult = saveApiArrayToFiles(apiArray, apiLogDir);

    // 4. 批量转换为TinyEngine物料
    const conversionResults = await batchConvertToTinyEngineSchema(
      apiArray,
      undefined,
      undefined,
      undefined,
      schemaLogDir
    );

    // 5. 输出转换结果明细
    console.log('\n--- 转换结果明细 ---');
    conversionResults.forEach((item, index) => {
      const status = item.success === false ? '❌ 失败' : '✅ 成功';
      const msg = item.success === false ? `| 原因：${item.error}` : '';
      console.log(`[${index + 1}] 子组件[${item.subComponentName}]：${status} ${msg}`);
    });

    // 6. 后续处理
    console.log('\n--- 开始后续处理 ---');
    const finalResults = await postProcessSchemas(conversionResults, outputDir);
    console.log('\n--- 批量转换全部完成 ---');
    return finalResults;

  } catch (error) {
    console.error(`整体流程失败: ${error.message}`);
    process.exit(1); // 非0退出，标识命令行执行失败
  }
}


// 命令行直接运行时执行主函数
if (require.main === module) {
  main();
}

// 对外导出（可选，供其他模块调度命令行流程）
module.exports = {
  main,
  parseCommandLineArgs,
  saveApiJsonToFile,
  saveApiArrayToFiles
};
