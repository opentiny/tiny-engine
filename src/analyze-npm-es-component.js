const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建命令行交互接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 正则表达式模式
const exportComponentsPattern = /export\s+{\s*([^}]+?)\s*};/; // 匹配组件导出
const namedImportExportPattern = /(import|export)\s+{\s*([^}]+?)\s*}\s+from\s+'([^']+)'/g; // 命名导入/导出
const defaultImportPattern = /import\s+(\w+)\s+from\s+'([^']+)'/g; // 默认导入
const componentAssignPattern = /const\s+(\w+)\s*=\s*with(Install|NoopInstall)\s*\((\w+)\)/g; // 匹配组件赋值（如ElButtonGroup = withNoopInstall(ButtonGroup)）

/**
 * 从入口文件提取导出的组件列表（去重）
 */
function extractComponents(entryFilePath) {
  try {
    const content = fs.readFileSync(entryFilePath, 'utf8');
    const match = content.match(exportComponentsPattern);
    if (!match || !match[1]) {
      console.log('❌ 未找到组件导出信息');
      return [];
    }

    const componentsSet = new Set();
    match[1].split(',').forEach(item => {
      const parts = item.trim().split('as');
      const componentName = parts[0].trim();
      if (componentName && !componentName.includes('default')) {
        componentsSet.add(componentName);
      }
    });
    return Array.from(componentsSet);
  } catch (error) {
    console.error(`❌ 提取组件出错: ${error.message}`);
    return [];
  }
}

/**
 * 建立“组件名 → 核心文件路径”的映射（关键修复：优先关联组件对应的文件）
 * 例如：ElButtonGroup → ./src/button-group2.mjs
 */
function getComponentToFilePathMap(entryFilePath) {
  try {
    const content = fs.readFileSync(entryFilePath, 'utf8');
    const map = {};

    // 1. 先收集所有默认导入（如：import ButtonGroup from './src/button-group2.mjs'）
    const importMap = {};
    let importMatch;
    defaultImportPattern.lastIndex = 0;
    while ((importMatch = defaultImportPattern.exec(content)) !== null) {
      const [, importName, importPath] = importMatch;
      importMap[importName] = path.resolve(path.dirname(entryFilePath), importPath);
    }

    // 2. 匹配组件赋值语句（如：const ElButtonGroup = withNoopInstall(ButtonGroup)）
    let assignMatch;
    componentAssignPattern.lastIndex = 0;
    while ((assignMatch = componentAssignPattern.exec(content)) !== null) {
      const [, componentName, , importName] = assignMatch;
      if (importMap[importName]) {
        map[componentName] = importMap[importName]; // 关联组件名与文件路径
      }
    }

    return map;
  } catch (error) {
    console.error(`❌ 建立组件路径映射出错: ${error.message}`);
    return {};
  }
}

/**
 * 在文件中查找特定名称的定义路径（支持import/export/直接定义）
 */
function findDefinitionInFile(filePath, targetName) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 文件不存在: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let match;

    // 检查import/export语句
    namedImportExportPattern.lastIndex = 0;
    while ((match = namedImportExportPattern.exec(content)) !== null) {
      const [, , names, sourcePath] = match;
      const nameList = names.split(',').map(name => name.trim());
      if (nameList.includes(targetName)) {
        const absPath = path.resolve(path.dirname(filePath), sourcePath);
        console.log(`✅ 在 ${path.basename(filePath)} 中找到 ${targetName}，来源: ${path.basename(absPath)}`);
        return absPath;
      }
    }

    // 检查直接定义（如：const buttonGroupProps = ...）
    const directDefinePattern = new RegExp(`const\\s+${targetName}\\s*=`, 'g');
    if (directDefinePattern.test(content)) {
      console.log(`✅ 在 ${path.basename(filePath)} 中直接定义了 ${targetName}`);
      return filePath;
    }

    console.log(`⚠️ 在 ${path.basename(filePath)} 中未找到 ${targetName}`);
    return null;
  } catch (error) {
    console.error(`❌ 查找定义出错: ${error.message}`);
    return null;
  }
}

/**
 * 获取文件中的所有导入路径
 */
function getImportPaths(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const importPaths = new Set();
    let match;

    // 收集命名导入/导出路径
    namedImportExportPattern.lastIndex = 0;
    while ((match = namedImportExportPattern.exec(content)) !== null) {
      const [, , , sourcePath] = match;
      importPaths.add(path.resolve(path.dirname(filePath), sourcePath));
    }

    // 收集默认导入路径
    defaultImportPattern.lastIndex = 0;
    while ((match = defaultImportPattern.exec(content)) !== null) {
      const [, , sourcePath] = match;
      importPaths.add(path.resolve(path.dirname(filePath), sourcePath));
    }

    const paths = Array.from(importPaths);
    console.log(`📂 ${path.basename(filePath)} 的导入路径: ${paths.map(p => path.basename(p)).join(', ')}`);
    return paths;
  } catch (error) {
    console.error(`❌ 获取导入路径出错: ${error.message}`);
    return [];
  }
}

