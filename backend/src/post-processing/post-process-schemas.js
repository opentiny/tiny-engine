const fs = require('fs');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const { OpenAI } = require("openai");
const { mergeTableColumns } = require('./multi-component-handlers/merge-table-columns');
const { removeItemSnippets } = require('./multi-component-handlers/remove-item-snippets');

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  timeout: 6000000
});

// 1. 原始规则集合（保持原有命名习惯，支持任意格式）
const NO_PROCESS_RAW = new Set([
  "Button", "ButtonGroup", "button-group", "Checkbox", "checkbox-group",
  "Radio", "radio-button", "Cascader Panel", "Tag", "CheckTag",
  "Statistic", "Countdown", "Image Viewer", "Image"
]);

const MERGE_TABLE_RAW = new Set([
  "Table", "table-column", "TableColumn", "TableV2", "table-v2",
  "Column", "column"
]);

const REMOVE_SNIPPET_RAW = new Set([
  "SplitterPanel", "splitter-panel", "Transfer Panel", "transfer-panel",
  "FormItem", "form-item", "Carousel-Item", "carousel item",
  "Collapse Item", "collapse-item", "DescriptionsItem", "descriptions-item",
  "SkeletonItem", "Timeline-Item", "BreadcrumbItem", "Dropdown-Menu",
  "Dropdown-Item", "TourStep", "AnchorLink", "Step", "Tab-pane",
  "Tab-nav", "Row", "Col", "Option Group", "option-group", "Option",
  "SubMenu", "Menu-Item", "MenuItemGroup", "Header", "Aside", "Main", "Footer"
]);

const PARENT_COMPONENTS_RAW = new Set([
  "Table", "table-v2", "TableV2", "Splitter", "splitter",
  "Transfer", "Form", "form", "Carousel", "Collapse",
  "Descriptions", "Skeleton", "Timeline", "Dropdown",
  "Tour", "Anchor", "Steps", "Tabs"
]);

// 2. 预标准化为 Map（key：标准化名，value：原始名）
const NO_PROCESS_MAP = createStandardizedMap(NO_PROCESS_RAW);
const MERGE_TABLE_MAP = createStandardizedMap(MERGE_TABLE_RAW);
const REMOVE_SNIPPET_MAP = createStandardizedMap(REMOVE_SNIPPET_RAW);
const PARENT_COMPONENTS_MAP = createStandardizedMap(PARENT_COMPONENTS_RAW);

/**
 * 组件名标准化：将任意格式（连字符、空格、下划线、大小写）转换为驼峰式且首字母大写（PascalCase）
 * 示例：
 * - "table-column" → "TableColumn"
 * - "Table Column" → "TableColumn"
 * - "TABLE_COLUMN" → "TableColumn"
 * - "tableColumn" → "TableColumn"（已为驼峰式，仅首字母大写）
 * - "table" → "Table"（单单词直接首字母大写）
 * @param {string} name - 原始组件名
 * @returns {string} 标准化后的驼峰式组件名
 */
function standardizeComponentName(name) {
  if (!name || typeof name !== 'string') return '';

  // 将驼峰式命名（如 TableColumn）转换为连字符分隔（Table-Column）
  // 原理：在大写字母前插入连字符（排除第一个字符）
  const camelToHyphen = name.replace(/(?<!^)(?=[A-Z])/g, '-');

  // 1. 统一将分隔符（连字符、空格、下划线）替换为连字符
  const withHyphens = camelToHyphen.replace(/[\s_]/g, '-');

  // 2. 分割为单词数组（按连字符分割，并过滤空字符串）
  const words = withHyphens.split('-').filter(word => word.length > 0);

  // 3. 每个单词首字母大写，其余字母小写，然后拼接
  return words.map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}

/**
 * 标准化规则集合：将原始 Set 转换为“标准化格式→原始格式”的 Map，便于匹配和回溯
 * @param {Set<string>} originalSet - 原始组件名集合
 * @returns {Map<string, string>} 标准化后的映射（key：标准化驼峰名，value：原始名）
 */
function createStandardizedMap(originalSet) {
  const map = new Map();
  originalSet.forEach(originalName => {
    const standardized = standardizeComponentName(originalName);
    if (standardized) {
      map.set(standardized, originalName); // 若有重复标准化名，以最后一个为准
    }
  });
  return map;
}

/**
 * 后续处理主函数：接收转换结果，按规则处理后保存
 * @param {Array} conversionResults - batchConvertToTinyEngineSchema 的返回结果
 * @param {string} outputDir - 指定文件保存路径（支持相对路径或绝对路径）
 * @returns {Array} 处理后的结果（或原始结果，若校验不通过）
 */
