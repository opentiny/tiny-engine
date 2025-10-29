const os = require('os');
const fs = require("fs");
const { execSync } = require('child_process');
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

// 匹配 "export { 组件名A, 组件名B };" / "export { 组件名A as 组件A别名 };"形式
const EXPORT_COMPONENTS_PATTERN = /export\s+{\s*([^}]+?)\s*};/;
// 匹配 "export default withInstall(组件名);" 形式
const EXPORT_DEFAULT_WITH_INSTALL_PATTERN = /export\s+default\s+with(?:Install|NoopInstall)\s*\(\s*(\w+)\s*\)/;
// 匹配 "export default 组件名;" 形式
const EXPORT_DEFAULT_DIRECT_PATTERN = /export\s+default\s+(\w+)\s*;/;
// 匹配导入/导出语句中的名称和路径
const IMPORT_DECLARATION_PATTERN = /import\s+(?:\{.*?\s+as\s+)?(\w+)\s*from\s+'([^']+)'/g;
const EXPORT_DECLARATION_PATTERN = /export\s+{\s*([^}]+?)\s*}\s+from\s+'([^']+)'/g;
// 匹配withInstall赋值语句中的原始组件名
const WITH_INSTALL_PATTERN = /const\s+\w+\s*=\s*with(?:Install|NoopInstall)\s*\(\s*(\w+)\s*,?.*?\)/g;

/**
 * 🆕 新增函数：在node_modules中查找组件的源代码目录。
 * 通过递归遍历 node_modules/<packageName> 寻找包含 index（任意后缀）的组件目录。
 * @param {string} packageName - npm包名 (如: element-plus)
 * @param {string} componentName - 组件名 (如: affix)
 * @returns {string} 找到的组件目录绝对路径
 * @throws {Error} 如果找不到对应的组件目录
 */
