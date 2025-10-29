const fs = require('fs').promises;
const path = require('path');

/**
 * 读取JSON文件并解析为JavaScript对象
 * @param {string} filePath - JSON文件的绝对路径或相对路径
 * @returns {Promise<object>} 解析后的JSON对象
 * @throws {Error} 读取失败或JSON解析错误时抛出异常
 */
async function readJsonFile(filePath) {
  try {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const fileContent = await fs.readFile(resolvedPath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    console.log(`📥 成功读取JSON文件：${resolvedPath}`);
    return jsonData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`文件不存在：${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`JSON格式错误（${filePath}）：${error.message}`);
    } else {
      throw new Error(`读取JSON文件失败（${filePath}）：${error.message}`);
    }
  }
}

/**
 * 处理JSON对象：删除snippets字段（若存在）
 * @param {object} jsonData - 原始JSON对象
 * @returns {object} 移除snippets字段后的JSON对象
 */
function removeItemSnippets(jsonData) {
  // 校验输入类型：非对象/数组直接返回，避免展开操作报错
  if (!jsonData || typeof jsonData !== 'object') {
    console.warn('ℹ️ 输入不是对象，跳过移除snippets');
    return jsonData;
  }
  
  // 复制原对象避免直接修改输入（纯函数思想）
  const processedData = { ...jsonData };
  
  if ('snippets' in processedData) {
    delete processedData.snippets;
    console.log(`🔧 已成功移除snippets字段`);
  } else {
    console.log(`ℹ️ JSON对象中未找到snippets字段，无需处理`);
  }
  
  return processedData;
}

/**
 * 命令行执行入口：处理文件读写和流程控制
 */
async function cliEntry() {
  const [inputPath, outputPath] = process.argv.slice(2);

  if (!inputPath) {
    console.error('❌ 缺少输入文件路径！');
    console.log('用法：');
    console.log('1. 默认输出（输入文件夹下生成 原文件名_removed.json）：node remove-snippets.js ./your-file.json');
    console.log('2. 自定义输出路径：node remove-snippets.js ./input.json ./custom-output.json');
    process.exit(1);
  }

  try {
    // 1. 读取输入文件（先解析输入路径，确保后续能获取正确目录）
    const resolvedInputPath = path.resolve(process.cwd(), inputPath);
    const originalJson = await readJsonFile(resolvedInputPath);

    // 2. 处理JSON对象（移除snippets）
    const processedJson = removeItemSnippets(originalJson);

    // 3. 确定输出路径：优先用自定义路径，否则生成默认路径
    let resolvedOutputPath;
    if (outputPath) {
      // 自定义路径：转为绝对路径
      resolvedOutputPath = path.resolve(process.cwd(), outputPath);
    } else {
      // 默认路径：输入文件所在文件夹/原文件名_removed.json
      // 步骤1：提取输入文件的目录（如 ./src/json → 保持原目录）
      const inputDir = path.dirname(resolvedInputPath);
      // 步骤2：提取输入文件的“文件名主体”（如 your-file.json → your-file）
      const inputFileName = path.basename(resolvedInputPath, path.extname(resolvedInputPath));
      // 步骤3：提取输入文件的后缀（如 .json → 保持原后缀）
      const inputExt = path.extname(resolvedInputPath);
      // 步骤4：拼接默认输出路径（目录 + 主体_removed + 后缀）
      resolvedOutputPath = path.join(inputDir, `${inputFileName}_removed${inputExt}`);
    }

    // 4. 写入处理结果
    await fs.writeFile(
      resolvedOutputPath,
      JSON.stringify(processedJson, null, 2),
      'utf8'
    );

    console.log(`✅ 处理完成！文件已保存至：${resolvedOutputPath}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ 处理失败：${error.message}`);
    process.exit(1);
  }
}

// 命令行直接执行
if (require.main === module) {
  cliEntry();
}

// 模块导出
module.exports = {
  readJsonFile,
  removeItemSnippets
};
    