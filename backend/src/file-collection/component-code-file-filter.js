/**
 * 遍历组件源码目录，找出包含组件 API 信息的文件
 * 支持递归遍历，调用大模型筛选 props/events/slots 相关文件
 */

const fs = require("fs");
const os = require('os');
const AdmZip = require('adm-zip');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require("openai");

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  timeout: 600000, // 10分钟超时
});

/**
 * 递归获取指定目录下的所有文件路径（跳过 style 文件夹）
 * @param {string} dirPath - 目录路径
 * @returns {string[]} 文件路径数组
 */
function getAllFiles(dirPath) {
  const fileList = [];

  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // 核心修改：若当前是目录且名称为 "style"，则跳过该目录
      if (entry.isDirectory()) {
        if (entry.name.toLowerCase() === "style") {
          console.log(`⚠️  跳过 style 文件夹: ${fullPath}`);
          continue; // 不进入 style 目录，直接跳过
        }
        traverse(fullPath); // 非 style 目录，继续递归
      } else {
        fileList.push(fullPath); // 是文件，加入列表
      }
    }
  }

  traverse(dirPath);
  return fileList;
}

/**
 * 调用大模型判断文件是否包含 props/events/slots 信息
 * @param {string} filePath - 文件绝对路径
 * @param {string} baseDir - 基准目录（用户输入目录），用于生成相对路径
 * @returns {Promise<{fileName: string, filePath: string, fileLength: number, hasApiInfo: boolean}>}
 */
async function checkFileWithLLM(filePath, baseDir, { signal } = {}) {
  try {
    if (signal?.aborted) throw new Error('任务被用户取消');

    const content = fs.readFileSync(filePath, "utf-8");
    // 生成相对于基准目录的相对路径
    const relativePath = path.relative(baseDir, filePath);

    const promptMessages = [
      {
        role: "system",
        content: "你是一个分析 Vue 组件源码文件的助手，可适配各类组件库。",
      },
      {
        role: "user",
        content: `
请阅读下面的源码文件内容，并判断它是否包含组件 API 信息（如 props/attributes、events、slots）。
特别规则：如果识别到该文件是 **组件根目录下的入口文件** ，直接返回 { "hasApiInfo": true }。
对于非入口文件，判断逻辑为：若包含 props 定义、emits 事件定义、slots 注释/ts 类型中任意一种，返回 { "hasApiInfo": true }，否则返回 { "hasApiInfo": false }。
文件内容：
\`\`\`ts
${content} 
\`\`\`
        `,
      },
    ];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "Qwen/Qwen3-32B",
      messages: promptMessages,
      temperature: 0.2,
      max_tokens: 65536,
      signal
    });

    if (signal?.aborted) throw new Error('任务被用户取消');

    const responseText = completion.choices[0].message.content.trim();
    let hasApiInfo = false;

    try {
      const parsed = JSON.parse(responseText);
      hasApiInfo = parsed.hasApiInfo || false;
    } catch (e) {
      // 容错：如果不是 JSON，就简单做个关键词判断
      hasApiInfo = /true/i.test(responseText);
    }

    return {
      fileName: path.basename(filePath),
      filePath: relativePath, // 返回相对路径
      fileLength: content.length,
      hasApiInfo,
    };
  } catch (error) {
    if (signal?.aborted) throw new Error('任务被用户取消');

    console.error(`❌ Error analyzing ${filePath}:`, error.message);
    // 出错时也返回相对路径
    const relativePath = path.relative(baseDir, filePath);
    return {
      fileName: path.basename(filePath),
      filePath: relativePath, // 返回相对路径
      fileLength: 0,
      hasApiInfo: false,
    };
  }
}

/**
 * 分析组件目录并筛选包含API信息的文件
 * @param {string} componentDir - 组件源码目录路径（用户输入目录）
 * @param {number} [concurrency=3] - 并行分析文件的批次大小，控制同时处理的文件数量
 * @returns {Promise<{allFiles: Array, filteredFiles: Array}>} 分析结果
 */