function findComponentDirectory(packageName, componentName, { signal } = {}) {
  console.log(`\n🔍 正在 node_modules 中查找组件目录...`);
  // 假设 node_modules 在后端根目录的父级或同级，我们从当前文件向上两级查找。
  const projectRoot = path.resolve(__dirname, '../../');
  const nodeModulesPath = path.join(projectRoot, 'node_modules');

  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error(`Node Modules目录不存在: ${nodeModulesPath}`);
  }

  const packagePath = path.join(nodeModulesPath, packageName);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Npm 包未安装或路径错误: ${packagePath}`);
  }

  // 目标组件名的通用匹配（忽略大小写，并支持 ElAffix → Affix 的匹配）
  const targetComponentLower = componentName.toLowerCase();

  let foundPath = null;
  const visited = new Set();

  // 递归查找函数
  function traverse(currentPath) {
    if (signal?.aborted) throw new Error('任务被用户取消');

    if (foundPath) return; // 找到即停止
    if (visited.has(currentPath)) return;
    visited.add(currentPath);

    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (signal?.aborted) throw new Error('任务被用户取消');
        const fullPath = path.join(currentPath, entry.name);

        // 限制搜索深度，防止无限递归
        const relativeToPackage = path.relative(packagePath, fullPath);
        if (relativeToPackage.split(path.sep).length > 6) {
          continue;
        }

        if (entry.isDirectory()) {
          // 仅在当前目录的子目录中进行递归，跳过不需要的目录（如 .git, node_modules等）
          if (['.git', 'node_modules', 'typings', 'test'].includes(entry.name.toLowerCase())) {
            continue;
          }

          // 检查当前目录是否为目标组件目录
          // 1. 检查目录名是否包含组件名 (如: 'Affix')
          const isComponentDir = entry.name.toLowerCase().includes(targetComponentLower);

          if (isComponentDir) {
            // 2. 检查目录内是否有核心入口文件（任意后缀的index文件）
            // 读取目录下所有文件，判断是否存在以index开头的文件
            const dirFiles = fs.readdirSync(fullPath, { withFileTypes: true });
            const hasIndexFile = dirFiles.some(file =>
              file.isFile() &&
              path.basename(file.name, path.extname(file.name)).toLowerCase() === 'index'
            );

            if (hasIndexFile) {
              foundPath = fullPath;
              console.log(`✅ 成功定位组件目录: ${path.relative(nodeModulesPath, fullPath)}`);
              return;
            }
          }

          // 递归遍历
          traverse(fullPath);
          if (foundPath) return;

        }
      }
    } catch (error) {
      if (signal?.aborted) throw error; 
      // 忽略读取权限或非预期文件系统错误
      console.warn(`⚠️ 无法访问目录 ${path.relative(packagePath, currentPath)}: ${error.message}`);
    }
  }

  // 从 packagePath 开始搜索 (如: node_modules/element-plus)
  traverse(packagePath);

  if (!foundPath) {
    throw new Error(`在 ${packageName} 中未找到组件 ${componentName} 的源代码目录。`);
  }

  return foundPath;
}


/**
 * 1. 递归获取组件文件夹下所有文件（按规则跳过）
 */
function getAllFilesWithSkip(dirPath) {
  const fileList = [];

  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // 跳过style文件夹
      if (entry.isDirectory()) {
        if (entry.name.toLowerCase() === "style") {
          console.log(`⚠️ 跳过style文件夹: ${fullPath}`);
          continue;
        }
        traverse(fullPath);
        continue;
      }

      // 跳过所有.map文件
      if (path.extname(entry.name) === ".map") {
        console.log(`⚠️ 跳过.map文件: ${fullPath}`);
        continue;
      }

      fileList.push(fullPath);
    }
  }

  traverse(dirPath);
  return fileList;
}

/**
 * 2. 从组件入口文件提取所有子组件名称
 */
function extractSubComponents(entryPath) {
  try {
    if (!fs.existsSync(entryPath)) {
      console.warn(`⚠️ 入口文件不存在: ${entryPath}`);
      return [];
    }

    const content = fs.readFileSync(entryPath, "utf-8");
    const componentSet = new Set();

    // 1. 处理原有命名空间导出（export { A, B };）
    const namespaceMatch = content.match(EXPORT_COMPONENTS_PATTERN);
    if (namespaceMatch && namespaceMatch[1]) {
      namespaceMatch[1].split(",").forEach((item) => {
        const [componentName] = item.trim().split("as");
        const cleanName = componentName.trim();
        if (cleanName && !cleanName.includes("default")) {
          componentSet.add(cleanName);
        }
      });
    }

    // 🔴 新增2：处理 "export default withInstall(组件名);"
    const withInstallMatch = content.match(EXPORT_DEFAULT_WITH_INSTALL_PATTERN);
    if (withInstallMatch && withInstallMatch[1]) {
      const componentName = withInstallMatch[1].trim();
      if (componentName) {
        componentSet.add(componentName);
      }
    }

    // 🔴 新增3：处理 "export default 组件名;"
    const directDefaultMatch = content.match(EXPORT_DEFAULT_DIRECT_PATTERN);
    if (directDefaultMatch && directDefaultMatch[1]) {
      const componentName = directDefaultMatch[1].trim();
      if (componentName) {
        componentSet.add(componentName);
      }
    }

    // 输出结果
    const components = Array.from(componentSet);
    if (components.length === 0) {
      console.warn("⚠️ 未找到任何子组件导出语句");
      return [];
    }
    console.log(`✅ 识别到子组件: ${components.join(", ")}`);
    return components;
  } catch (error) {
    console.error("❌ 提取子组件失败:", error.message);
    return [];
  }
}

/**
 * 3. 从入口文件提取组件关键词（用于匹配导入/导出名称）
 */
function extractComponentKeywords(entryPath) {
  try {
    if (!fs.existsSync(entryPath)) return new Set();

    const content = fs.readFileSync(entryPath, "utf-8");
    const keywords = new Set();

    // 1. 从导出的子组件名提取（如ElSelect→Select）
    const exportMatch = content.match(EXPORT_COMPONENTS_PATTERN);
    if (exportMatch && exportMatch[1]) {
      exportMatch[1].split(",").forEach(item => {
        const [rawName] = item.trim().split("as").map(p => p.trim());
        if (!rawName || rawName === "default") return;
        // 清洗前缀（如El、I、Base等常见组件前缀）
        const cleanKeyword = rawName.replace(/^(El|I|Base)/, "");
        if (cleanKeyword) keywords.add(cleanKeyword.toLowerCase());
      });
    }

    // 2. 从withInstall语句补充（如Select→Select）
    let installMatch;
    WITH_INSTALL_PATTERN.lastIndex = 0;
    while ((installMatch = WITH_INSTALL_PATTERN.exec(content)) !== null) {
      const rawKeyword = installMatch[1];
      if (rawKeyword) keywords.add(rawKeyword.toLowerCase());
    }

    // 固定添加"prop"和"emit"，匹配props/emits相关的导入/导出名称
    keywords.add("prop");
    keywords.add("emit");

    const keywordList = Array.from(keywords);
    console.log(`📌 提取组件关键词: ${keywordList.join(", ")}`);
    return keywords;
  } catch (error) {
    console.error("❌ 提取组件关键词失败:", error.message);
    return new Set();
  }
}

/**
 * 4. 生成「高优先级文件组1」：入口+含关键词的核心文件及依赖
 */
function getComponentHigh1Files(componentDir, { signal } = {}) {
  if (signal?.aborted) throw new Error('任务被用户取消，停止提取高优先级文件');
  
  const high1 = new Set();
  const indexFiles = getRootIndexFiles(componentDir);
  if (indexFiles.length === 0) {
    console.warn("⚠️ 入口文件不存在，无法提取核心文件");
    return high1;
  }
  const entryPath = indexFiles[0]; // 取第一个有效index文件（非.d.ts）

  high1.add(entryPath);
  console.log(`📌 选定入口文件：${path.relative(componentDir, entryPath)}`);

  // 2. 提取组件关键词（筛选核心文件的依据）
  const componentKeywords = extractComponentKeywords(entryPath);
  if (componentKeywords.size === 0) {
    console.warn("⚠️ 未提取到组件关键词，高1仅包含入口文件");
    return high1;
  }

  // 3. 加入含关键词的本地核心文件及依赖
  const coreFiles = getAllCoreFilesFromEntry(entryPath, componentDir, componentKeywords);
  coreFiles.forEach((file) => {
    const coreDeps = getRelevantFiles(file, new Set(), componentDir, componentKeywords, { signal });
    coreDeps.forEach((depFile) => high1.add(depFile));
  });

  console.log(`📌 高1优先级文件（入口+含关键词的核心+依赖）: ${high1.size}个`);
  return high1;
}

/**
 * 辅助函数：提取入口文件中含组件关键词的本地核心文件（核心修改）
 * 匹配逻辑：导入/导出的名称包含关键词，且路径为相对路径（./或../开头）
 */
function getAllCoreFilesFromEntry(entryPath, componentDir, keywords) {
  try {
    if (!fs.existsSync(entryPath)) return [];

    const content = fs.readFileSync(entryPath, "utf-8");
    const coreFiles = new Set();
    const entryDir = path.dirname(entryPath);

    // 1. 处理import语句（匹配导入名称）
    let importMatch;
    IMPORT_DECLARATION_PATTERN.lastIndex = 0;
    while ((importMatch = IMPORT_DECLARATION_PATTERN.exec(content)) !== null) {
      const [, importName, importPath] = importMatch;
      processImportExport(importName, importPath, entryDir, componentDir, keywords, coreFiles);
    }

    // 2. 处理export ... from语句（匹配导出名称）
    let exportMatch;
    EXPORT_DECLARATION_PATTERN.lastIndex = 0;
    while ((exportMatch = EXPORT_DECLARATION_PATTERN.exec(content)) !== null) {
      const [, exportNames, exportPath] = exportMatch;
      // 拆分多个导出名称（如"selectEmits, selectProps"）
      exportNames.split(",").forEach(name => {
        const cleanName = name.trim().split("as")[0].trim();
        processImportExport(cleanName, exportPath, entryDir, componentDir, keywords, coreFiles);
      });
    }

    const coreFilesArr = Array.from(coreFiles);
    console.log(`📌 从入口文件提取核心文件: ${coreFilesArr.length}个`);
    return coreFilesArr;
  } catch (error) {
    console.error(`❌ 提取核心文件失败:`, error.message);
    return [];
  }
}

/**
 * 辅助函数：处理单个导入/导出语句（判断是否包含关键词）
 */
function processImportExport(name, importPath, entryDir, componentDir, keywords, coreFiles) {
  // 判断1：导入/导出名称是否包含任一关键词（不区分大小写）
  const nameLower = name.toLowerCase();
  const nameHasKeyword = Array.from(keywords).some(keyword =>
    nameLower.includes(keyword)
  );
  if (!nameHasKeyword) return;

  // 判断2：是否为相对路径（./或../开头）
  if (!importPath.startsWith("./") && !importPath.startsWith("../")) return;

  // 判断3：解析后的绝对路径是否在组件目录内
  const absolutePath = path.resolve(entryDir, importPath);
  if (!absolutePath.startsWith(componentDir)) return;

  // 符合条件，加入核心文件
  coreFiles.add(absolutePath);
  console.log(`🔍 核心文件（名称含关键词）: ${name} → ${path.relative(componentDir, absolutePath)}`);
}

/**
 * 5. 获取「高优先级文件组2」：所有.vue.d.ts文件
 */
function getHighPriorityFiles2(allFiles) {
  const highPriority2 = new Set();
  allFiles.forEach((file) => {
    const fileName = path.basename(file);
    if (fileName.endsWith(".vue.d.ts")) {
      highPriority2.add(file);
    }
  });
  console.log(`📌 高2优先级文件（.vue.d.ts）: ${highPriority2.size}个`);
  return highPriority2;
}

/**
 * 6. 拆分全局文件优先级
 */
function splitFilesByPriority(componentDir) {
  const allFiles = getAllFilesWithSkip(componentDir);
  console.log(`\n📊 组件文件夹下共找到 ${allFiles.length} 个符合条件的文件`);

  const high2 = getHighPriorityFiles2(allFiles);
  const lowPriority = allFiles.filter((file) => !high2.has(file));

  console.log(`📌 低优先级文件: ${lowPriority.length}个`);
  return {
    high2: Array.from(high2),
    lowPriority,
    allFiles,
  };
}

/**
 * 辅助函数：递归获取含关键词的核心文件依赖（核心修改）
 */
function getRelevantFiles(filePath, visited, baseDir, keywords, { signal } = {}) {
  try {
    if (signal?.aborted) throw new Error('任务被用户取消');
    // 边界控制：文件不存在/已访问/超出组件目录 → 直接返回
    if (!fs.existsSync(filePath) || visited.has(filePath) || !filePath.startsWith(baseDir)) {
      return [];
    }

    visited.add(filePath);
    const deps = [filePath];
    const content = fs.readFileSync(filePath, "utf-8");
    const fileDir = path.dirname(filePath);

    // 1. 处理import语句（匹配导入名称）
    const importPaths = new Set();
    let importMatch;
    IMPORT_DECLARATION_PATTERN.lastIndex = 0;
    while ((importMatch = IMPORT_DECLARATION_PATTERN.exec(content)) !== null) {
      if (signal?.aborted) throw new Error('任务被用户取消');
      const [, importName, importPath] = importMatch;
      if (isNameMatchKeyword(importName, keywords) && isRelativePath(importPath)) {
        const absPath = path.resolve(fileDir, importPath);
        if (absPath.startsWith(baseDir)) {
          importPaths.add(absPath);
        }
      }
    }

    // 2. 处理export ... from语句（匹配导出名称）
    let exportMatch;
    EXPORT_DECLARATION_PATTERN.lastIndex = 0;
    while ((exportMatch = EXPORT_DECLARATION_PATTERN.exec(content)) !== null) {
      if (signal?.aborted) throw new Error('任务被用户取消');
      const [, exportNames, exportPath] = exportMatch;
      exportNames.split(",").forEach(name => {
        const cleanName = name.trim().split("as")[0].trim();
        if (isNameMatchKeyword(cleanName, keywords) && isRelativePath(exportPath)) {
          const absPath = path.resolve(fileDir, exportPath);
          if (absPath.startsWith(baseDir)) {
            importPaths.add(absPath);
          }
        }
      });
    }

    // 递归获取依赖
    for (const absPath of importPaths) {
      if (!visited.has(absPath)) {
        const subDeps = getRelevantFiles(absPath, visited, baseDir, keywords, { signal });
        subDeps.forEach((f) => deps.push(f));
      }
    }

    return deps;
  } catch (error) {
    return [];
  }
}

/**
 * 辅助函数：判断名称是否包含关键词
 */
function isNameMatchKeyword(name, keywords) {
  const nameLower = name.toLowerCase();
  return Array.from(keywords).some(keyword => nameLower.includes(keyword));
}

/**
 * 辅助函数：判断是否为相对路径（./或../开头）
 */
function isRelativePath(path) {
  return path.startsWith("./") || path.startsWith("../");
}

/**
 * 7. 用大模型分析单个文件
 */
async function analyzeFileForComponentApi(filePath, componentName, baseDir, { signal } = {}) {
  try {
    if (signal?.aborted) throw new Error('任务已取消');

    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(baseDir, filePath);
    const isVueDts = filePath.includes(".vue.d.ts");

    const promptMessages = [
      {
        role: "system",
        content: `你是Vue组件源码分析专家，精通Vue组件库结构。
