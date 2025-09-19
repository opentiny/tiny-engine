require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { postProcessSchemas } = require('../post-processing/post-process-schemas');
const { extractApiFromUrl } = require('../api-generation/web-based-api-generator');
const { generateComponentApiJson } = require('../api-generation/file-based-api-generator');
const { batchConvertToTinyEngineSchema } = require('./convertor');

/**
 * 解析命令行参数
 * @returns {Object} 包含解析后的参数（url, componentDir, outputDir, configPath, sourceType, schemaLogDir, apiLogDir）
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const result = {};

  // 遍历解析参数
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        result.url = args[i + 1];
        i++;
        break;
      case '--dir':
        result.componentDir = args[i + 1];
        i++;
        break;
      case '--outputDir':
        result.outputDir = args[i + 1];
        i++;
        break;
      case '--config':
        result.configPath = args[i + 1];
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
      case '--apiLogDir':  // 新增API日志目录参数
        result.apiLogDir = args[i + 1];
        i++;
        break;
      default:
        console.warn(`忽略未知参数: ${args[i]}`);
    }
  }

  // 全局强制验证 outputPath（两种模式都必须提供）
  if (!result.outputDir) {
    console.error('必须使用 --outputDir 指定输出目录路径！');
    console.log('用法1（URL 爬取）: node cli.js --url https://xxx --config ./config.json --outputDir ./output --apiLogDir ./api-logs');
    console.log('用法2（文件夹生成）: node cli.js --sourceType [code|npm] --dir ./components/button --outputDir ./output --apiLogDir ./api-logs');
    process.exit(1);
  }

  // 验证：URL 模式必须提供配置文件
  if (result.url && !result.configPath) {
    console.error('通过 --url 爬取时，必须使用 --config 指定配置文件路径！');
    console.log('示例：node cli.js --url https://xxx --config ./your-config.json --outputDir ./output --apiLogDir ./api-logs');
    process.exit(1);
  }

  // 验证：文件夹模式必须提供sourceType
  if (result.componentDir) {
    // 设置默认值为code，同时验证有效性
    result.sourceType = result.sourceType || 'code';
    if (!['code', 'npm'].includes(result.sourceType)) {
      console.error(`无效的sourceType: ${result.sourceType}，必须是"code"或"npm"`);
      console.log('示例：node cli.js --sourceType code --dir ./components/button --outputDir ./output --apiLogDir ./api-logs');
      process.exit(1);
    }
  }

  // 验证：无有效参数时提示用法
  if (!result.url && !result.componentDir) {
    console.error('请提供 URL（需配合 --config）或组件文件夹路径（需配合 --sourceType）作为参数！');
    console.log('用法1（URL 爬取）: node cli.js --url https://xxx --config ./config.json --outputDir ./output --apiLogDir ./api-logs');
    console.log('用法2（文件夹生成）: node cli.js --sourceType [code|npm] --dir ./components/button --outputDir ./output --apiLogDir ./api-logs');
    process.exit(1);
  }

  // 验证：配置文件存在性
  if (result.configPath && !fs.existsSync(result.configPath)) {
    console.error(`指定的配置文件不存在: ${result.configPath}`);
    process.exit(1);
  }

  // 验证：组件文件夹存在性
  if (result.componentDir && !fs.existsSync(result.componentDir)) {
    console.error(`指定的组件文件夹不存在: ${result.componentDir}`);
    process.exit(1);
  }

  // 验证 outputDir 对应的目录是否可写
  try {
    const outputDir = path.resolve(result.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const testFile = path.join(outputDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error(`输出目录 ${result.outputDir} 不可写或无法创建: ${error.message}`);
    process.exit(1);
  }

  // 为schemaLogDir设置默认值并验证
  result.schemaLogDir = result.schemaLogDir || path.resolve(__dirname, '../../schema-log');
  try {
    const logDir = path.resolve(result.schemaLogDir);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const testFile = path.join(logDir, '.log-write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error(`日志路径 ${result.schemaLogDir} 不可写或无法创建: ${error.message}`);
    process.exit(1);
  }

  // 为apiLogDir设置默认值并验证（新增）
  result.apiLogDir = result.apiLogDir || path.resolve(__dirname, '../../raw-api-log');
  try {
    const apiDir = path.resolve(result.apiLogDir);
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
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
function saveApiArrayToFiles(apiArray, apiLogDir="../../raw-api-log") {
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
    const componentName = Object.keys(apiObj.components)[0] || `unknown-component-${index + 1}`;
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
 * 主函数（支持两种方式获取子组件数组）
 * 方式1：通过URL爬取 - 用法: node cli.js --url https://xxx --config ./config.json --outputDir ./output --apiLogDir ./api-logs --schemaLogDir ./schema-log
 * 方式2：通过组件文件夹生成 - 用法: node cli.js --sourceType [code|npm] --dir ./components/button --outputDir ./output --apiLogDir ./api-logs --schemaLogDir ./schema-log
 */
async function main() {
  try {
    // 1. 解析命令行参数
    const { url, componentDir, outputDir, configPath, sourceType, schemaLogDir, apiLogDir } = parseCommandLineArgs();

    let apiArray;

    // 2. 根据参数类型获取子组件数组
    if (url) {
      // 方式1：URL 爬取（需读取配置文件）
      console.log(`开始爬取 URL: ${url}`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      apiArray = await extractApiFromUrl(url, config);
      console.log(`爬取完成：共 ${apiArray.length} 个子组件`);
    } else if (componentDir) {
      // 方式2：组件文件夹生成（传入sourceType参数）
      console.log(`开始处理组件文件夹: ${componentDir}（来源类型：${sourceType}）`);
      apiArray = await generateComponentApiJson(componentDir, sourceType);

      if (!Array.isArray(apiArray) || apiArray.length === 0) {
        throw new Error("生成的API数组为空或格式不正确");
      }
      console.log(`组件API生成完成：共 ${apiArray.length} 个子组件`);
    } else {
      throw new Error("未提供有效的URL或组件文件夹路径");
    }

    // 3. 调用封装函数批量保存API（核心优化点）
    const saveResult = saveApiArrayToFiles(apiArray, apiLogDir);

    // （可选）若需要中断流程，可在此处判断失败数量（如失败超过N个则退出）
    // if (saveResult.failCount > 3) {
    //   throw new Error(`API保存失败数量过多（${saveResult.failCount}个），终止流程`);
    // }

    // 4. 批量转换
    const conversionResults = await batchConvertToTinyEngineSchema(apiArray, undefined, undefined, undefined, schemaLogDir);

    // 5. 输出转换结果
    console.log('\n--- 转换结果明细 ---');
    conversionResults.forEach((item, index) => {
      const status = item.success === false ? '❌ 失败' : '✅ 成功';
      const msg = item.success === false ? `| 原因：${item.error}` : '';
      console.log(`[${index + 1}] 子组件[${item.subComponentName}]：${status} ${msg}`);
    });

    // 6. 后续处理
    console.log('\n--- 开始后续处理 ---');
    const finalResults = postProcessSchemas(conversionResults, outputDir);
    console.log('\n--- 批量转换全部完成 ---');
    return finalResults;

  } catch (error) {
    console.error(`整体流程失败: ${error.message}`);
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
  saveApiJsonToFile
};
