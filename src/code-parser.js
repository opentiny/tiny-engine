const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const { parse } = require('vue/compiler-sfc');

// 初始化路径常量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 缓存已解析的文件内容，避免重复解析
const fileContentCache = new Map();

/**
 * 读取文件内容（带缓存）
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 文件内容
 */
async function readFileContent(filePath) {
  try {
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
    
    // 检查缓存
    if (fileContentCache.has(absolutePath)) {
      return fileContentCache.get(absolutePath);
    }
    
    await fs.access(absolutePath);
    const content = await fs.readFile(absolutePath, 'utf8');
    fileContentCache.set(absolutePath, content);
    console.log(`✅ 成功读取文件：${absolutePath}`);
    return content;
  } catch (error) {
    throw new Error(`读取文件失败 [${filePath}]：${error.message}`);
  }
}

/**
 * 解析导入的模块路径
 * @param {string} baseFilePath - 基础文件路径
 * @param {string} importPath - 导入路径
 * @returns {string} 解析后的绝对路径
 */
function resolveImportPath(baseFilePath, importPath) {
  // 处理绝对路径
  if (path.isAbsolute(importPath)) {
    return importPath;
  }
  
  // 处理Node模块（非相对路径）
  if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
    console.warn(`⚠️ 不支持解析Node模块导入：${importPath}`);
    return null;
  }
  
  // 处理相对路径
  const baseDir = path.dirname(baseFilePath);
  const resolvedPath = path.resolve(baseDir, importPath);
  
  // 尝试添加文件扩展名
  const extensions = ['.ts', '.js', '.vue'];
  for (const ext of extensions) {
    const testPath = resolvedPath + ext;
    if (fsSync.existsSync(testPath)) {
      return testPath;
    }
  }
  
  // 尝试目录下的index文件
  for (const ext of extensions) {
    const testPath = path.join(resolvedPath, `index${ext}`);
    if (fsSync.existsSync(testPath)) {
      return testPath;
    }
  }
  
  console.warn(`⚠️ 无法解析导入路径：${importPath} 从 ${baseFilePath}`);
  return null;
}

/**
 * 提取文件中的导出内容
 * @param {string} content - 文件内容
 * @param {string} exportName - 要提取的导出名称
 * @returns {string|null} 导出内容
 */
function extractExport(content, exportName) {
  // 匹配命名导出
  const namedExportRegex = new RegExp(
    `export\\s+(const|let|var|function|interface|type)\\s+${exportName}\\s*=\\s*([\\s\\S]*?)(?=export|$)`,
    'i'
  );
  const namedMatch = content.match(namedExportRegex);
  if (namedMatch && namedMatch[2]) {
    return cleanExportContent(namedMatch[2]);
  }
  
  // 匹配对象导出
  const objectExportRegex = new RegExp(
    `export\\s*=\\s*\\{[\\s\\S]*?${exportName}\\s*:([\\s\\S]*?)[},]`,
    'i'
  );
  const objectMatch = content.match(objectExportRegex);
  if (objectMatch && objectMatch[1]) {
    return cleanExportContent(objectMatch[1]);
  }
  
  // 匹配解构导出
  const destructureExportRegex = new RegExp(
    `export\\s*\\{[\\s\\S]*?${exportName}\\s*[},]`,
    'i'
  );
  if (destructureExportRegex.test(content)) {
    // 递归查找该导出的定义
    const definitionRegex = new RegExp(
      `(const|let|var|function|interface|type)\\s+${exportName}\\s*=\\s*([\\s\\S]*?)(?=export|const|let|var|function|interface|type|$)`,
      'i'
    );
    const definitionMatch = content.match(definitionRegex);
    if (definitionMatch && definitionMatch[2]) {
      return cleanExportContent(definitionMatch[2]);
    }
  }
  
  return null;
}

/**
 * 清理导出内容
 * @param {string} content - 导出内容
 * @returns {string} 清理后的内容
 */
function cleanExportContent(content) {
  return content
    .replace(/\/\/.*$/gm, '') // 移除单行注释
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
    .replace(/\s+/g, ' ') // 合并空白符
    .trim();
}

/**
 * 解析导入的props定义
 * @param {string} baseFilePath - 基础文件路径
 * @param {string} importPath - 导入路径
 * @param {string} importName - 导入名称
 * @returns {string|null} props定义内容
 */
