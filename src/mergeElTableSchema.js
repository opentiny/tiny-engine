require('dotenv').config({ path: '../.env' });
const { OpenAI } = require("openai");
const fs = require('fs');
const path = require('path');

// ======================== 1. 初始化依赖（复用你提供的配置）========================
// 初始化 OpenAI 客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

// 复用你提供的 schema 保存函数（无需修改）
function saveSchemaToFile(schema, subComponentName) {
  try {
    let cleanedSchema = schema.trim();
    const codeBlockRegex = /^```(json|javascript|js|)\s*([\s\S]*?)\s*```$/i;
    const match = cleanedSchema.match(codeBlockRegex);

    if (match && match[2]) {
      cleanedSchema = match[2].trim();
      console.log(`[合并结果] 已移除代码块标识`);
    } else {
      console.log(`[合并结果] 未检测到代码块标识`);
    }

    if (!cleanedSchema) {
      throw new Error(`[合并结果] 清理后 schema 为空`);
    }

    // 解析 schema 为 JSON
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(cleanedSchema);
      console.log(`[合并结果] schema 解析成功`);
    } catch (parseError) {
      const errorLogPath = path.join(__dirname, `../schema-log/parse-error-ElTable-Merged-${new Date().getTime()}.json`);
      fs.writeFileSync(errorLogPath, cleanedSchema, 'utf8');
      throw new Error(`[合并结果] schema 解析失败: ${parseError.message}，原始内容已保存至${errorLogPath}`);
    }

    // 定义保存目录
    const schemaDir = path.join(__dirname, '../schema-log');
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
      console.log(`[合并结果] 已创建 schema 保存目录：${schemaDir}`);
    }

    // 生成合并后的文件名（明确标识为“合并结果”）
    const timestamp = new Date().getTime();
    const componentName = parsedSchema.component || "ElTable-Merged";
    const fileName = `${componentName}-${timestamp}-Merged.json`;
    const filePath = path.join(schemaDir, fileName);
    const content = JSON.stringify(parsedSchema, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[合并结果] 已保存至：${filePath}`);

    return parsedSchema; // 返回解析后的 schema，供后续使用
  } catch (error) {
    console.error(`[合并结果] 保存失败：${error.message}`);
    throw error; // 抛出错误，便于上层捕获
  }
}

// ======================== 2. 核心合并函数（接收组件 JSON，调用大模型）========================
/**
 * 合并 ElTable 和 ElTableColumn 的 Schema JSON
 * @param {object} elTableSchema - ElTable 组件的完整 Schema JSON 对象（如 ElTable.schema.json 内容）
 * @param {object} elTableColumnSchema - ElTableColumn 组件的完整 Schema JSON 对象（如 ElTableColumn.schema.json 内容）
 * @param {string} model - 大模型名称（默认使用环境变量，无则用 Qwen3-32B）
 * @param {boolean} save - 是否保存合并结果到文件（默认 true）
 * @returns {Promise<object>} 合并后的 Schema JSON 对象（含原始文本）
 */
async function mergeElTableAndColumnSchema(
  elTableSchema,
  elTableColumnSchema,
  model = process.env.OPENAI_MODEL || "Qwen/Qwen3-32B",
  save = true
) {
  // 第一步：参数校验（确保输入是有效的 JSON 对象）
  if (typeof elTableSchema !== 'object' || elTableSchema === null) {
    throw new Error(`[参数错误] ElTable Schema 必须是有效的 JSON 对象，当前类型：${typeof elTableSchema}`);
  }
  if (typeof elTableColumnSchema !== 'object' || elTableColumnSchema === null) {
    throw new Error(`[参数错误] ElTableColumn Schema 必须是有效的 JSON 对象，当前类型：${typeof elTableColumnSchema}`);
  }
  if (!elTableSchema.component || !elTableSchema.component.includes('ElTable')) {
    throw new Error(`[参数错误] ElTable Schema 的 component 字段无效，需包含 "ElTable"（当前：${elTableSchema.component || '无'}）`);
  }
  if (!elTableColumnSchema.component || !elTableColumnSchema.component.includes('ElTableColumn')) {
    throw new Error(`[参数错误] ElTableColumn Schema 的 component 字段无效，需包含 "ElTableColumn"（当前：${elTableColumnSchema.component || '无'}）`);
  }

  console.log(`\n=== 开始合并 ElTable 与 ElTableColumn Schema ===`);
  console.log(`[合并配置] 大模型：${model}`);
  console.log(`[合并配置] 保存结果：${save ? '是' : '否'}`);

  // 第二步：构建大模型 Prompt（融入之前定义的合并规则 + 输入数据）
  //   const mergePrompt = `# 任务：合并 ElTable 与 ElTableColumn Schema JSON

  // ## 一、合并核心规则（基于 TinyGrid Schema 结构提炼）
  // ### 1. 合并方向与主体定位
  // - **父组件**：\`ElTable\`（表格主组件），作为合并后的根 schema，保留其原有所有配置（如 \`data\`、\`border\`、\`loading\` 等属性）。
  // - **子组件**：\`ElTableColumn\`（表格列组件），不再作为独立 schema 存在，其所有配置属性需**合并为 ElTable 的二级属性**，统一挂载在 ElTable schema 的 \`properties → [基础属性分组] → content → columns\` 字段下。

  // ### 2. 嵌套结构规范
  // #### （1）ElTable Schema 新增 \`columns\` 字段
  // 在 ElTable 的 \`schema.properties\` 中，新增一个名为 \`columns\` 的属性（参考 TinyGrid 的 \`columns\` 结构），用于承载所有 ElTableColumn 配置，字段结构要求如下：
  // | 层级                | 字段/配置项                | 说明                                                                 |
  // |---------------------|----------------------------|----------------------------------------------------------------------|
  // | 1. \`columns\`        | \`label\`                    | 中文标签：\`{ "zh_CN": "表格列" }\`，用于配置界面显示分组标题           |
  // |                     | \`description\`              | 中文描述：\`{ "zh_CN": "表格列的配置信息" }\`，说明该字段作用           |
  // |                     | \`required\`                 | 固定为 \`true\`，表格必须配置列信息                                     |
  // |                     | \`cols\`                     | 固定为 \`12\`，适配配置界面布局（参考 TinyGrid 列配置占比）             |
  // | 2. \`columns.properties\ | \`label\`              | 列配置的子分组标签：\`{ "zh_CN": "默认列分组" }\`                       |
  // |                     | \`content\`                 | **核心嵌套层**：承载原 ElTableColumn 的所有配置属性（如 \`prop\`、\`label\` 等），每个属性需保留其原有 \`type\`、\`defaultValue\`、\`widget\` 等配置 |
  // | 3. \`columns.widget\  | \`component\                | 固定为 \`ArrayItemConfigurator\`（参考 TinyGrid 列配置的数组型编辑组件），支持多列新增/编辑 |
  // |                     | \`props\`                    | 固定配置：\`{ "type": "object", "textField": "label", "language": "json", "buttonText": "编辑列配置", "title": "编辑列配置", "expand": true }\`，确保列配置可展开编辑 |

  // ### 3. ElTableColumn 属性映射规则
  // 原 ElTableColumn 的所有 schema 属性（如 \`prop\`、\`label\`、\`width\` 等），需按以下规则映射到 ElTable 的 \`columns.properties.content\` 中，保持属性原有配置不变：
  // | ElTableColumn 原有属性 | 映射后在 \`columns.content\` 中的配置要求                                                                 |
  // |-------------------------|--------------------------------------------------------------------------------------------------------|
  // | \`label\`（列标题）       | - \`property\`: "label" <br> - \`type\`: "string" <br> - \`widget\`: 保留原配置（如 \`I18nConfigurator\`）       |
  // | \`prop\`（列数据键）      | - \`property\`: "prop" <br> - \`type\`: "string" <br> - \`widget\`: 保留原配置（如 \`InputConfigurator\`）        |
  // | \`width\`（列宽）         | - \`property\`: "width" <br> - \`type\`: "string" <br> - \`widget\`: 保留原配置（如 \`NumberConfigurator\`）      |
  // | \`sortable\`（是否排序）  | - \`property\`: "sortable" <br> - \`type\`: "boolean" <br> - \`widget\`: 保留原配置（如 \`CheckBoxConfigurator\`）|
  // | 其他属性（如 \`fixed\`）  | 均按“\`property\` 名不变、\`type\`/\`widget\`/\`defaultValue\` 保留原有配置”的规则，直接迁入 \`columns.content\` |

  // ### 4. 保留与剔除规则
  // - **保留内容**：
  //   1. ElTable 原有所有 schema 配置（\`properties\` 中的 \`data\`、\`border\`、\`loading\` 等属性，\`events\` 事件配置，\`configure\` 布局配置等）；
  //   2. ElTableColumn 原有所有属性的 \`type\`、\`defaultValue\`、\`widget\`、\`description\`、\`labelPosition\` 等配置。
  // - **剔除内容**：
  //   1. 独立的 ElTableColumn schema（合并后不再存在）；
  //   2. ElTableColumn 中与 ElTable 重复的顶层配置（如 \`category\`、\`component\`、\`npm\` 等元信息，仅保留 ElTable 的元信息）。

  // ## 二、输入数据（需合并的两个 Schema JSON）
  // ### 输入 1：ElTable Schema JSON
  // ${JSON.stringify(elTableSchema, null, 2)}

  // ### 输入 2：ElTableColumn Schema JSON
  // ${JSON.stringify(elTableColumnSchema, null, 2)}

  // ## 三、输出要求
  // 1. 输出格式：**仅返回合并后的完整 JSON 对象**，无任何额外文字（如解释、注释）；
  // 2. 结构要求：根节点 \`component\` 为 \`"ElTable"\`，\`schema.properties\` 中包含新增的 \`columns\` 字段（承载 ElTableColumn 配置）；
  // 3. 完整性要求：保留 ElTable 和 ElTableColumn 的所有原有属性配置，无遗漏、无篡改；
  // 4. 语法要求：严格遵循 JSON 规范，可直接通过 \`JSON.parse\` 解析，无未闭合字段、缺失引号等错误。`;

  const mergePrompt = `# 任务：合并 ElTable 与 ElTableColumn Schema JSON

## 一、合并核心规则（基于 TinyGrid Schema 结构提炼，补充列属性去分组规则）
### 1. 合并方向与主体定位
- **父组件**：\`ElTable\`（表格主组件），作为合并后的合并后的根 schema，保留其原有所有配置（如 \`data\`、\`border\`、\`loading\` 等属性，包括 \`schema.properties\` 中的原有分组、\`events\` 事件、\`configure\` 布局等）。
- **子组件**：\`ElTableColumn\`（表格列组件），不再作为独立 schema 存在，其所有配置属性需**合并为 ElTable 的二级属性**，统一挂载在 ElTable schema 的 \`properties → [基础属性分组] → content → columns\` 字段下。


### 2. 嵌套结构规范（重点补充列属性去分组逻辑）
#### （1）ElTable Schema 新增 \`columns\` 字段
在 ElTable 的 \`schema.properties\` 中，新增一个名为 \`columns\` 的属性（参考 TinyGrid 的 \`columns\` 结构），用于承载所有 ElTableColumn 配置，字段结构要求如下：

| 层级                  | 字段/配置项                | 说明                                                                 |
|-----------------------|----------------------------|----------------------------------------------------------------------|
| 1. \`columns\`          | \`label\`                    | 中文标签：\`{ "text": { "zh_CN": "表格列" } }\`（与示例格式对齐），用于配置界面显示标题 |
|                       | \`description\`              | 中文描述：\`{ "zh_CN": "表格列的配置信息" }\`，说明该字段作用           |
|                       | \`required\`                 | 固定为 \`true\`，表格必须配置列信息                                     |
|                       | \`readOnly\`                 | 固定为 \`false\`，允许编辑列配置                                       |
|                       | \`disabled\`                 | 固定为 \`false\`，允许操作列配置                                       |
|                       | \`cols\`                     | 固定为 \`12\`，适配配置界面布局（占满一行）                             |
| 2. \`columns.properties\ | \`label\`              | 列配置的唯一子分组标签：\`{ "zh_CN": "默认分组" }\`（**必须保留此分组，不新增其他分组**） |
|                       | \`content\`                 | **核心嵌套层**：承载原 ElTableColumn 的**所有属性（去分组后）**，具体要求：<br>① 原 ElTableColumn 的 \`properties\` 下的所有分组，需提取所有分组的 \`content\` 数组，合并为一个数组；<br>② 合并后的数组直接作为 \`columns.properties.content\` 的值，**不保留原分组结构**；<br>③ 每个属性需完整保留原有配置（\`property\` 名、\`type\`、\`defaultValue\`、\`widget\`、\`label\`、\`description\`、\`labelPosition\` 等，无遗漏） |
| 3. \`columns.widget\    | \`component\`                | 固定为 \`ArrayItemConfigurator\`（参考示例，支持多列新增/编辑）         |
|                       | \`props\`                    | 固定配置：\`{ "type": "object", "textField": "label", "language": "json", "buttonText": "编辑列配置", "title": "编辑列配置", "expand": true }\`（与示例完全一致，确保可展开编辑） |
| 4. \`columns.labelPosition\ | -                    | 固定为 \`left\`（与示例格式对齐）                                       |


### 3. ElTableColumn 属性映射规则
原 ElTableColumn 的所有 schema 属性，需按以下规则映射到 \`columns.properties.content\` 中，**不修改任何属性自身配置**：
- 所有属性的 \`property\` 名称保持不变
- 所有属性的 \`type\`、\`defaultValue\`、\`widget\` 配置保持不变
- 所有属性的 \`label\`、\`description\`、\`labelPosition\` 等描述信息保持不变
- 所有属性的 \`required\`、\`readOnly\`、\`disabled\`、\`cols\` 等控制属性保持不变


### 4. 保留与剔除规则（补充去分组细节）
- **保留内容**：
  1. ElTable 原有所有 schema 配置（\`properties\` 中的原有分组、\`events\` 事件、\`configure\` 布局、\`snippets\` 等）；
  2. ElTableColumn 的所有属性的完整配置（去分组后，每个属性的所有配置项均不修改）。
- **剔除内容**：
  1. 独立的 ElTableColumn schema（合并后不再存在）；
  2. ElTableColumn 中 \`properties\` 下的所有分组结构（仅保留分组内的 \`content\` 属性数组，合并为一个数组）；
  3. ElTableColumn 中与 ElTable 重复的顶层配置（如 \`category\`、\`component\`、\`npm\` 等元信息，仅保留 ElTable 的元信息）。


## 二、输入数据（需合并的两个 Schema JSON）
### 输入 1：ElTable Schema JSON
${JSON.stringify(elTableSchema, null, 2)}

### 输入 2：ElTableColumn Schema JSON
${JSON.stringify(elTableColumnSchema, null, 2)}


## 三、输出要求（补充格式对齐细节）
1. **格式要求**：仅返回合并后的完整 JSON 对象，无任何额外文字（如解释、注释、代码块标识），确保可直接通过 \`JSON.parse\` 解析；
2. **结构要求**：
   - 根节点 \`component\` 必须为 \`"ElTable"\`；
   - ElTable 的 \`schema.properties\` 中需包含原有基础属性分组，且该分组的 \`content\` 中新增 \`columns\` 字段（结构与示例完全对齐）；
   - \`columns.properties.content\` 必须是 ElTableColumn 去分组后的属性数组（无分组嵌套）；
3. **完整性要求**：
   - 不遗漏 ElTable 的任何原有配置；
   - 不遗漏 ElTableColumn 的任何属性，且每个属性的配置与输入完全一致（无篡改）；
4. **示例对齐要求**：\`columns\` 字段的 \`label\` 格式、\`widget.props\` 配置、\`labelPosition\` 等，需与以下示例片段完全一致：
   {
     "property": "columns",
     "label": {
       "text": {
         "zh_CN": "表格列"
       }
     },
     "required": true,
     "readOnly": false,
     "disabled": false,
     "cols": 12,
     "properties": [
       {
         "label": {
           "zh_CN": "默认分组"
         },
         "content": [
           // 此处为 ElTableColumn 去分组后的所有属性数组
         ]
       }
     ],
     "widget": {
       "component": "ArrayItemConfigurator",
       "props": {
         "type": "object",
         "textField": "label",
         "language": "json",
         "buttonText": "编辑列配置",
         "title": "编辑列配置",
         "expand": true
       }
     },
     "description": {
       "zh_CN": "表格列的配置信息"
     },
     "labelPosition": "left"
   }
`;

  // 第三步：构建大模型请求消息
  const messages = [
    {
      role: "system",
      content: "你是专业的组件 Schema 合并工具，严格遵循给定的合并规则，将 ElTableColumn Schema 合并为 ElTable 的二级属性（columns 字段），仅输出合并后的 JSON 对象，无额外内容。"
    },
    {
      role: "user",
      content: mergePrompt
    }
  ];

  // 第四步：调用大模型获取合并结果
  console.log(`[合并中] 正在调用大模型生成合并结果...`);
  let completion;
  try {
    completion = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.1, // 低温度，确保严格遵循规则
      max_tokens: 20480, // 足够长度容纳复杂 Schema
      // timeout: 300000, // 5分钟超时（避免大模型处理超时）
    });
  } catch (apiError) {
    throw new Error(`[大模型调用失败] ${apiError.message}（请检查 API Key、baseURL 或网络连接）`);
  }

  // 第五步：处理大模型返回结果
  const rawSchemaText = completion.choices[0].message.content?.trim() || "";
  if (!rawSchemaText) {
    throw new Error(`[大模型返回错误] 未获取到合并后的 Schema 内容`);
  }
  console.log(`[合并中] 已获取大模型返回结果，开始清理和解析...`);

  // 第六步：保存结果（若开启保存）
  let mergedSchema = null;
  if (save) {
    mergedSchema = saveSchemaToFile(rawSchemaText, "ElTable-Merged");
  } else {
    // 不保存时仅解析，不写入文件
    let cleanedSchema = rawSchemaText.trim();
    const codeBlockRegex = /^```(json|javascript|js|)\s*([\s\S]*?)\s*```$/i;
    const match = cleanedSchema.match(codeBlockRegex);
    if (match && match[2]) cleanedSchema = match[2].trim();
    mergedSchema = JSON.parse(cleanedSchema);
    console.log(`[合并结果] 已解析合并后的 Schema（未保存文件）`);
  }

  console.log(`\n=== ElTable 与 ElTableColumn Schema 合并完成 ===`);
  return {
    mergedSchema: mergedSchema, // 解析后的合并 Schema 对象
    rawSchemaText: rawSchemaText // 大模型返回的原始文本（含代码块标识）
  };
}