任务：分析文件是否包含【${componentName}】组件的API具体定义，重点关注：
1. props：buildProps调用、defineProps、Props类型接口；
2. emits：defineEmits、emits对象、Emits类型接口；
3. slots：.vue.d.ts中的__VLS_template函数、renderSlot调用、$slots使用。
⚠️ 关键规则：若文件属于其他子组件，即使有API定义，也返回null。
输出格式：严格JSON，键为propsFile/emitsFile/slotsFile，值为文件相对路径或null。`,
      },
      {
        role: "user",
        content: `文件类型：${isVueDts ? "【.vue.d.ts文件，重点查slot】" : "普通代码文件"}
文件路径（相对）：${relativePath}
文件内容：
\`\`\`
${content}
\`\`\`
`,
      },
    ];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "Qwen/Qwen3-32B",
      messages: promptMessages,
      temperature: 0.1,
      response_format: { type: "json_object" },
      signal
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      propsFile: result.propsFile ? path.resolve(baseDir, result.propsFile) : null,
      emitsFile: result.emitsFile ? path.resolve(baseDir, result.emitsFile) : null,
      slotsFile: result.slotsFile ? path.resolve(baseDir, result.slotsFile) : null,
    };
  } catch (error) {
    return { propsFile: null, emitsFile: null, slotsFile: null };
  }
}