async function resolveImportedDefinition(baseFilePath, importPath, importName) {
  const resolvedPath = resolveImportPath(baseFilePath, importPath);
  if (!resolvedPath) {
    return null;
  }
  
  try {
    const content = await readFileContent(resolvedPath);
    const exportContent = extractExport(content, importName);
    
    if (exportContent) {
      // 检查是否还有嵌套导入
      const nestedImportRegex = /from\s*['"]([^'"]+)['"]/g;
      const nestedMatch = exportContent.match(nestedImportRegex);
      
      if (nestedMatch) {
        // 对于复杂的嵌套导入，递归解析
        console.log(`🔍 发现嵌套导入，正在解析: ${importName} 来自 ${importPath}`);
        // 这里简化处理，实际可能需要更复杂的逻辑
      }
      
      return exportContent;
    }
    
    console.warn(`⚠️ 在 ${resolvedPath} 中未找到导出 ${importName}`);
    return null;
  } catch (error) {
    console.error(`解析导入失败 [${importPath}#${importName}]：${error.message}`);
    return null;
  }
}

/**
 * 提取文件中的导入声明
 * @param {string} content - 文件内容
 * @returns {Array<object>} 导入声明数组
 */
function extractImports(content) {
  const imports = [];
  const importRegex = /import\s+([\s\S]*?)\s+from\s*['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importClause = match[1].trim();
    const importPath = match[2];
    
    // 处理命名导入
    if (importClause.startsWith('{')) {
      const namedImports = importClause
        .replace(/[{}]/g, '')
        .split(',')
        .map(item => item.trim())
        .filter(item => item);
      
      namedImports.forEach(importName => {
        // 处理别名导入 (如 import { a as b } from ...)
        const aliasMatch = importName.match(/([^ ]+)\s+as\s+([^ ]+)/);
        if (aliasMatch) {
          imports.push({
            originalName: aliasMatch[1],
            importedName: aliasMatch[2],
            path: importPath
          });
        } else {
          imports.push({
            originalName: importName,
            importedName: importName,
            path: importPath
          });
        }
      });
    }
    // 处理默认导入
    else if (!importClause.startsWith('*')) {
      imports.push({
        originalName: 'default',
        importedName: importClause,
        path: importPath
      });
    }
  }
  
  return imports;
}

/**
 * 解析Vue文件，提取组件信息
 * @param {string} content - Vue文件内容
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>} 组件信息
 */
async function parseVueFile(content, filePath) {
  try {
    const { descriptor } = parse(content);
    const componentInfo = {
      name: null,
      properties: [],
      events: [],
      slots: [],
      methods: [],
      exposes: [],
      others: []
    };

    // 从script部分提取组件名称和属性
    if (descriptor.script || descriptor.scriptSetup) {
      const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || '';
      
      // 提取组件名称
      const nameMatch = scriptContent.match(/defineComponent\s*\(\s*{\s*name\s*:\s*['"]([^'"]+)['"]/i) ||
                        scriptContent.match(/name\s*:\s*['"]([^'"]+)['"]/i);
      if (nameMatch) {
        componentInfo.name = nameMatch[1];
      } else {
        // 从文件名推断组件名
        const baseName = path.basename(filePath, '.vue');
        componentInfo.name = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      }

      // 提取导入声明
      const imports = extractImports(scriptContent);
      
      // 提取属性信息（包括导入的props）
      componentInfo.properties = await extractProps(scriptContent, filePath, imports);
      
      // 提取事件信息（包括导入的emits）
      componentInfo.events = await extractEvents(scriptContent, filePath, imports);
      
      // 提取暴露的属性和方法
      componentInfo.exposes = extractExposes(scriptContent);
    }

    // 从template提取插槽信息
    if (descriptor.template?.content) {
      componentInfo.slots = extractSlots(descriptor.template.content, filePath);
    }

    return componentInfo;
  } catch (error) {
    console.error(`解析Vue文件失败 [${filePath}]：${error.message}`);
    return null;
  }
}

/**
 * 从TypeScript文件提取类型信息
 * @param {string} content - TypeScript文件内容
 * @param {string} fileName - 文件名
 * @returns {object} 类型信息
 */
function parseTsFile(content, fileName) {
  try {
    // 提取接口定义
    const interfaceMatches = content.match(/interface\s+([A-Za-z0-9_]+)\s*\{([\s\S]*?)\}/g) || [];
    const interfaces = {};
    
    interfaceMatches.forEach(match => {
      const nameMatch = match.match(/interface\s+([A-Za-z0-9_]+)/);
      if (nameMatch && nameMatch[1]) {
        const interfaceName = nameMatch[1];
        interfaces[interfaceName] = extractInterfaceProperties(match);
      }
    });
    
    return {
      interfaces
    };
  } catch (error) {
    console.error(`解析TypeScript文件失败 [${fileName}]：${error.message}`);
    return null;
  }
}

/**
 * 提取接口属性
 * @param {string} interfaceContent - 接口内容
 * @returns {array} 属性数组
 */
function extractInterfaceProperties(interfaceContent) {
  const properties = [];
  const propMatches = interfaceContent.match(/([a-zA-Z0-9_]+)\s*:\s*([^;]+);/g) || [];
  
  propMatches.forEach(prop => {
    const [name, type] = prop.split(/\s*:\s*/).map(p => p.trim().replace(';', ''));
    if (name && type) {
      properties.push({
        name,
        type: formatType(type)
      });
    }
  });
  
  return properties;
}

/**
 * 格式化类型名称
 * @param {string} type - 原始类型
 * @returns {string} 格式化后的类型
 */
function formatType(type) {
  // 处理联合类型
  if (type.includes('|')) {
    return type.split('|').map(t => t.trim()).join(' / ');
  }
  
  // 处理泛型
  const genericMatch = type.match(/([A-Za-z0-9_]+)<[^>]+>/);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1];
  }
  
  return type;
}