async function analyzeComponentApiFiles(componentDir, concurrency = 3, { signal } = {}) {
  // 检查中断信号
  if (signal?.aborted) throw new Error('任务已取消');

  // 校验 concurrency 参数有效性
  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    console.warn(`⚠️  无效的并发数 ${concurrency}，自动修正为默认值 3`);
    concurrency = 3; // 强制修正为有效最小值
  }

  // 验证目录有效性
  if (!componentDir) {
    throw new Error('请提供组件源码目录路径');
  }
  if (!fs.existsSync(componentDir)) {
    throw new Error(`提供的目录不存在: ${componentDir}`);
  }

  console.log(`开始扫描目录: ${componentDir}`);
  // 获取 componentDir 根目录下的所有文件
  const allSrcFiles = getAllFiles(componentDir);
  const totalFiles = allSrcFiles.length;
  console.log(`在组件根目录中发现 ${totalFiles} 个文件，开始分析...`);

  // 并行分析 src 目录下的所有文件（传入 componentDir 作为基准目录生成相对路径）
  const results = [];
  for (let i = 0; i < totalFiles; i += concurrency) {
    if (signal?.aborted) throw new Error('任务已取消');

    const batch = allSrcFiles.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        if (signal?.aborted) throw new Error('任务已取消');
        console.log(`🔍 分析文件: ${file}`);
        return checkFileWithLLM(file, componentDir, { signal });
      })
    );
    results.push(...batchResults);

    // 调试：打印当前进度
    const processed = Math.min(i + concurrency, totalFiles);
    console.log(`📊 已分析 ${processed}/${totalFiles} 个文件`);
  }

  // 筛选包含API信息的文件
  const filteredFiles = results.filter(r => r.hasApiInfo);

  return {
    allFiles: results, // 仅包含 src 目录下的文件分析结果
    filteredFiles     // 仅包含 src 目录下筛选出的API文件
  };
}

/**
 * 处理前端上传的文件，保存到服务器临时目录并重建目录结构
 * @param {Array<{originalname: string, buffer: Buffer}>} files - 前端上传的文件列表（含相对路径）
 * @returns {string} 临时目录路径
 */
function saveUploadedFilesToTempDir(files) {
  // 创建服务器临时目录（如 /tmp/component-xxxxxx）
  const tempDir = path.join(os.tmpdir(), `code-component-${Date.now()}-${uuidv4().replace(/-/g, '')}`);
  fs.mkdirSync(tempDir, { recursive: true });

  // 遍历文件，按相对路径保存到临时目录
  files.forEach(file => {
    // file.originalname 是前端传递的相对路径（如 "src/button.vue"）
    const filePath = path.join(tempDir, file.originalname);
    // 确保父目录存在（如创建 src 目录）
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    // 写入文件内容
    fs.writeFileSync(filePath, file.buffer);
  });

  return tempDir; // 返回临时目录路径，供后续分析使用
}

/**
 * 解压zip压缩包到临时目录
 * @param {Buffer} zipBuffer - 压缩包二进制数据
 * @returns {string} 解压后的临时目录路径
 */