/**
 * 8. 按优先级分析文件，聚合API定义
 */
async function aggregateComponentApiByPriority(componentName, highPriorityFiles, lowPriorityFiles, baseDir, { signal } = {}) {
  const apiMap = { props: new Set(), emits: new Set(), slots: new Set() };
  const foundFlags = { props: false, emits: false, slots: false };

  console.log(`\n🔍 开始分析【${componentName}】`);

  if (signal?.aborted) throw new Error('任务已取消');

  // 分析高优先级文件
  console.log(`👉 正在分析高优先级文件（${highPriorityFiles.length}个）`);
  for (const file of highPriorityFiles) {
    if (signal?.aborted) throw new Error('任务已取消'); 
    const result = await analyzeFileForComponentApi(file, componentName, baseDir, { signal });

    // 收集结果（去重）
    if (result.propsFile) apiMap.props.add(result.propsFile);
    if (result.emitsFile) apiMap.emits.add(result.emitsFile);
    if (result.slotsFile) apiMap.slots.add(result.slotsFile);

    // 更新找到标记
    foundFlags.props = apiMap.props.size > 0;
    foundFlags.emits = apiMap.emits.size > 0;
    foundFlags.slots = apiMap.slots.size > 0;

    // 所有API找到则停止
    if (foundFlags.props && foundFlags.emits && foundFlags.slots) {
      console.log(`✅ 高优先级文件已找到所有API，跳过剩余`);
      break;
    }
  }

  // 分析低优先级文件（仅分析未找到的API）
  const needLowPriority = !foundFlags.props || !foundFlags.emits || !foundFlags.slots;
  if (needLowPriority) {
    console.log(`👉 正在分析低优先级文件（${lowPriorityFiles.length}个）`);
    for (const file of lowPriorityFiles) {
      if (signal?.aborted) throw new Error('任务已取消');
      const result = await analyzeFileForComponentApi(file, componentName, baseDir, { signal });

      if (!foundFlags.props && result.propsFile) apiMap.props.add(result.propsFile);
      if (!foundFlags.emits && result.emitsFile) apiMap.emits.add(result.emitsFile);
      if (!foundFlags.slots && result.slotsFile) apiMap.slots.add(result.slotsFile);

      // 更新标记并检查是否完成
      foundFlags.props = apiMap.props.size > 0;
      foundFlags.emits = apiMap.emits.size > 0;
      foundFlags.slots = apiMap.slots.size > 0;

      if (foundFlags.props && foundFlags.emits && foundFlags.slots) {
        console.log(`✅ 低优先级文件已找到所有API，跳过剩余`);
        break;
      }
    }
  } else {
    console.log(`✅ 高优先级文件已找到所有API，跳过低优先级`);
  }

  // 移除优先级标识，仅返回纯相对路径
  const formatWithPriority = (filePath) => {
    // 直接返回文件相对于基准目录的路径，不添加任何优先级标签
    return path.relative(baseDir, filePath);
  };

  return {
    component: componentName,
    props: Array.from(apiMap.props).map(formatWithPriority),
    emits: Array.from(apiMap.emits).map(formatWithPriority),
    slots: Array.from(apiMap.slots).map(formatWithPriority),
  };
}