/**
 * 提取组件属性
 * @param {string} scriptContent - 脚本内容
 * @param {string} filePath - 文件路径
 * @param {Array<object>} imports - 导入声明
 * @returns {Promise<array>} 属性数组
 */
async function extractProps(scriptContent, filePath, imports) {
  const props = [];
  
  // 处理defineProps宏
  const propsMatches = scriptContent.match(/defineProps\s*<[^>]+>\s*\(\s*([^)]+)\s*\)/) ||
                       scriptContent.match(/defineProps\s*\(\s*([^)]+)\s*\)/);
  
  if (propsMatches && propsMatches[1]) {
    let propsContent = propsMatches[1].trim();
    
    // 检查是否是导入的变量
    if (/^[A-Za-z0-9_]+$/.test(propsContent)) {
      // 查找这个变量的导入信息
      const importInfo = imports.find(imp => imp.importedName === propsContent);
      
      if (importInfo) {
        console.log(`🔍 解析导入的props: ${propsContent} 来自 ${importInfo.path}`);
        // 解析导入的props定义
        const importedPropsContent = await resolveImportedDefinition(
          filePath, 
          importInfo.path, 
          importInfo.originalName
        );
        
        if (importedPropsContent) {
          propsContent = importedPropsContent;
        }
      }
    }
    
    // 解析props内容
    if (propsContent.startsWith('{') && propsContent.endsWith('}')) {
      // 提取属性配置
      const propEntries = propsContent.match(/([a-zA-Z0-9_]+)\s*:\s*([^,]+)/g) || [];
      
      propEntries.forEach(prop => {
        const [name, config] = prop.split(/\s*:\s*/).map(p => p.trim());
        if (name && config) {
          const propInfo = {
            name,
            description: extractPropDescription(scriptContent, name),
            type: 'unknown',
            default: '—'
          };
          
          // 提取类型信息
          const typeMatch = config.match(/type\s*:\s*([A-Za-z0-9_]+)/);
          if (typeMatch && typeMatch[1]) {
            propInfo.type = formatType(typeMatch[1]);
          } else if (config.includes('boolean')) {
            propInfo.type = 'boolean';
          } else if (config.includes('string')) {
            propInfo.type = 'string';
          } else if (config.includes('number')) {
            propInfo.type = 'number';
          } else if (config.includes('Array')) {
            propInfo.type = 'array';
          } else if (config.includes('Object')) {
            propInfo.type = 'object';
          }
          
          // 处理枚举类型
          if (config.includes('enum')) {
            propInfo.type = 'enum';
            const enumMatch = config.match(/enum\s*:\s*\[(.*?)\]/);
            if (enumMatch && enumMatch[1]) {
              propInfo.enumOptions = enumMatch[1].split(',').map(opt => opt.trim().replace(/['"]/g, ''));
            }
          }
          
          // 提取默认值
          const defaultMatch = config.match(/default\s*:\s*([^,]+)/);
          if (defaultMatch && defaultMatch[1]) {
            let defaultValue = defaultMatch[1].trim();
            // 清理函数表达式
            if (defaultValue.startsWith('() =>')) {
              defaultValue = defaultValue.replace('() => ', '');
            }
            propInfo.default = defaultValue;
          }
          
          props.push(propInfo);
        }
      });
    }
  }
  
  return props;
}

/**
 * 提取属性描述
 * @param {string} scriptContent - 脚本内容
 * @param {string} propName - 属性名
 * @returns {string} 属性描述
 */
function extractPropDescription(scriptContent, propName) {
  // 查找属性上方的注释
  const lines = scriptContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`${propName}:`)) {
      // 向上查找注释
      for (let j = i - 1; j >= 0; j--) {
        const trimmedLine = lines[j].trim();
        if (trimmedLine.startsWith('//')) {
          return trimmedLine.replace('//', '').trim();
        } else if (trimmedLine.startsWith('*')) {
          return trimmedLine.replace('*', '').trim();
        } else if (trimmedLine) {
          // 遇到非空行且不是注释，停止查找
          break;
        }
      }
      break;
    }
  }
  return '';
}