async function postProcessSchemas(conversionResults, outputDir, { signal } = {}) {
  if (signal?.aborted) throw new Error('任务被用户取消，停止后处理');

  // 1. 校验是否全部转换成功
  const successCount = conversionResults.filter(r => r.success !== false).length;
  const totalCount = conversionResults.length;
  if (successCount !== totalCount) {
    console.warn("⚠️ 存在转换失败的子组件，跳过后续特殊处理");
    return conversionResults;
  }

  const validResults = conversionResults.map(item => {
    if (signal?.aborted) throw new Error('任务被用户取消，停止筛选有效结果');

    const { subComponentName, schema } = item;
    // 校验1：schema 必须是对象
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
      console.warn(`⚠️ 子组件[${subComponentName}]的schema类型无效（需为对象），跳过处理`);
      return null;
    }
    // 校验2：schema 必须包含核心的 "schema" 字段
    if (!schema.schema) {
      console.warn(`⚠️ 子组件[${subComponentName}]的schema缺少核心"schema"字段，跳过处理`);
      return null;
    }
    return { subComponentName, schema };
  }).filter(Boolean); // 过滤掉无效的结果

  // 3. 按结果数量分支处理
  if (validResults.length === 1) {
    console.log("✅ 结果数量为1，无需额外处理，直接保存");
    saveProcessedSchemas(validResults, outputDir, { signal });
    return conversionResults;
  } else if (validResults.length > 1) {
    console.log("🔍 结果数量>1，开始分类处理");
    const processed = processMultiResults(validResults, { signal });

    saveProcessedSchemas(processed, outputDir, { signal });
    console.log("✅ 所有结果后处理完毕，保存到文件");

    return processed;
    // return optimizedProcessed;
  }

  return conversionResults;
}

/**
 * 处理数量>1的结果：区分三类场景
 * @param {Array} validResults - 仅含成功结果的数组
 * @returns {Array} 处理后的结果（含新 schema 或原始数据）
 */
function processMultiResults(validResults, { signal } = {}) {
  const processed = [];
  const tableCandidates = []; // 暂存表格相关组件，后续合并

  // 1. 遍历所有有效结果，分类处理（仅收集表格组件，不执行合并）
  validResults.forEach(item => {
    if (signal?.aborted) throw new Error('任务被用户取消，停止多组件分类处理');

    const { subComponentName, schema } = item;
    // 关键：将输入的 subComponentName 标准化
    const standardizedName = standardizeComponentName(subComponentName);

    // 1.1 匹配 NO_PROCESS（通过标准化Map判断）
    if (NO_PROCESS_MAP.has(standardizedName)) {
      const originalName = NO_PROCESS_MAP.get(standardizedName);
      console.log(`ℹ️ [${subComponentName}]（标准化为${originalName}）无需处理，直接保留`);
      processed.push({ subComponentName, schema });
    }
    // 1.2 匹配 MERGE_TABLE（通过标准化Map判断）：仅收集，不立即合并
    else if (MERGE_TABLE_MAP.has(standardizedName)) {
      const originalName = MERGE_TABLE_MAP.get(standardizedName);
      console.log(`🔢 [${subComponentName}]（标准化为${originalName}）标记为表格相关，待合并`);
      // 存储时保留原始 subComponentName 和标准化名，便于后续配对
      tableCandidates.push({ subComponentName, standardizedName, schema });
    }
    // 1.3 匹配 REMOVE_SNIPPET（通过标准化Map判断）
    else if (REMOVE_SNIPPET_MAP.has(standardizedName)) {
      const originalName = REMOVE_SNIPPET_MAP.get(standardizedName);
      console.log(`🧹 [${subComponentName}]（标准化为${originalName}）执行 removeItemSnippets 处理`);
      const cleanedSchema = removeItemSnippets(schema);
      processed.push({ subComponentName, schema: cleanedSchema });
    }
    // 1.4 无匹配规则：直接保留
    else {
      console.log(`ℹ️ [${subComponentName}] 无匹配规则，直接保留`);
      processed.push({ subComponentName, schema });
    }
  });

  if (signal?.aborted) throw new Error('任务被用户取消，停止表格组件合并');

  // 2. 遍历结束后，统一处理表格合并
  if (tableCandidates.length === 2) {
    console.log("🔧 发现表格组件配对，执行 mergeTableColumns 合并");
    // 标准化合法配对的名称（支持多格式匹配）
    const validPair1 = {
      tableStd: standardizeComponentName("Table"), // 标准化后为 "Table"
      columnStd: standardizeComponentName("Table-column"), // 标准化后为 "TableColumn"
      mergedName: "Table"
    };
    const validPair2 = {
      tableStd: standardizeComponentName("TableV2"), // 标准化后为 "TableV2"
      columnStd: standardizeComponentName("Column"), // 标准化后为 "Column"
      mergedName: "TableV2"
    };

    console.log("📋 预设的表格配对规则：");
    console.log(`- 配对1：Table标准名=${validPair1.tableStd}，Column标准名=${validPair1.columnStd}`);
    console.log(`- 配对2：TableV2标准名=${validPair2.tableStd}，Column标准名=${validPair2.columnStd}`);

    let matchedPair = null;
    // 提取表格候选者的标准化名称
    const candidateStdNames = tableCandidates.map(item => item.standardizedName);

    console.log("📌 当前表格候选者的标准化名称：\n  - " + candidateStdNames.join("\n  - "));

    // 检查是否匹配配对1（Table + TableColumn）
    if (candidateStdNames.includes(validPair1.tableStd) && candidateStdNames.includes(validPair1.columnStd)) {
      matchedPair = validPair1;
      console.log("✅ 匹配到配对1：Table + TableColumn");
    }
    // 检查是否匹配配对2（TableV2 + Column）
    else if (candidateStdNames.includes(validPair2.tableStd) && candidateStdNames.includes(validPair2.columnStd)) {
      matchedPair = validPair2;
      console.log("✅ 匹配到配对2：TableV2 + Column");
    }

    if (matchedPair) {
      // 根据标准化名称找到对应的 schema
      const tableSchema = tableCandidates.find(i => i.standardizedName === matchedPair.tableStd)?.schema;
      const columnSchema = tableCandidates.find(i => i.standardizedName === matchedPair.columnStd)?.schema;

      if (tableSchema && columnSchema) {
        const merged = mergeTableColumns(tableSchema, columnSchema);
        processed.push({
          subComponentName: matchedPair.mergedName,
          schema: merged
        });
      } else {
        console.warn("⚠️ 表格组件配对不完整，跳过合并");
        processed.push(...tableCandidates.map(item => ({ subComponentName: item.subComponentName, schema: item.schema })));
      }
    } else {
      console.warn("⚠️ 表格组件配对不合法，跳过合并");
      if (!candidateStdNames.includes(validPair1.tableStd) && !candidateStdNames.includes(validPair2.tableStd)) {
        console.log("- 原因：候选者中没有 Table 或 TableV2 的标准化名称");
      }
      if (!candidateStdNames.includes(validPair1.columnStd) && !candidateStdNames.includes(validPair2.columnStd)) {
        console.log("- 原因：候选者中没有 TableColumn 或 Column 的标准化名称");
      }
      processed.push(...tableCandidates.map(item => ({ subComponentName: item.subComponentName, schema: item.schema })));
    }
  } else {
    // 表格候选者数量不是2，直接加入结果
    processed.push(...tableCandidates.map(item => ({ subComponentName: item.subComponentName, schema: item.schema })));
  }
  return processed;
}