/**
 * 9. 主分析函数
 */
async function analyzeComponentApiMap(componentDir, { signal } = {}) {
  if (!fs.existsSync(componentDir)) throw new Error(`目录不存在: ${componentDir}`);
  if (signal?.aborted) throw new Error('任务已取消');

  const indexFiles = getRootIndexFiles(componentDir);
  if (indexFiles.length === 0) throw new Error("未找到入口文件（index.*，已排除.d.ts），无法提取子组件");

  const entryPath = indexFiles[0]; // 取第一个有效index文件
  const subComponents = extractSubComponents(entryPath);

  // 拆分优先级后二次过滤低优先级（排除高1）
  const { high2, lowPriority: tempLow } = splitFilesByPriority(componentDir);
  const globalHigh1 = getComponentHigh1Files(componentDir, { signal });
  const realLowPriority = tempLow.filter(file => !globalHigh1.has(file));

  const apiResults = [];
  for (const component of subComponents) {
    if (signal?.aborted) throw new Error('任务已取消');
    const componentHighPriority = Array.from(new Set([...globalHigh1, ...high2]));
    const apiResult = await aggregateComponentApiByPriority(
      component, componentHighPriority, realLowPriority, componentDir, { signal }
    );
    apiResults.push(apiResult);
  }

  return apiResults;
}