/**
 * 提取事件信息
 * @param {string} scriptContent - 脚本内容
 * @param {string} filePath - 文件路径
 * @param {Array<object>} imports - 导入声明
 * @returns {Promise<array>} 事件数组
 */
async function extractEvents(scriptContent, filePath, imports) {
  const events = [];
  
  // 处理defineEmits宏
  const emitsMatches = scriptContent.match(/defineEmits\s*<[^>]+>\s*\(\s*([^)]+)\s*\)/) ||
                       scriptContent.match(/defineEmits\s*\(\s*([^)]+)\s*\)/);
  
  if (emitsMatches && emitsMatches[1]) {
    let emitsContent = emitsMatches[1].trim();
    
    // 检查是否是导入的变量
    if (/^[A-Za-z0-9_]+$/.test(emitsContent)) {
      // 查找这个变量的导入信息
      const importInfo = imports.find(imp => imp.importedName === emitsContent);
      
      if (importInfo) {
        console.log(`🔍 解析导入的emits: ${emitsContent} 来自 ${importInfo.path}`);
        // 解析导入的emits定义
        const importedEmitsContent = await resolveImportedDefinition(
          filePath, 
          importInfo.path, 
          importInfo.originalName
        );
        
        if (importedEmitsContent) {
          emitsContent = importedEmitsContent;
        }
      }
    }
    
    // 解析数组形式的emits
    if (emitsContent.startsWith('[') && emitsContent.endsWith(']')) {
      const emitNames = emitsContent
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(name => name.trim().replace(/['"]/g, ''))
        .filter(name => name);
      
      emitNames.forEach(name => {
        events.push({
          name,
          description: extractEventDescription(scriptContent, name),
          parameters: []
        });
      });
    }
    // 解析对象形式的emits
    else if (emitsContent.startsWith('{') && emitsContent.endsWith('}')) {
      const emitEntries = emitsContent.match(/['"]([^'"]+)['"]\s*:\s*[^,]+/g) || [];
      
      emitEntries.forEach(entry => {
        const nameMatch = entry.match(/['"]([^'"]+)['"]/);
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1];
          events.push({
            name,
            description: extractEventDescription(scriptContent, name),
            parameters: []
          });
        }
      });
    }
  }
  
  // 查找emit调用提取更多事件
  const emitCalls = scriptContent.match(/emit\s*\(\s*['"]([^'"]+)['"]/g) || [];
  emitCalls.forEach(call => {
    const eventName = call.match(/['"]([^'"]+)['"]/)[1];
    if (eventName && !events.some(e => e.name === eventName)) {
      events.push({
        name: eventName,
        description: extractEventDescription(scriptContent, eventName),
        parameters: []
      });
    }
  });
  
  return events;
}

/**
 * 提取事件描述
 * @param {string} scriptContent - 脚本内容
 * @param {string} eventName - 事件名
 * @returns {string} 事件描述
 */
function extractEventDescription(scriptContent, eventName) {
  // 查找事件相关的注释
  const eventCommentMatch = scriptContent.match(new RegExp(`//.*emits.*${eventName}`, 'i')) ||
                            scriptContent.match(new RegExp(`/\\*.*emits.*${eventName}.*\\*/`, 'i'));
  
  if (eventCommentMatch) {
    return eventCommentMatch[0]
      .replace(/\/\/|\/\*|\*\//g, '')
      .replace(new RegExp(`emits.*${eventName}`, 'i'), '')
      .trim();
  }
  
  return '';
}

/**
 * 提取插槽信息
 * @param {string} templateContent - 模板内容
 * @param {string} fileName - 文件名
 * @returns {array} 插槽数组
 */
function extractSlots(templateContent, fileName) {
  const slots = [];
  
  // 查找所有slot标签
  const slotMatches = templateContent.match(/<slot\s+[^>]*>/g) || [];
  
  slotMatches.forEach(slot => {
    // 提取插槽名称
    const nameMatch = slot.match(/name\s*=\s*['"]([^'"]+)['"]/);
    const slotName = nameMatch ? nameMatch[1] : 'default';
    
    // 检查是否已存在该插槽
    if (!slots.some(s => s.name === slotName)) {
      slots.push({
        name: slotName,
        description: getSlotDescription(slotName),
        subtag: extractSlotSubtag(slot)
      });
    }
  });
  
  return slots;
}

/**
 * 获取插槽描述
 * @param {string} slotName - 插槽名
 * @returns {string} 插槽描述
 */
function getSlotDescription(slotName) {
  const descriptions = {
    'default': '自定义默认内容',
    'header': '自定义头部内容',
    'footer': '自定义底部内容',
    'content': '自定义主体内容',
    'prefix': '自定义前缀内容',
    'suffix': '自定义后缀内容',
    'icon': '自定义图标内容'
  };
  
  return descriptions[slotName] || `自定义${slotName}插槽内容`;
}

/**
 * 提取插槽子标签
 * @param {string} slotTag - 插槽标签
 * @returns {string} 子标签
 */
function extractSlotSubtag(slotTag) {
  const subtagMatch = slotTag.match(/subtag\s*=\s*['"]([^'"]+)['"]/);
  return subtagMatch ? subtagMatch[1] : '';
}

/**
 * 提取暴露的属性和方法
 * @param {string} scriptContent - 脚本内容
 * @returns {array} 暴露的属性和方法数组
 */
function extractExposes(scriptContent) {
  const exposes = [];
  
  // 处理defineExpose
  const exposeMatches = scriptContent.match(/defineExpose\s*\(\s*\{([\s\S]*?)\}\s*\)/);
  
  if (exposeMatches && exposeMatches[1]) {
    const exposeEntries = exposeMatches[1].split(',').map(entry => entry.trim());
    exposeEntries.forEach(entry => {
      if (entry) {
        const name = entry.split(':')[0].trim();
        exposes.push({
          name,
          description: `暴露的${name}属性/方法`,
          type: 'object'
        });
      }
    });
  }
  
  return exposes;
}

/**
 * 保存生成的JSON到文件
 * @param {object} jsonData - 要保存的JSON数据
 * @param {string} baseName - 基础文件名
 */
function saveJsonOutput(jsonData, baseName) {
  try {
    const outputDir = path.join(__dirname, 'output');
    if (!fsSync.existsSync(outputDir)) {
      fsSync.mkdirSync(outputDir, { recursive: true });
      console.log(`📂 创建输出目录：${outputDir}`);
    }
    
    const timestamp = new Date().getTime();
    const fileName = `${baseName}-components-${timestamp}.json`;
    const filePath = path.join(outputDir, fileName);
    
    const content = JSON.stringify(jsonData, null, 2);
    fsSync.writeFileSync(filePath, content, 'utf8');
    console.log(`📁 生成的JSON已保存至：${filePath}`);
    return filePath;
  } catch (error) {
    throw new Error(`保存JSON失败：${error.message}`);
  }
}

/**
 * 解析包信息
 * @param {string} packageJsonContent - package.json内容
 * @returns {object} 包信息
 */
function parsePackageInfo(packageJsonContent) {
  try {
    const packageJson = JSON.parse(packageJsonContent);
    return {
      name: packageJson.name || '',
      version: packageJson.version || ''
    };
  } catch (error) {
    console.error(`解析package.json失败：${error.message}`);
    return { name: '', version: '' };
  }
}

/**
 * 主函数：处理组件文件并生成JSON
 * @param {object} options - 配置选项
 * @param {string[]} options.files - 组件文件路径数组
 * @param {string} options.packageJsonPath - package.json路径
 * @param {string} options.url - 组件文档URL
 * @param {string} options.name - 组件集名称
 * @param {string} options.description - 组件集描述
 */
async function main(options) {
  try {
    console.log(`=== 开始执行组件解析流程 ===`);
    
    // 清除缓存
    fileContentCache.clear();
    
    // 读取package.json
    const packageJsonContent = await readFileContent(options.packageJsonPath);
    const packageInfo = parsePackageInfo(packageJsonContent);
    
    // 分类处理文件
    const vueFiles = [];
    const tsFiles = [];
    
    for (const filePath of options.files) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.vue') {
        vueFiles.push(filePath);
      } else if (ext === '.ts') {
        tsFiles.push(filePath);
      } else {
        console.warn(`⚠️ 忽略不支持的文件类型：${filePath}`);
      }
    }
    
    // 验证至少有一个Vue文件
    if (vueFiles.length === 0) {
      throw new Error('至少需要提供一个Vue文件');
    }
    
    // 解析TypeScript文件获取类型信息
    const tsTypeInfo = {};
    for (const tsPath of tsFiles) {
      const content = await readFileContent(tsPath);
      const tsInfo = parseTsFile(content, tsPath);
      if (tsInfo && tsInfo.interfaces) {
        Object.assign(tsTypeInfo, tsInfo.interfaces);
      }
    }
    
    // 解析Vue文件获取组件信息
    const components = {};
    for (const vuePath of vueFiles) {
      const content = await readFileContent(vuePath);
      const componentInfo = await parseVueFile(content, vuePath);
      
      if (componentInfo && componentInfo.name) {
        // 补充类型信息
        if (tsTypeInfo[`${componentInfo.name}Props`]) {
          // 可以在这里使用TS中定义的属性类型信息增强组件属性描述
        }
        
        components[componentInfo.name] = {
          properties: componentInfo.properties,
          events: componentInfo.events,
          slots: componentInfo.slots,
          methods: componentInfo.methods,
          exposes: componentInfo.exposes,
          others: componentInfo.others
        };
      }
    }
    
    // 构建最终的JSON结构
    const resultJson = {
      url: options.url || '',
      name: options.name || '组件集合',
      description: options.description || '',
      version: packageInfo.version,
      package: {
        name: packageInfo.name,
        version: packageInfo.version
      },
      components,
      others: []
    };
    
    // 保存结果
    const baseName = options.name ? options.name.replace(/\s+/g, '-').toLowerCase() : 'components';
    const savePath = saveJsonOutput(resultJson, baseName);
    
    console.log(`=== 组件解析流程完成 ===`);
    console.log(`📌 共解析 ${Object.keys(components).length} 个组件`);
    console.log(`📌 结果文件：${savePath}`);
    
    return {
      components: Object.keys(components),
      resultJson,
      savePath
    };
  } catch (error) {
    console.error(`❌ 流程执行失败：${error.message}`);
    process.exit(1);
  }
}

