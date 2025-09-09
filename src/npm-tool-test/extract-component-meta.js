// npm install --save-dev fast-glob@3.3.3 vue-component-meta@3.0.6
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const fg = require('fast-glob');
const { createChecker } = require('vue-component-meta');

/**
 * 校验目录路径是否存在且为目录
 * @param {string} dirPath - 待校验的目录路径
 * @returns {boolean} 路径是否有效
 */
function validateDirPath(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ 错误：目录路径不存在 -> ${dirPath}`);
    return false;
  }
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    console.error(`❌ 错误：路径不是目录 -> ${dirPath}`);
    return false;
  }
  return true;
}

/**
 * 过滤并格式化原始元数据（保留纯文字描述）
 * @param {Object} rawMeta - vue-component-meta 提取的原始元数据
 * @returns {Object} 格式化后的元数据
 */
function filterAndFormatMeta(rawMeta) {
  const formattedProps = [];
  rawMeta.props.forEach((prop) => {
    if (prop.global) return;
    formattedProps.push({
      name: `${prop.name}${prop.required ? '' : '?'}`,
      description: prop.description || '无描述',
      type: prop.type || 'unknown',
      default: prop.default ?? 'unknown',
    });
  });

  const formattedSlots = rawMeta.slots.map((slot) => ({
    ...slot,
    description: slot.description || '无描述',
  }));

  return {
    props: formattedProps,
    events: rawMeta.events || [],
    slots: formattedSlots,
  };
}

/**
 * 保存元数据到 JSON 文件
 * @param {string} outputDir - 输出目录路径
 * @param {string} componentName - 组件名称（作为文件名）
 * @param {Object} meta - 格式化后的元数据
 */
function saveMetaToJson(outputDir, componentName, meta) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📂 已创建输出目录 -> ${outputDir}`);
  }

  const jsonPath = path.join(outputDir, `${componentName}.json`);
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4), 'utf8');
    console.log(`✅ 元数据已保存至 -> ${jsonPath}`);
  } catch (err) {
    console.error(`❌ 保存失败：`, err.message);
  }
}

/**
 * 初始化 vue-component-meta 检查器（支持子 tsconfig 文件）
 * @param {string} tsconfigPath - 具体的 tsconfig 文件路径（如 tsconfig.web.json）
 * @returns {Object|null} 检查器实例
 */
function initMetaChecker(tsconfigPath) {
  if (!fs.existsSync(tsconfigPath)) {
    console.error(`❌ 错误：tsconfig 文件不存在 -> ${tsconfigPath}`);
    return null;
  }

  try {
    const checkerOptions = {
      forceUseTs: true,
      schema: { ignore: ['MyIgnoredNestedProps'] },
      printer: { newLine: 1 },
    };
    const checker = createChecker(tsconfigPath, checkerOptions);
    console.log(`✅ 元数据检查器初始化成功（基于 ${path.basename(tsconfigPath)}）`);
    return checker;
  } catch (err) {
    console.error('❌ 初始化检查器失败：', err.message);
    return null;
  }
}

/**
 * 获取 tsconfig.json 所在目录下的所有 tsconfig 相关文件
 * @param {string} rootTsconfigPath - 根 tsconfig.json 路径
 * @returns {string[]} tsconfig 相关文件路径列表
 */
function getSubTsconfigPaths(rootTsconfigPath) {
  try {
    const rootDir = path.dirname(rootTsconfigPath);
    // 查找根目录下所有以 tsconfig 开头，以 .json 结尾的文件
    const tsconfigFiles = fg.sync(['tsconfig*.json'], {
      cwd: rootDir,
      absolute: true,
    });
    // 过滤掉根 tsconfig.json 自身（如果需要的话，可根据实际情况调整）
    return tsconfigFiles.filter(filePath => filePath !== rootTsconfigPath);
  } catch (err) {
    console.error(`❌ 查找 tsconfig 相关文件失败：`, err.message);
    return [];
  }
}

/**
 * 提取组件文件夹中 Vue 组件的元数据
 * @param {string} tsconfigPath - 具体的 tsconfig 文件路径（如 tsconfig.web.json）
 * @param {string} componentDir - 组件文件夹的绝对路径
 * @param {string} outputDir - 元数据输出目录的绝对路径
 * @returns {Promise<void>}
 */
async function extractComponentMeta(tsconfigPath, componentDir, outputDir) {
  // 校验路径有效性
  console.log(`🔍 开始校验输入路径...`);
  if (!fs.existsSync(tsconfigPath) || !fs.statSync(tsconfigPath).isFile()) {
    console.error(`❌ 错误：tsconfig 文件无效 -> ${tsconfigPath}`);
    return;
  }
  if (!validateDirPath(componentDir)) return;
  if (!validateDirPath(outputDir)) return;
  console.log(`✅ 所有路径校验通过`);

  // 初始化元数据检查器
  const checker = initMetaChecker(tsconfigPath);
  if (!checker) return;

  // 在组件文件夹中查找 .vue 文件
  console.log(`🔍 在组件文件夹 ${componentDir} 中查找 .vue 文件...`);
  const vueFiles = fg.sync(['**/*.vue'], {
    cwd: componentDir,
    absolute: true,
  });

  if (vueFiles.length === 0) {
    console.log(`ℹ️  组件文件夹 ${componentDir} 中未找到 .vue 文件`);
    return;
  } else if (vueFiles.length > 1) {
    console.log(`⚠️  组件文件夹 ${componentDir} 中找到多个 .vue 文件，仅处理第一个：${vueFiles[0]}`);
  }

  const componentFilePath = vueFiles[0];
  // 从文件夹名称获取组件名
  const componentName = path.basename(componentDir);
  console.log(`📊 开始提取组件 [${componentName}] 的元数据...`);

  // 提取并处理元数据
  try {
    const rawMeta = checker.getComponentMeta(componentFilePath);
    const formattedMeta = filterAndFormatMeta(rawMeta);
    saveMetaToJson(outputDir, componentName, formattedMeta);
    console.log(`\n🎉 组件 [${componentName}] 元数据提取完成！`);
  } catch (err) {
    console.error(`\n❌ 处理组件 [${componentName}] 失败：`, err.message);
  }
}