/**
 * 辅助函数：获取组件根目录下的所有index文件（排除.map后缀）
 * @param {string} componentDir - 组件根目录
 * @returns {string[]} index文件绝对路径列表
 */
function getRootIndexFiles(componentDir) {
  try {
    if (!fs.existsSync(componentDir)) return [];

    // 仅读取组件根目录下的文件（不递归）
    const rootFiles = fs.readdirSync(componentDir, { withFileTypes: true })
      .filter(entry => entry.isFile()) // 只保留文件
      .map(entry => path.join(componentDir, entry.name))
      .filter(filePath => {
        const fileName = path.basename(filePath);
        const fileBaseName = path.basename(fileName, path.extname(fileName)).toLowerCase();
        // 1. 基础名是index 2. 排除.map和.d.ts后缀
        return fileBaseName === 'index' &&
          !fileName.endsWith(".map") &&
          !fileName.endsWith(".d.ts");
      });

    if (rootFiles.length > 0) {
      console.log(`📌 组件根目录下找到 ${rootFiles.length} 个有效index文件：`);
      rootFiles.forEach(file => console.log(`  - ${path.relative(componentDir, file)}`));
    } else {
      console.warn(`⚠️ 组件根目录下未找到有效index文件（排除了.d.ts和.map后缀）`);
    }

    return rootFiles;
  } catch (error) {
    console.error("❌ 获取index文件失败:", error.message);
    return [];
  }
}

/**
 * 辅助函数：读取文件内容（带容错处理）
 * @param {string} filePath - 纯文件路径（无优先级标注）
 * @param {string} baseDir - 组件根目录（用于校验路径合法性）
 * @returns {string} 文件内容（读取失败返回空字符串）
 */
function readFileWithFallback(filePath, baseDir, { signal } = {}) {
  if (signal?.aborted) throw new Error('任务被用户取消，停止文件读取');

  try {
    // 无需再提取纯路径，直接使用传入的路径
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(baseDir, filePath);

    if (!absolutePath.startsWith(baseDir) || !fs.existsSync(absolutePath)) {
      console.warn(`⚠️ 文件不存在或超出目录范围：${absolutePath}`);
      return "";
    }

    // 读取文件内容
    return fs.readFileSync(absolutePath, "utf-8");
  } catch (error) {
    console.error(`❌ 读取文件失败 ${filePath}：`, error.message);
    return "";
  }
}

/**
 * 筛选组件API文件并拼接内容（按组件聚合非空API信息及文件源码）
 * @param {string} componentDir - 组件根目录
 * @returns {Promise<{combinedContent: string, componentNames: string[], savedPath: string}>}
 *  - combinedContent: 拼接后的总内容
 *  - componentNames: 识别到的组件名称列表
 */