function extractZipToTempDir(zipBuffer) {
  try {
    // 创建临时目录（与文件上传复用同一命名规则）
    const tempDir = path.join(os.tmpdir(), `code-component-${Date.now()}-${uuidv4().replace(/-/g, '')}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // 初始化zip实例并解压（自动重建目录结构）
    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(tempDir, true); // true：覆盖已存在的文件/目录

    console.log(`📦 压缩包已解压到临时目录：${tempDir}`);
    return tempDir;
  } catch (error) {
    throw new Error(`压缩包解压失败：${error.message}`);
  }
}

/**
 * 保存单个上传文件到临时目录
 * @param {Buffer} fileBuffer - 单个文件的二进制数据
 * @param {string} fileName - 文件名（含扩展名，如 "button.vue"）
 * @returns {string} 临时目录路径（文件所在目录）
 */
function saveSingleFileToTempDir(fileBuffer, fileName) {
  // 创建临时目录
  const tempDir = path.join(os.tmpdir(), `code-component-${Date.now()}-${uuidv4().replace(/-/g, '')}`);
  fs.mkdirSync(tempDir, { recursive: true });

  // 拼接文件绝对路径（临时目录下直接存放该文件）
  const filePath = path.join(tempDir, fileName);
  // 写入文件内容
  fs.writeFileSync(filePath, fileBuffer);

  console.log(`📥 单个文件已保存到临时目录：${filePath}`);
  return tempDir; // 返回文件所在的临时目录
}

/**
 * 读取筛选出的API文件内容，拼接为总字符串（包含文件路径标识）
 * @param {Array<{filePath: string, fileName: string}>} filteredFiles - 筛选出的API文件列表
 * @param {string} componentDir - 组件根目录（用于拼接文件绝对路径）
 * @returns {string} 包含所有文件路径和内容的总字符串
 */
function readAndConcatFiles(filteredFiles, componentDir, { signal } = {}) {
  if (!Array.isArray(filteredFiles) || filteredFiles.length === 0) {
    throw new Error("没有需要分析的API文件");
  }

  if (signal?.aborted) throw new Error('任务被用户取消，停止文件内容拼接');

  let totalContent = "以下是组件的API相关文件内容，包含文件路径和源码：\n\n";

  filteredFiles.forEach((file, index) => {
    if (signal?.aborted) throw new Error('任务被用户取消，停止文件内容拼接');

    // 拼接文件绝对路径
    const absolutePath = path.isAbsolute(file.filePath)
      ? file.filePath
      : path.join(componentDir, file.filePath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️ 文件 ${absolutePath} 不存在，跳过读取`);
      return;
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(absolutePath, "utf-8");

    // 用分隔符标识不同文件，明确标注相对路径（便于大模型定位信息来源）
    totalContent += `===== 第 ${index + 1} 个文件 - 相对路径：${file.filePath} =====\n`;
    totalContent += `文件内容：\n${fileContent}\n\n`;
  });

  return totalContent;
}

/**
 * 筛选API文件并拼接内容的组合函数（本地目录版）
 * @param {string} componentDir - 组件目录（本地目录或临时目录）
 * @returns {Promise<{filteredFiles: Array, combinedContent: string, componentName: string, tempDir: string}>}
 */
async function filterAndConcatApiCodeFiles(componentDir, { signal } = {}) {
  console.log("🔍 正在筛选组件的API相关文件...");
  const { filteredFiles } = await analyzeComponentApiFiles(componentDir, 3, { signal });
  if (filteredFiles.length === 0) {
    throw new Error("未筛选出任何包含API信息的文件");
  }
  console.log(`✅ 筛选完成，共找到 ${filteredFiles.length} 个API文件：`);
  filteredFiles.forEach((file, index) => console.log(`  ${index + 1}. ${file.filePath}`));

  // 读取所有筛选文件的内容，拼接为总字符串
  console.log("\n📄 正在读取并拼接文件内容...");
  const componentName = path.basename(componentDir)
    .replace(/^(\w)/, (match) => match.toUpperCase());
  const combinedContent = readAndConcatFiles(filteredFiles, componentDir, { signal });
  console.log(`✅ 内容拼接完成（${combinedContent.length} 字符）`);

  return {
    filteredFiles,
    combinedContent,
    componentName
  };
}

/**
 * 处理前端上传的单个文件或压缩包，筛选API文件并拼接内容
 * @param {Object} uploadData - 上传数据对象
 * @param {Buffer} uploadData.data - 核心数据：单个文件或压缩包的二进制数据
 * @param {string} uploadData.type - 上传类型："single"（单个文件）、"zip"（压缩包）
 * @param {string} uploadData.fileName - 原始文件名（含扩展名，如 "button.vue"、"form.zip"）
 * @param {number} [concurrency=3] - 并行分析并发数
 * @returns {Promise<{filteredFiles: Array, combinedContent: string, componentName: string, tempDir: string}>}
 */