/**
 * 解析命令行参数
 * @returns {object} 解析后的参数
 */
function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    files: [],
    packageJsonPath: '',
    url: '',
    name: '',
    description: ''
  };

  let currentArg = null;
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      currentArg = arg.slice(2);
    } else if (currentArg) {
      switch (currentArg) {
        case 'files':
          options.files.push(...arg.split(',').map(f => f.trim()));
          break;
        case 'packageJsonPath':
          options.packageJsonPath = arg;
          break;
        case 'url':
          options.url = arg;
          break;
        case 'name':
          options.name = arg;
          break;
        case 'description':
          options.description = arg;
          break;
        default:
          console.warn(`未知参数：${currentArg}`);
      }
      currentArg = null;
    } else {
      console.warn(`忽略无效参数：${arg}`);
    }
  }

  // 验证必填参数
  if (options.files.length === 0) {
    console.error('❌ 必须提供至少一个组件文件');
    printUsage();
    process.exit(1);
  }
  
  if (!options.packageJsonPath) {
    console.error('❌ 必须提供package.json路径');
    printUsage();
    process.exit(1);
  }

  return options;
}

/**
 * 打印使用说明
 */
function printUsage() {
  console.log('\n使用示例：');
  console.log('node component-parser.js --files ./button.vue,./button.ts --packageJsonPath ./package.json --url "https://example.com/components/button.html" --name "Button 按钮" --description "常用的操作按钮"');
  
  console.log('\n参数说明：');
  console.log('--files: 组件文件路径，多个文件用逗号分隔（必填）');
  console.log('--packageJsonPath: package.json文件路径（必填）');
  console.log('--url: 组件文档URL（可选）');
  console.log('--name: 组件集名称（可选）');
  console.log('--description: 组件集描述（可选）');
}

// 命令行运行入口
if (require.main === module) {
  const cliOptions = parseCliArgs();
  main(cliOptions);
}

// 导出供编程调用
module.exports = {
  main,
  parseVueFile,
  parseTsFile,
  parsePackageInfo
};