async function filterAndConcatApiNpmFiles(componentDir, { signal } = {}) {
  // 1. 前置校验：目录有效性
  if (!componentDir) {
    throw new Error("请提供组件npm目录路径");
  }
  if (!fs.existsSync(componentDir)) {
    throw new Error(`组件目录不存在：${componentDir}`);
  }
  console.log(`\n📌 开始执行组件API文件筛选与内容拼接：${componentDir}`);

  // 2. 调用主分析函数获取API结果
  console.log("1/3 🔍 正在分析组件API定义文件...");
  const apiResults = await analyzeComponentApiMap(componentDir, { signal });
  if (!apiResults || apiResults.length === 0) {
    throw new Error("未获取到组件API分析结果");
  }
  const componentNames = apiResults.map(result => result.component);
  console.log(`✅ 分析完成，共识别到 ${componentNames.length} 个组件：${componentNames.join(", ")}`);

  // 获取组件根目录的index文件
  const rootIndexFiles = getRootIndexFiles(componentDir);

  // 3. 遍历结果拼接内容（仅保留非空的Props/Emits/Slots）
  console.log("\n2/3 📄 正在拼接API文件内容...");
  let combinedContent = `# Vue组件库API文件内容聚合（组件目录：${path.basename(componentDir)}）\n\n`;

  // 拼接index文件内容（放在最前面，便于大模型优先识别入口信息）
  if (rootIndexFiles.length > 0) {
    combinedContent += `## 组件入口文件（index系列文件）\n`;
    rootIndexFiles.forEach((indexFile, idx) => {
      const relativePath = path.relative(componentDir, indexFile);
      const fileContent = readFileWithFallback(indexFile, componentDir, { signal });
      combinedContent += `\n--- 入口文件 ${idx + 1}：${relativePath} ---\n`;
      combinedContent += fileContent ? fileContent : "⚠️  未读取到文件内容\n";
    });
    combinedContent += `\n========================================\n\n`;
  }

  // 拼接各组件的Props/Emits/Slots文件
  apiResults.forEach((result, index) => {
    const { component, props, emits, slots } = result;

    // 组件分隔符
    combinedContent += `===== ${index + 1}. 组件：${component} =====\n`;

    // 处理Props（非空则拼接）
    if (props.length > 0) {
      combinedContent += `\n【Props定义文件】（共 ${props.length} 个）\n`;
      props.forEach((propFile, idx) => {
        const fileContent = readFileWithFallback(propFile, componentDir, { signal });
        combinedContent += `\n--- 第 ${idx + 1} 个：${propFile} ---\n`;
        combinedContent += fileContent ? fileContent : "⚠️  未读取到文件内容\n";
      });
    }

    // 处理Emits（非空则拼接）
    if (emits.length > 0) {
      combinedContent += `\n【Emits定义文件】（共 ${emits.length} 个）\n`;
      emits.forEach((emitFile, idx) => {
        const fileContent = readFileWithFallback(emitFile, componentDir, { signal });
        combinedContent += `\n--- 第 ${idx + 1} 个：${emitFile} ---\n`;
        combinedContent += fileContent ? fileContent : "⚠️  未读取到文件内容\n";
      });
    }

    // 处理Slots（非空则拼接）
    if (slots.length > 0) {
      combinedContent += `\n【Slots定义文件】（共 ${slots.length} 个）\n`;
      slots.forEach((slotFile, idx) => {
        const fileContent = readFileWithFallback(slotFile, componentDir, { signal });
        combinedContent += `\n--- 第 ${idx + 1} 个：${slotFile} ---\n`;
        combinedContent += fileContent ? fileContent : "⚠️  未读取到文件内容\n";
      });
    }

    // 组件结束分隔符
    combinedContent += `\n========================================\n\n`;
  });

  console.log(`✅ 内容拼接完成（总长度：${combinedContent.length} 字符）`);

  // 4. 返回结果
  return {
    combinedContent,    // 拼接后的总内容（供大模型使用）
    componentNames     // 识别到的组件名称列表
  };
}

/**
 * 根据npm包名和组件名，查找本地node_modules目录并执行筛选和拼接。
 * @param {string} packageName - npm包名 (如: element-plus)
 * @param {string} componentName - 组件名 (如: affix)
 * @returns {Promise<{combinedContent: string, componentNames: string[], componentDir: string}>}
 */
async function filterAndConcatNpmApiByPackage(packageName, componentName, { signal } = {}) {
  if (!packageName || !componentName) {
    throw new Error("请输入npm包名和组件名");
  }

  // 1. 查找组件的本地目录（不存在则自动安装）
  let componentDir;
  const projectRoot = path.resolve(__dirname, '../../'); // backend根目录（node_modules所在位置）
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  const packagePath = path.join(nodeModulesPath, packageName);

  // 🔴 新增：检查包是否存在，不存在则自动安装
  if (!fs.existsSync(packagePath)) {
    console.log(`⚠️ 未在 ${nodeModulesPath} 中找到包 ${packageName}，开始自动安装...`);
    try {
      // 执行npm install命令（在backend根目录下安装，--save-dev可根据需求改为--save）
      execSync(`npm install ${packageName} --save-dev`, {
        cwd: projectRoot, // 执行目录：backend根目录（确保node_modules在此目录下）
        stdio: 'inherit'  // 输出安装日志到控制台，便于用户查看进度
      });
      console.log(`✅ 包 ${packageName} 安装成功！`);
    } catch (installError) {
      throw new Error(`❌ 包 ${packageName} 安装失败：${installError.message}\n请检查网络连接或npm权限后重试`);
    }
  }

  // 2. 安装完成后（或已存在），查找组件目录
  try {
    componentDir = findComponentDirectory(packageName, componentName, { signal });
  } catch (findError) {
    throw new Error(`查找组件目录失败：${findError.message}`);
  }

  // 3. 复用原有npm包筛选拼接逻辑
  console.log("🔍 正在筛选和拼接API相关文件...");
  const result = await filterAndConcatApiNpmFiles(componentDir, { signal });

  // 4. 返回结果（包含组件目录路径）
  return {
    ...result, // 继承原有结果（combinedContent, componentNames）
    componentDir // 新增：组件目录路径
  };
}

