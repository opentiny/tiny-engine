/**
 * 遍历组件源码目录，找出包含组件 API 信息的文件
 * 支持递归遍历，调用大模型筛选 props/events/slots 相关文件
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "../.env" });
const { OpenAI } = require("openai");

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  timeout: 600000, // 10分钟超时
});

/**
 * 递归获取指定目录下的所有文件路径
 * @param {string} dirPath - 目录路径
 * @returns {string[]} 文件路径数组
 */
function getAllFiles(dirPath) {
  const fileList = [];

  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else {
        fileList.push(fullPath);
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
async function checkFileWithLLM(filePath, baseDir) {
  try {
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
    });

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
 * @returns {Promise<{allFiles: Array, filteredFiles: Array}>} 分析结果
 */
async function analyzeComponentApiFiles(componentDir) {
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
  console.log(`在组件根目录中发现 ${allSrcFiles.length} 个文件，开始分析...`);

  // 分析 src 目录下的所有文件（传入 componentDir 作为基准目录生成相对路径）
  const results = [];
  for (const file of allSrcFiles) {
    console.log(`🔍 分析文件: ${file}`);
    const result = await checkFileWithLLM(file, componentDir);
    results.push(result);
  }

  // 筛选包含API信息的文件
  const filteredFiles = results.filter(r => r.hasApiInfo);

  return {
    allFiles: results, // 仅包含 src 目录下的文件分析结果
    filteredFiles     // 仅包含 src 目录下筛选出的API文件
  };
}

/**
 * 主流程 - 命令行执行入口
 */
async function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error("请提供组件源码文件夹路径，例如： node component-api-analyzer.js D:\\OSPP\\element-plus\\packages\\components\\form");
    process.exit(1);
  }

  try {
    const { allFiles, filteredFiles } = await analyzeComponentApiFiles(targetDir, false);

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
  checkFileWithLLM
};