// ======================== 3. 主函数（命令行入口，支持从文件读取输入）========================
/**
 * 主函数：从文件读取 ElTable 和 ElTableColumn Schema，执行合并
 * 命令行使用示例：node mergeElTableSchema.js ./ElTable.schema.json ./ElTableColumn.schema.json
 */
async function main() {
  try {
    // 读取命令行参数（获取两个 Schema 文件路径）
    const [elTableSchemaPath, elTableColumnSchemaPath] = process.argv.slice(2);
    if (!elTableSchemaPath || !elTableColumnSchemaPath) {
      console.error(`[命令行参数错误] 请提供 ElTable 和 ElTableColumn 的 Schema 文件路径`);
      console.log(`[使用示例] node mergeElTableSchema.js ./ElTable.schema.json ./ElTableColumn.schema.json`);
      process.exit(1);
    }

    // 读取 ElTable Schema 文件
    let elTableSchema;
    try {
      const elTableContent = fs.readFileSync(elTableSchemaPath, 'utf8');
      elTableSchema = JSON.parse(elTableContent);
      console.log(`[文件读取] 成功读取 ElTable Schema：${elTableSchemaPath}`);
    } catch (readError) {
      throw new Error(`[文件读取失败] ElTable Schema 文件 ${elTableSchemaPath}：${readError.message}`);
    }

    // 读取 ElTableColumn Schema 文件
    let elTableColumnSchema;
    try {
      const elColumnContent = fs.readFileSync(elTableColumnSchemaPath, 'utf8');
      elTableColumnSchema = JSON.parse(elColumnContent);
      console.log(`[文件读取] 成功读取 ElTableColumn Schema：${elTableColumnSchemaPath}`);
    } catch (readError) {
      throw new Error(`[文件读取失败] ElTableColumn Schema 文件 ${elTableColumnSchemaPath}：${readError.message}`);
    }

    // 执行合并
    await mergeElTableAndColumnSchema(elTableSchema, elTableColumnSchema);

  } catch (error) {
    console.error(`\n[整体合并流程失败] ${error.message}`);
    process.exit(1);
  }
}

// ======================== 4. 导出与执行 ========================
// 命令行直接运行时执行主函数
if (require.main === module) {
  main();
}

// 对外导出核心合并函数（供其他脚本调用）
module.exports = {
  mergeElTableAndColumnSchema,
  saveSchemaToFile // 可选导出，供外部复用保存功能
};