/**
 * 命令行交互：支持选择子 tsconfig 文件
 */
function startCliInteraction() {
  // const rl = readline.createInterface({
  //   input: process.stdin,
  //   output: process.stdout,
  // });

  // const inputs = {
  //   projectRoot: '',
  //   componentDir: '',
  //   outputDir: '',
  //   tsconfigPath: '',
  // };

  // // 1. 询问项目根目录
  // rl.question('请输入项目根目录的绝对路径：', (projectRootInput) => {
  //   inputs.projectRoot = path.resolve(projectRootInput.trim());
  //   if (!validateDirPath(inputs.projectRoot)) {
  //     rl.close();
  //     return;
  //   }

  //   // 2. 查找根 tsconfig.json 并解析子配置
  //   const rootTsconfigPath = path.join(inputs.projectRoot, 'tsconfig.json');
  //   if (!fs.existsSync(rootTsconfigPath)) {
  //     console.error(`❌ 错误：项目根目录下未找到 tsconfig.json -> ${rootTsconfigPath}`);
  //     rl.close();
  //     return;
  //   }

  //   const subTsconfigPaths = getSubTsconfigPaths(rootTsconfigPath);
  //   if (subTsconfigPaths.length === 0) {
  //     console.error(`❌ 错误：tsconfig.json 中未找到有效的子配置文件`);
  //     rl.close();
  //     return;
  //   }

  //   // 3. 让用户选择子 tsconfig 文件
  //   console.log(`\n检测到以下子 tsconfig 配置文件：`);
  //   subTsconfigPaths.forEach((path, index) => {
  //     console.log(`  ${index + 1}. ${path}`);
  //   });

  //   rl.question(`请输入要使用的配置文件序号（1-${subTsconfigPaths.length}）：`, (tsconfigIndexInput) => {
  //     const index = parseInt(tsconfigIndexInput.trim(), 10) - 1;
  //     if (isNaN(index) || index < 0 || index >= subTsconfigPaths.length) {
  //       console.error(`❌ 错误：无效的序号`);
  //       rl.close();
  //       return;
  //     }
  //     inputs.tsconfigPath = subTsconfigPaths[index];
  //     console.log(`✅ 已选择 tsconfig 文件：${inputs.tsconfigPath}`);

  //     // 4. 询问组件文件夹路径
  //     rl.question('\n请输入组件文件夹的绝对路径（如 src/components/slider）：', (componentDirInput) => {
  //       inputs.componentDir = path.resolve(componentDirInput.trim());
  //       if (!validateDirPath(inputs.componentDir)) {
  //         rl.close();
  //         return;
  //       }

  //       // 5. 询问输出目录
  //       const defaultOutputDir = path.join(inputs.projectRoot, 'component-meta');
  //       rl.question(
  //         `请输入元数据输出目录的绝对路径（默认：${defaultOutputDir}）：`,
  //         (outputDirInput) => {
  //           rl.close();
  //           inputs.outputDir = outputDirInput.trim()
  //             ? path.resolve(outputDirInput.trim())
  //             : defaultOutputDir;

  //           console.log(`\n🚀 开始执行组件元数据提取...`);
  //           console.log(`项目根目录：${inputs.projectRoot}`);
  //           console.log(`使用的 tsconfig：${inputs.tsconfigPath}`);
  //           console.log(`组件文件夹：${inputs.componentDir}`);
  //           console.log(`输出目录：${inputs.outputDir}\n`);
  //           extractComponentMeta(
  //             inputs.tsconfigPath,
  //             inputs.componentDir,
  //             inputs.outputDir
  //           );
  //         }
  //       );
  //     });
  //   });
  // });

  // 直接声明相关路径，无需用户输入
  const projectRoot = "D:\\OSPP\\element-plus"; // 项目根目录绝对路径
  const componentDir = "D:\\OSPP\\element-plus\\packages\\components\\badge\\src"; // 组件文件夹绝对路径
  const outputDir = "C:\\Users\\zyun\\Desktop\\LowCode-Material-Import\\npm-to-api-json-log"; // 元数据输出目录绝对路径
  // const tsconfigPath = "D:\\OSPP\\element-plus\\tsconfig.base.json";
  // const tsconfigPath = "D:\\OSPP\\element-plus\\tsconfig.play.json";
  // const tsconfigPath = "D:\\OSPP\\element-plus\\tsconfig.vitest.json";
  // const tsconfigPath = "D:\\OSPP\\element-plus\\tsconfig.web.json";
  const tsconfigPath = "D:\\OSPP\\element-plus\\tsconfig.web-merged.json";
  
  console.log(`\n🚀 开始执行组件元数据提取...`);
  console.log(`项目根目录：${projectRoot}`);
  console.log(`已选择 tsconfig 文件：${tsconfigPath}`);
  console.log(`使用的 tsconfig：${tsconfigPath}`);
  console.log(`组件文件夹：${componentDir}`);
  console.log(`输出目录：${outputDir}\n`);
  extractComponentMeta(tsconfigPath, componentDir, outputDir);
}

// 启动脚本
startCliInteraction();