/**
 * 递归查找定义（优先分析组件核心文件，再遍历其他依赖）
 */
function recursiveFindDefinitions(targetName, currentFilePath, visited = new Set()) {
  // 防止循环引用
  if (visited.has(currentFilePath)) {
    console.log(`🔄 已访问过 ${path.basename(currentFilePath)}，跳过`);
    return null;
  }
  visited.add(currentFilePath);

  // 1. 先检查当前文件是否有目标定义
  const directPath = findDefinitionInFile(currentFilePath, targetName);
  if (directPath) {
    return directPath;
  }

  // 2. 递归分析所有导入的文件
  const importPaths = getImportPaths(currentFilePath);
  for (const importPath of importPaths) {
    const result = recursiveFindDefinitions(targetName, importPath, visited);
    if (result) {
      return result; // 找到后立即返回
    }
  }

  return null;
}

/**
 * 分析单个组件（核心逻辑：先找组件对应的核心文件，再递归查找Props/Emits）
 */
function analyzeSingleComponent(componentName, entryFilePath, componentToFileMap) {
  console.log(`\n----- 开始分析组件: ${componentName} -----`);

  // 1. 生成目标Props/Emits名称（ElButtonGroup → buttonGroupProps）
  const baseName = componentName.replace(/^El/, ''); // 直接去掉El前缀，无需加连字符
  const propsTarget = `${baseName[0].toLowerCase() + baseName.slice(1)}Props`; // 首字母小写
  const emitsTarget = `${baseName[0].toLowerCase() + baseName.slice(1)}Emits`;
  console.log(`🎯 查找目标: Props=${propsTarget}, Emits=${emitsTarget}`);

  // 2. 找到组件对应的核心文件（如ElButtonGroup → button-group2.mjs）
  const coreFilePath = componentToFileMap[componentName];
  if (!coreFilePath) {
    console.log(`⚠️ 未找到 ${componentName} 对应的核心文件，从入口文件开始查找`);
    return {
      propsPath: recursiveFindDefinitions(propsTarget, entryFilePath),
      emitsPath: recursiveFindDefinitions(emitsTarget, entryFilePath)
    };
  }
  console.log(`🎯 组件核心文件: ${path.basename(coreFilePath)}`);

  // 3. 递归查找Props/Emits（优先从核心文件开始）
  const propsPath = recursiveFindDefinitions(propsTarget, coreFilePath);
  const emitsPath = recursiveFindDefinitions(emitsTarget, coreFilePath);

  return { propsPath, emitsPath };
}

/**
 * 分析组件目录
 */
function analyzeComponentDirectory(componentDir) {
  console.log(`开始分析组件目录: ${componentDir}\n`);

  // 验证目录和入口文件
  if (!fs.existsSync(componentDir)) {
    console.error('❌ 错误: 目录不存在');
    return;
  }
  const entryFilePath = path.join(componentDir, 'index.mjs');
  if (!fs.existsSync(entryFilePath)) {
    console.error('❌ 错误: 未找到index.mjs入口文件');
    return;
  }

  // 1. 提取组件列表
  const components = extractComponents(entryFilePath);
  console.log(`📊 识别到 ${components.length} 个组件: ${components.join(', ')}\n`);

  // 2. 建立“组件名 → 核心文件路径”的映射（关键修复）
  const componentToFileMap = getComponentToFilePathMap(entryFilePath);
  console.log(`🗺️  组件路径映射: ${JSON.stringify(Object.fromEntries(
    Object.entries(componentToFileMap).map(([k, v]) => [k, path.basename(v)])
  ), null, 2)}`);

  // 3. 分析每个组件
  components.forEach(componentName => {
    const { propsPath, emitsPath } = analyzeSingleComponent(
      componentName,
      entryFilePath,
      componentToFileMap
    );

    // 输出结果（相对路径）
    console.log(`\n📋 组件 ${componentName} 结果:`);
    console.log(`  组件入口: ${path.relative(componentDir, entryFilePath)}`);
    console.log(`  Props 定义: ${propsPath ? path.relative(componentDir, propsPath) : '未找到'}`);
    console.log(`  Emits 定义: ${emitsPath ? path.relative(componentDir, emitsPath) : '未找到'}`);
    console.log('----------------------------------------');
  });
}

// 启动程序
console.log('🔍 Element Plus组件分析工具（带调试日志）');
console.log('请输入组件文件夹路径（例如：C:\\Users\\zyun\\Desktop\\...\\button）');

rl.question('组件文件夹路径: ', (componentDir) => {
  rl.close();
  analyzeComponentDirectory(componentDir.trim());
});