/**
 * 命令行入口
 */
async function main() {
  // 命令行参数现在支持两种模式：
  // 1. 旧模式（直接指定目录）：node component-npm-file-filter.js <组件目录路径> [concat]
  // 2. 新模式（指定包名和组件名）：node component-npm-file-filter.js --npm <包名> <组件名>

  if (process.argv.length < 3) {
    console.error("用法1（调试）：node component-npm-file-filter.js <组件目录路径> [concat]");
    console.error("用法2（生产）：node component-npm-file-filter.js --npm <包名> <组件名>");
    console.error("示例：node component-npm-file-filter.js --npm element-plus affix");
    process.exit(1);
  }

  let componentDir = process.argv[2];

  try {
    if (componentDir === "--npm") {
      const packageName = process.argv[3];
      const componentName = process.argv[4];

      if (!packageName || !componentName) {
        console.error("❌ 缺少npm包名或组件名。");
        process.exit(1);
      }

      const result = await filterAndConcatNpmApiByPackage(packageName, componentName);

      // 调试：保存到文件
      const outputFileName = `${packageName}-${componentName}-api-result.txt`;
      const currentDir = process.cwd();
      const outputPath = path.join(currentDir, outputFileName);

      // 写入文件
      fs.writeFileSync(outputPath, result.combinedContent, 'utf-8');

      console.log(`\n🎉 拼接任务完成！`);
      console.log(`- 组件目录：${result.componentDir}`);
      console.log(`- 涉及组件：${result.componentNames.join(", ")}`);
      console.log(`- 内容长度：${result.combinedContent.length} 字符`);
      console.log(`- 结果已保存至：${outputPath}`);

    } else {
      // 旧模式：直接传入目录
      const isConcatMode = process.argv[3] === "concat";

      if (isConcatMode) {
        const { combinedContent, componentNames } = await filterAndConcatApiNpmFiles(componentDir);
        console.log(`\n🎉 拼接任务完成！`);
        console.log(`- 涉及组件：${componentNames.join(", ")}`);
        console.log(`- 内容长度：${combinedContent.length} 字符`);
      } else {
        // 模式2：无"concat"参数 - 分析API文件分布（供调试/查看）
        const apiResults = await analyzeComponentApiMap(componentDir);

        // 输出最终结果 (保持不变)
        console.log("\n" + "=".repeat(100));
        console.log(`📊 组件API定义文件分析结果（优先级：高1 > 高2 > 低）`);
        console.log(`   高1：入口+导入/导出名称含组件关键词的核心文件及依赖`);
        console.log(`   高2：.vue.d.ts文件（slot优先）`);
        console.log(`   低：其他符合条件的文件`);
        console.log("=".repeat(100));

        apiResults.forEach((result, index) => {
          console.log(`\n${index + 1}. 组件：${result.component}`);
          console.log(`   📋 Props定义文件（${result.props.length}个）：`);
          result.props.length > 0
            ? result.props.forEach(p => console.log(`     - ${p}`))
            : console.log("     - 未找到");

          console.log(`   📢 Emits定义文件（${result.emits.length}个）：`);
          result.emits.length > 0
            ? result.emits.forEach(e => console.log(`     - ${e}`))
            : console.log("     - 未找到");

          console.log(`   🧩 Slots定义文件（${result.slots.length}个）：`);
          result.slots.length > 0
            ? result.slots.forEach(s => console.log(`     - ${s}`))
            : console.log("     - 未找到");
        });
      }
    }
  } catch (error) {
    console.error("\n❌ 分析失败:", error.message);
    process.exit(1);
  }
}


if (require.main === module) {
  main();
}

module.exports = {
  analyzeComponentApiMap,
  splitFilesByPriority,
  aggregateComponentApiByPriority,
  filterAndConcatApiNpmFiles,
  filterAndConcatNpmApiByPackage // 主流程函数
};