/**
 * 统一保存处理后的 schema 到文件
 * @param {Array} processedResults - 处理后的结果数组（含 subComponentName 和 schema）
 * @param {string} outputDir - 指定文件保存路径（支持相对路径或绝对路径）
 */
function saveProcessedSchemas(processedResults, outputDir, { signal } = {}) {
  processedResults.forEach(item => {
    if (signal?.aborted) throw new Error('任务被用户取消，停止文件保存');
    saveSchemaToFile(item.schema, item.subComponentName, outputDir);
  });
}

/**
 * 封装保存逻辑（与原函数保持一致）
 * @param {Object|Array} schema - 已解析的JSON对象或对象数组 
 * @param {string} subComponentName - 子组件名（用于文件名区分）
 * @param {string} outputDir - 指定文件保存路径（支持相对路径或绝对路径）
 */
function saveSchemaToFile(schema, subComponentName, outputDir, { signal } = {}) {
  try {
    if (signal?.aborted) throw new Error('任务被用户取消，停止当前文件保存');

    if (!schema) throw new Error("schema 为空");

    const schemaDir = path.resolve(outputDir);
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
      console.log(`已创建目录：${schemaDir}`);
    }

    const timestamp = new Date().getTime();
    const components = Array.isArray(schema) ? schema : [schema];

    components.forEach((compSchema, idx) => {
      if (signal?.aborted) throw new Error('任务被用户取消，停止当前文件写入');

      const baseName = compSchema.component || `${subComponentName}-${idx}`;
      const safeName = String(baseName).replace(/[^a-z0-9._-]/gi, '-');
      const fileName = path.basename(`${safeName}-${timestamp}.json`);

      const filePath = path.join(schemaDir, fileName);

      fs.writeFileSync(filePath, JSON.stringify(compSchema, null, 2), 'utf8');
      console.log(`子组件[${subComponentName}] 保存成功：${filePath}`);
    });

  } catch (err) {
    if (signal?.aborted) throw err;
    console.error(`子组件[${subComponentName}] 保存失败：${err.message}`);
  }
}

// 导出函数，供其他脚本调用
module.exports = { postProcessSchemas };