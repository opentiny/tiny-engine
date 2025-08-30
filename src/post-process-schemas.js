const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });
const { OpenAI } = require("openai");
const { mergeTableColumns } = require('./multi-component-handlers/merge-table-columns');
const { removeItemSnippets } = require('./multi-component-handlers/remove-item-snippets');

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  timeout: 6000000
});

/**
 * 后续处理主函数：接收转换结果，按规则处理后保存
 * @param {Array} conversionResults - batchConvertToTinyEngineSchema 的返回结果
 * @returns {Array} 处理后的结果（或原始结果，若校验不通过）
 */
async function postProcessSchemas(conversionResults) {
  // 1. 校验是否全部转换成功
  const successCount = conversionResults.filter(r => r.success !== false).length;
  const totalCount = conversionResults.length;
  if (successCount !== totalCount) {
    console.warn("⚠️ 存在转换失败的子组件，跳过后续特殊处理");
    return conversionResults;
  }

  // 2. 提取有效结果（仅成功的 schema 和子组件名）
  // const validResults = conversionResults.map(item => ({
  //   subComponentName: item.subComponentName,
  //   schema: item.schema
  // }));
  const validResults = conversionResults.map(item => {
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
    saveProcessedSchemas(validResults);
    return conversionResults;
  } else if (validResults.length > 1) {
    console.log("🔍 结果数量>1，开始分类处理");
    const processed = processMultiResults(validResults);

    saveProcessedSchemas(processed);
    console.log("✅ 所有结果后处理完毕，保存到文件");

    // 新增：优化父组件的snippets字段
    // const optimizedProcessed = await optimizeParentSnippets(processed);
    // console.log("✅ 所有父组件snippet字段处理完毕，保存到文件");
    // saveProcessedSchemas(optimizedProcessed);

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
function processMultiResults(validResults) {
  // 定义三类组件的匹配规则（用 Set 提升查找效率）
  const NO_PROCESS = new Set([
    "Button", "ButtonGroup", "Checkbox", "CheckboxGroup", "CheckboxButton",
    "Radio", "RadioGroup", "RadioButton", "Cascader", "CascaderPanel",
    "Tag", "CheckTag", "Statistic", "Countdown", "Image", "Image Viewer", "Select"
  ]);
  const MERGE_TABLE = new Set(["Table", "Table-column", "TableV2", "Column"]);
  const REMOVE_SNIPPET = new Set([
    "SplitterPanel", "Transfer Panel", "FormItem", "Carousel-Item",
    "Collapse Item", "DescriptionsItem", "SkeletonItem", "Timeline-Item",
    "BreadcrumbItem", "Dropdown-Menu", "Dropdown-Item", "TourStep", "AnchorLink",
    "Step", "Tab-pane", "Tab-nav", "Row", "Col", "Option Group", "Option"
  ]);

  const processed = [];
  const tableCandidates = []; // 暂存表格相关组件，后续合并

  validResults.forEach(item => {
    const { subComponentName, schema } = item;

    if (NO_PROCESS.has(subComponentName)) {
      console.log(`ℹ️ [${subComponentName}] 无需处理，直接保留`);
      processed.push({ subComponentName, schema });
    } else if (MERGE_TABLE.has(subComponentName)) {
      console.log(`🔢 [${subComponentName}] 标记为表格相关，待合并`);
      tableCandidates.push({ subComponentName, schema });
    } else if (REMOVE_SNIPPET.has(subComponentName)) {
      console.log(`🧹 [${subComponentName}] 执行 removeItemSnippets 处理`);
      const cleanedSchema = removeItemSnippets(schema);
      processed.push({ subComponentName, schema: cleanedSchema });
    } else {
      console.log(`ℹ️ [${subComponentName}] 无匹配规则，直接保留`);
      processed.push({ subComponentName, schema });
    }
  });

  // 处理表格合并（需成对出现）
  if (tableCandidates.length === 2) {
    console.log("🔧 发现表格组件配对，执行 mergeTableColumns 合并");
    // 定义两种合法配对
    const validPair1 = {
      tableName: "Table",
      columnName: "Table-column",
      mergedName: "Table"
    };
    const validPair2 = {
      tableName: "TableV2",
      columnName: "Column",
      mergedName: "TableV2"
    };
    let matchedPair = null;
    // 检查是否为合法配对
    if (
      (tableCandidates.some(item => item.subComponentName === validPair1.tableName) &&
        tableCandidates.some(item => item.subComponentName === validPair1.columnName))
    ) {
      matchedPair = validPair1;
    } else if (
      (tableCandidates.some(item => item.subComponentName === validPair2.tableName) &&
        tableCandidates.some(item => item.subComponentName === validPair2.columnName))
    ) {
      matchedPair = validPair2;
    }
    if (matchedPair) {
      const tableSchema = tableCandidates.find(i => i.subComponentName === matchedPair.tableName)?.schema;
      const columnSchema = tableCandidates.find(i => i.subComponentName === matchedPair.columnName)?.schema;

      if (tableSchema && columnSchema) {
        const merged = mergeTableColumns(tableSchema, columnSchema);
        processed.push({
          subComponentName: matchedPair.mergedName,
          schema: merged
        });
      } else {
        console.warn("⚠️ 表格组件配对不完整，跳过合并");
        processed.push(...tableCandidates);
      }
    } else {
      console.warn("⚠️ 表格组件配对不合法，跳过合并");
      processed.push(...tableCandidates);
    }
  } else {
    processed.push(...tableCandidates);
  }

  return processed;
}

// 定义父组件列表
const PARENT_COMPONENTS = new Set([
  "Table", "TableV2", "Splitter", "Transfer", "Form", "Carousel",
  "Collapse", "Descriptions", "Skeleton", "Timeline", "Dropdown",
  "Tour", "Anchor", "Steps", "Tabs"
]);

/**
 * 优化父组件的snippets字段
 * @param {Array} processed - 处理后的组件数组
 * @returns {Promise<Array>} 优化后的组件数组
 */
async function optimizeParentSnippets(processed) {
  console.log("🔍 开始优化父组件的snippets字段");

  // 分离父组件和子组件
  const parentComponents = processed.filter(item =>
    PARENT_COMPONENTS.has(item.subComponentName)
  );
  const childComponents = processed.filter(item =>
    !PARENT_COMPONENTS.has(item.subComponentName)
  );

  console.log(`📌 发现 ${parentComponents.length} 个父组件，${childComponents.length} 个子组件`);

  // 对每个父组件进行优化
  for (const parent of parentComponents) {
    console.log(`🔧 正在优化父组件 [${parent.subComponentName}] 的snippets字段`);

    try {
      // 调用大模型进行优化
      const optimizedSnippets = await callLLMForSnippets(parent, childComponents);

      // 更新父组件的snippets字段
      if (optimizedSnippets) {
        parent.schema.snippets = optimizedSnippets;
        console.log(`✅ 父组件 [${parent.subComponentName}] 的snippets字段优化完成`);
      } else {
        console.log(`ℹ️ 未获取到有效的优化结果，父组件 [${parent.subComponentName}] 的snippets字段保持不变`);
      }
    } catch (error) {
      console.error(`❌ 优化父组件 [${parent.subComponentName}] 的snippets字段时出错:`, error.message);
      // 出错时不修改原snippets，继续处理下一个
    }
  }

  // 合并处理后的父组件和子组件
  return [...parentComponents, ...childComponents];
}

/**
 * 调用大模型优化snippets
 * @param {Object} parent - 父组件
 * @param {Array} children - 所有子组件
 * @returns {Promise<Array>} 优化后的snippets数组
 */
async function callLLMForSnippets(parent, children, model = process.env.OPENAI_MODEL || "deepseek-reasoner") {
  // 构建子组件信息字符串
  const childrenInfo = children.map(child =>
    `子组件${child.subComponentName}的物料json为${JSON.stringify(child.schema)};`
  ).join('\n');

  // 构建系统提示
  const systemPrompt = `你是一位专业的前端组件库专家，擅长优化组件的代码片段示例。你的任务是根据提供的父组件、子组件以及规则，检验并优化父组件的snippets字段值。请确保生成的代码片段符合实际使用场景，准确体现组件的典型用法和嵌套关系。输出必须是一个可直接作为snippets值的数组，不要包含任何额外解释。`;

  // 构建用户提示
  const userPrompt = `
父组件${parent.subComponentName}的物料json为${JSON.stringify(parent.schema)};
${childrenInfo}
请你根据以下规则以及相应的子组件，给出父组件的snippets字段值。注意只需要回答一个数组，以供直接作为snippets值。
规则如下：
- 任务：为组件生成**符合实际使用场景**的有代表性、有意义的代码片段数组（snippets），准确体现组件的典型用法和嵌套关系，用于在组件面板中展示。
- 生成规则：
  - snippets 数组应包含一个默认代码片段，需完整展示组件的核心用法。
  - 每个代码片段必须包含以下字段，且配置需遵循统一要求：
    1. name.zh_CN：填写与组件定义中一致的中文名称，比如 “表格”“表单”“按钮”；
    2. icon：填写与组件定义中一致的图标标识，比如 “table”“form”“button”；
    3. screenshot：固定填空字符串（""），预留截图位置；
    4. snippetName：填写与组件定义中 component 字段一致的完整组件名，比如 “ElTable”“ElForm”；
    5. category：填写与组件定义中一致的组件库归属，比如 “element-plus”；
    6. schema：组件核心配置结构，根据物料json，可灵活包含 props（组件自身属性）和 / 或 children（子组件嵌套）。
  - schema 核心规则
    1. 结构选择
      - 容器 / 复合组件（如 ElTable、ElForm）：可单独配置 props（如表格用 data/columns 定义数据与列）、单独配置 children（如表单嵌套 ElFormItem），或两者结合，优先匹配组件原生主流用法；
      - 基础组件（如 ElButton、ElInput）：通过 props 配置业务常用属性（如按钮 type、输入框 placeholder），通过 children 承载文本或辅助组件（如按钮嵌套 Text 组件）。
    2. props 要求
      - 禁用 “请输入”“示例值” 等泛型占位符，填写真实业务场景值（如 “请输入手机号”“提交”）；
      - 复杂类型属性（数组、对象）需提供完整模拟数据（如表格 data 包含 2-4 条真实结构数据）；
      - 关联属性需严格对应（如 ElTable 的 columns.prop 与 data 中的字段名一致）。
    3. children 要求
      - 仅嵌套组件专用子组件（如 ElForm→ElFormItem、Splitter→SplitterPanel），禁止嵌套无关组件；
      - 嵌套层级符合组件原生用法（如 ElForm→ElFormItem→ElInput），子组件 props 需与父组件逻辑一致。
  - snippets 正确参考示例：
    1. ElButton 按钮示例：
      "snippets": [
        {
          "name": {
            "zh_CN": "按钮"
          },
          "icon": "button",
          "screenshot": "",
          "snippetName": "ElButton",
          "schema": {
            "children": [
              {
                "componentName": "Text",
                "props": {
                  "text": "按钮文本"
                }
              }
            ]
          },
          "category": "element-plus"
        }
      ]
    2. 表格（ElTable）示例：
      "snippets": [
        {
          "name": {
            "zh_CN": "表格"
          },
          "icon": "grid",
          "screenshot": "",
          "snippetName": "ElTable",
          "schema": {
            "props": {
              "data": [
                {
                  "date": "2016-05-03",
                  "name": "Tom",
                  "address": "No. 189, Grove St, Los Angeles"
                },
                {
                  "date": "2016-05-02",
                  "name": "Tom",
                  "address": "No. 189, Grove St, Los Angeles"
                },
                {
                  "date": "2016-05-04",
                  "name": "Tom",
                  "address": "No. 189, Grove St, Los Angeles"
                },
                {
                  "date": "2016-05-01",
                  "name": "Tom",
                  "address": "No. 189, Grove St, Los Angeles"
                }
              ],
              "columns": [
                {
                  "type": "index"
                },
                {
                  "label": "Date",
                  "prop": "date"
                },
                {
                  "label": "Name",
                  "prop": "name"
                },
                {
                  "label": "Address",
                  "prop": "address"
                }
              ]
            }
          },
          "category": "element-plus"
        }
      ]
    3. 表单（ElForm）示例：
        "snippets": [
          {
            "name": {
              "zh_CN": "表单"
            },
            "icon": "form",
            "screenshot": "",
            "snippetName": "ElForm",
            "schema": {
              "children": [
                {
                  "componentName": "ElFormItem",
                  "props": {
                    "label": "账号",
                    "prop": "account"
                  },
                  "children": [
                    {
                      "componentName": "ElInput",
                      "props": {
                        "modelValue": "",
                        "placeholder": "请输入账号"
                      }
                    }
                  ]
                },
                {
                  "componentName": "ElFormItem",
                  "props": {
                    "label": "密码",
                    "prop": "password"
                  },
                  "children": [
                    {
                      "componentName": "ElInput",
                      "props": {
                        "modelValue": "",
                        "placeholder": "请输入密码",
                        "type": "password"
                      }
                    }
                  ]
                },
                {
                  "componentName": "ElFormItem",
                  "props": {},
                  "children": [
                    {
                      "componentName": "ElButton",
                      "props": {
                        "type": "primary",
                        "style": "margin-right: 10px"
                      },
                      "children": [
                        {
                          "componentName": "Text",
                          "props": {
                            "text": "提交"
                          }
                        }
                      ]
                    },
                    {
                      "componentName": "ElButton",
                      "props": {
                        "type": "primary"
                      },
                      "children": [
                        {
                          "componentName": "Text",
                          "props": {
                            "text": "重置"
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            "category": "element-plus"
          }
        ]
`;

  console.log("🚀 正在调用OpenAI API...");
  // 调用OpenAI API
  const completion = await client.chat.completions.create({
    model: model,  // 可根据需要修改模型
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 65536
  });

  // 解析返回结果
  const responseContent = completion.choices[0].message.content.trim();

  try {
    // 尝试将返回内容解析为JSON数组
    const parsedResults = JSON.parse(responseContent);
    console.log("✅ 大模型返回的snippets结果解析成功:\n", parsedResults);
    return parsedResults;
  } catch (error) {
    console.error("❌ 解析大模型返回的snippets结果失败:", error.message);
    console.error("原始返回内容:", responseContent);
    return null;
  }
}

/**
 * 统一保存处理后的 schema 到文件
 * @param {Array} processedResults - 处理后的结果数组（含 subComponentName 和 schema）
 */
function saveProcessedSchemas(processedResults) {
  processedResults.forEach(item => {
    saveSchemaToFile(item.schema, item.subComponentName);
  });
}

/**
 * 封装保存逻辑（与原函数保持一致）
 * @param {Object|Array} schema - 已解析的JSON对象或对象数组 
 * @param {string} subComponentName - 子组件名（用于文件名区分）
 */
function saveSchemaToFile(schema, subComponentName) {
  try {
    if (!schema) throw new Error("schema 为空");

    const schemaDir = path.join(__dirname, '../post-process-log');
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
      console.log(`已创建目录：${schemaDir}`);
    }

    const timestamp = new Date().getTime();
    const components = Array.isArray(schema) ? schema : [schema];

    components.forEach((compSchema, idx) => {
      const compName = compSchema.component
        ? compSchema.component.replace(/[^a-z0-9]/gi, '-')
        : `${subComponentName}-${idx}`;
      const fileName = `${compName}-${timestamp}.json`;
      const filePath = path.join(schemaDir, fileName);

      fs.writeFileSync(filePath, JSON.stringify(compSchema, null, 2), 'utf8');
      console.log(`子组件[${subComponentName}] 保存成功：${filePath}`);
    });

  } catch (err) {
    console.error(`子组件[${subComponentName}] 保存失败：${err.message}`);
  }
}

/**
 * 读取 JSON 文件（回调式异步实现，适配普通版本 fs）
 * @param {string} filePath - 文件路径（支持相对/绝对路径）
 * @returns {Promise<object>} JSON 解析后的对象
 */
async function readJsonFile(filePath) {
  const resolvedPath = path.resolve(process.cwd(), filePath);

  // 用 Promise 包裹回调逻辑，保持外部调用方式不变（仍支持 await）
  return new Promise((resolve, reject) => {
    // 普通版本 fs.readFile：参数为「路径 + 编码 + 回调函数」
    fs.readFile(resolvedPath, 'utf8', (err, content) => {
      if (err) {
        // 读取失败：打印错误并退出进程
        console.error(`❌ 读取文件 ${resolvedPath} 失败:`, err.message);
        process.exit(1);
      }
      try {
        // 解析 JSON 并返回结果
        const jsonData = JSON.parse(content);
        resolve(jsonData);
      } catch (parseErr) {
        // JSON 解析失败：打印错误并退出进程
        console.error(`❌ 解析文件 ${resolvedPath} 的 JSON 失败:`, parseErr.message);
        process.exit(1);
      }
    });
  });
}

// 命令行直接调用示例（可选，也可通过模块导入使用）
if (require.main === module) {
  // 定义要读取的文件路径（可根据实际情况修改）
  const tableFilePath = '../schema-log/ElTable-1756438316438.json';
  const columnFilePath = '../schema-log/ElTableColumn-1756438016036.json';
  const tableV2FilePath = '../schema-log/ElTableV2-1756302838069.json';
  const v2columnFilePath = '../schema-log/ElColumn-1756302716795.json';
  const descriptionsItemPath = '../schema-log/ElDescriptionsItem-1755254976983.json';
  const linkPath = '../schema-log/ElLink-1756182017746.json';

  // 异步读取所有需要的文件并构建 conversionResults
  async function run() {
    try {
      // 1. 读取 Table 的 schema（从指定文件）
      const tableSchema = await readJsonFile(tableFilePath);
      const columnSchema = await readJsonFile(columnFilePath);
      const tableV2Schema = await readJsonFile(tableV2FilePath);
      const v2columnSchema = await readJsonFile(v2columnFilePath);
      const descriptionsItemSchema = await readJsonFile(descriptionsItemPath);
      const linkSchema = await readJsonFile(linkPath);

      // 2. 构建 conversionResults 结构，与原有逻辑兼容
      const conversionResults = [
        { subComponentName: "Table", schema: tableSchema, success: true },
        { subComponentName: "Table-column", schema: columnSchema, success: true },
        // { subComponentName: "TableV2", schema: tableV2Schema, success: true },
        // { subComponentName: "Column", schema: v2columnSchema, success: true },
        // { subComponentName: "DescriptionsItem", schema: descriptionsItemSchema, success: true },
        // { subComponentName: "Link", schema: linkSchema, success: true }
      ];

      // 3. 执行后续处理
      await postProcessSchemas(conversionResults);
    } catch (error) {
      console.error("❌ 命令行执行失败:", error.message);
      process.exit(1);
    }
  }

  // 启动执行
  run();
}

// 导出函数，供其他脚本调用
module.exports = { postProcessSchemas };