async function filterAndConcatUploadedApiSource(uploadData, concurrency = 3, { signal } = {}) {
  let tempDir = null; // 临时目录，用于后续清理
  try {
    // 1. 基础参数校验
    if (!uploadData || !uploadData.data || !uploadData.type || !uploadData.fileName) {
      throw new Error("上传数据不完整：需包含 data（二进制）、type（类型）、fileName（文件名）");
    }
    if (!["single", "zip"].includes(uploadData.type)) {
      throw new Error(`无效的上传类型: ${uploadData.type}，仅支持 "single"（单个文件）或 "zip"（压缩包）`);
    }

    // 2. 根据上传类型处理数据，生成临时目录
    if (uploadData.type === "single") {
      // 处理单个文件
      tempDir = saveSingleFileToTempDir(uploadData.data, uploadData.fileName);
    } else {
      // 处理压缩包
      tempDir = extractZipToTempDir(uploadData.data);
    }

    // 3. 复用本地目录的筛选逻辑（统一处理临时目录）
    console.log(`🔍 正在筛选上传${uploadData.type === 'single' ? '文件' : '压缩包'}中的API相关文件...`);
    const { filteredFiles } = await analyzeComponentApiFiles(tempDir, concurrency, { signal });
    if (filteredFiles.length === 0) {
      throw new Error(`未从上传${uploadData.type === 'single' ? '文件' : '压缩包'}中筛选出任何包含API信息的文件`);
    }
    console.log(`✅ 筛选完成，共找到 ${filteredFiles.length} 个API文件：`);
    filteredFiles.forEach((file, index) => console.log(`  ${index + 1}. ${file.filePath}`));

    // 4. 读取并拼接文件内容
    console.log("\n📄 正在读取并拼接文件内容...");
    // 生成组件名：单个文件取文件名（去扩展名），压缩包取临时目录名
    let componentName;
    if (uploadData.type === "single") {
      componentName = path.basename(uploadData.fileName, path.extname(uploadData.fileName))
        .replace(/^(\w)/, (match) => match.toUpperCase());
    } else {
      componentName = path.basename(tempDir)
        .replace(/^code-component-\d+-/, '') // 移除临时目录前缀
        .replace(/^(\w)/, (match) => match.toUpperCase()) || "ZipComponent";
    }
    const combinedContent = readAndConcatFiles(filteredFiles, tempDir, { signal });
    console.log(`✅ 内容拼接完成（${combinedContent.length} 字符）`);

    return {
      filteredFiles,
      combinedContent,
      componentName,
      tempDir // 返回临时目录供外部清理
    };
  } catch (error) {
    // 异常时清理临时目录
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`⚠️  异常后已清理临时目录: ${tempDir}`);
    }
    throw error;
  }
}

/**
 * 主流程 - 命令行执行入口
 */
async function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error("请提供组件源码文件夹路径，例如： node component-code-file-filter.js D:\\OSPP\\element-plus\\packages\\components\\form");
    process.exit(1);
  }

  try {
    const { allFiles, filteredFiles } = await analyzeComponentApiFiles(targetDir, 3);

    // 1. 全部文件结果：改为逐行输出，格式与筛选结果一致
    console.log("\n===== 分析结果（全部文件）=====");
    if (allFiles.length === 0) {
      console.log("未扫描到任何文件");
    } else {
      allFiles.forEach((file, index) => {
        console.log(`${index + 1}. 文件名：${file.fileName} | 路径：${file.filePath} | 长度：${file.fileLength} 字符 | 包含API信息：${file.hasApiInfo ? '是' : '否'}`);
      });
      console.log(`\n共扫描分析 ${allFiles.length} 个文件`);
    }

    // 2. 筛选出的API文件结果：保持原格式
    console.log("\n===== 筛选出的API文件 =====");
    if (filteredFiles.length === 0) {
      console.log("未找到包含API信息的文件");
    } else {
      filteredFiles.forEach((file, index) => {
        console.log(`${index + 1}. 文件名：${file.fileName} | 路径：${file.filePath} | 长度：${file.fileLength} 字符`);
      });
      console.log(`\n共筛选出 ${filteredFiles.length} 个包含API信息的文件`);
    }

  } catch (error) {
    console.error("分析过程出错:", error.message);
    process.exit(1);
  }
}

// 命令行直接运行时执行主函数
if (require.main === module) {
  main();
}

// 对外导出核心函数
module.exports = {
  analyzeComponentApiFiles,
  getAllFiles,
  checkFileWithLLM,
  filterAndConcatApiCodeFiles,
  filterAndConcatUploadedApiSource,
  readAndConcatFiles,
  saveUploadedFilesToTempDir
};
