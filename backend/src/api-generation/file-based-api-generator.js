/**
 * 分析组件API文件，提取props/events/slots等信息，生成结构化JSON
 * 依赖component-api-analyzer.js筛选出的filteredFiles列表
 */

const fs = require("fs");
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const { OpenAI } = require("openai");
// 导入上一个脚本的核心分析函数
const { filterAndConcatApiCodeFiles, filterAndConcatUploadedApiSource } = require("../file-collection/component-code-file-filter.js");
const { filterAndConcatApiNpmFiles, filterAndConcatNpmApiByPackage } = require("../file-collection/component-npm-file-filter.js");

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  timeout: 600000, // 10分钟超时
});

/**
 * 清理大模型返回内容并提取标准JSON字符串
 * @param {string} responseText - 大模型返回的原始文本
 * @returns {string} 清理后的标准JSON字符串
 * @throws {Error} 若无法从返回内容中提取有效JSON，抛出错误
 */
function cleanAndExtractJson(responseText) {
  if (typeof responseText !== 'string' || responseText.trim() === '') {
    throw new Error('大模型返回内容为空或非字符串');
  }

  let cleanContent = responseText.trim();

  // 移除代码块标记（支持 ```json、``` 等格式）
  const codeBlockRegex = /^```(json|javascript|js|)\s*([\s\S]*?)\s*```$/i;
  const codeBlockMatch = cleanContent.match(codeBlockRegex);

  // 如果匹配到代码块，提取内部的JSON内容
  if (codeBlockMatch && codeBlockMatch[2]) {
    cleanContent = codeBlockMatch[2].trim();
  }

  // 校验JSON格式
  try {
    JSON.parse(cleanContent);
  } catch (parseError) {
    throw new Error(`提取的JSON存在语法错误：${parseError.message}\n错误JSON内容：${cleanContent.slice(0, 200)}...`);
  }

  return cleanContent;
}

/**
 * 调用大模型综合分析所有文件内容，生成结构化API JSON
 * @param {string} combinedContent - 所有文件的拼接内容（含路径标识）
 * @returns {Promise<Array<Object>>} 组件 API 数组，每个元素是一个组件的完整 JSON 对象
 */
async function generateApiJsonWithLLM(combinedContent) {
  // 新增：校验OpenAI客户端配置
  if (!client.apiKey || client.apiKey.trim() === "") {
    throw new Error("OpenAI API Key未配置，请在.env文件中设置OPENAI_API_KEY");
  }
  if (!client.baseURL || client.baseURL.trim() === "") {
    throw new Error("OpenAI baseURL未配置，请在.env文件中设置OPENAI_BASE_URL");
  }

  // 2. 测试接口连通性（新增）
  try {
    console.log(`🔍 测试连接${client.baseURL}...`);
    const testResponse = await fetch(client.baseURL + "/models", {
      headers: {
        "Authorization": `Bearer ${client.apiKey}`,
        "Content-Type": "application/json"
      }
    });
    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      throw new Error(`接口连接失败：${testResponse.statusText}，错误信息：${JSON.stringify(errorData)}`);
    }
    console.log("✅ 接口连接成功！");
  } catch (testError) {
    throw new Error(`❌ 大模型接口连接失败：${testError.message}，请检查API Key、baseURL或网络`);
  }

  // 构造强约束Prompt，确保大模型输出符合要求的格式
  const promptMessages = [
    {
      role: "system",
      content: `你是通用UI组件库源码分析专家，需基于提供的组件入口文件（index.js/ts）及源码，精准识别对外暴露的独立组件，并为每个组件生成独立JSON对象。`
    },
    {
      role: "user",
      content: `请基于以下UI组件库的组件源码（含入口文件index.js/ts），按规则精准识别所有独立组件，并生成独立JSON数组：

  请严格按以下规则执行，适配所有主流UI组件库（如Element Plus、Ant Design Vue等）：
  
  ### 一、核心目标：仅识别“对外暴露的独立可使用组件”
  独立组件指：在入口文件中通过**类型定义标注为可安装/可使用组件**，且**明确对外暴露**的组件；排除仅内部依赖、未对外暴露的组件（如内部工具组件、面板组件）。
  
  
  ### 二、独立组件识别的通用规则（按优先级判断）
  #### 优先级1：通过“组件注册函数+类型定义”标注的组件（最通用）
  - 若组件同时满足以下两个条件，视为独立组件：
    1. 存在“组件注册函数”处理（如Element Plus的\`withInstall\`、Ant Design Vue的\`defineComponent\`+\`install\`）；
    2. 存在明确的组件类型定义（如\`SFCWithInstall\`、\`DefineComponent\`等类型注解）；
  - 示例：\`export const ElTable: SFCWithInstall<typeof Table> = withInstall(Table)\` → 独立组件。
  
  #### 优先级2：组件注册函数的关联组件（多组件打包场景）
  - 若组件注册函数的参数中包含关联组件对象（如\`withInstall(Table, { TableColumn })\`），则：
    - 注册函数的第一个参数（如\`Table\`）视为独立组件；
    - 参数中的关联组件（如\`TableColumn\`）也视为独立组件；
  - 示例：Table与TableColumn均为独立组件。
  
  #### 优先级3：排除规则（以下情况不视为独立组件）
  1. 仅import导入但未通过“注册函数+类型定义”处理的组件（如TimePicker入口的\`CommonPicker\`、\`TimePickPanel\`）；
  2. 仅通过\`export { XXX }\`暴露但无注册/类型标注的组件；
  3. 类型定义文件、工具函数、样式文件、常量等非组件模块；
  4. 组件内部的辅助函数或子模块（如\`src / utils\`、\`src / constants\`）。
  
  
  ### 三、组件名定义规则
  - 组件名以**入口文件中对外暴露的变量名**为准（包括前缀，不做任何修改）；
  - 示例1：\`export const ElTable = withInstall(Table)\` → 组件名"ElTable"；
  - 示例2：\`export const Button = defineComponent({...})\` → 组件名"Button"；
  - 示例3：\`export default withInstall(Input)\` → 若默认导出无变量名，取组件源码中的\`name\`属性（如\` < template > <div name="ElInput"></div></template > \` → 组件名"ElInput"）。
  
  
  ### 四、每个独立组件的JSON格式要求（详细版）
  每个独立组件必须生成包含以下字段的完整JSON对象，**无对应内容时严格按规则填充空值**：
  
  1. 【顶层\`name\`字段】：格式为“组件变量名 + 中文名称”，例如组件变量名为"ElAvatar"时，填"Avatar 头像"；若无法确定中文名称，填“组件变量名”（如"Badge"）。若组件变量名有组件库前缀标识，则使用 **移除组件库前缀标识** 后的组件名（如 "ElForm"→"Form"、"ElButton"→"Button"）；若无前缀标识，则使用原始组件变量名（如"Input"→"Input"）。
  2. 【顶层\`description\`字段】：组件功能描述，优先从源码注释提取；无注释时填组件的通用功能描述（如"徽章组件，用于显示通知数量或状态标记"）；禁止填空字符串。
  3. 【\`components\`内键名】：若组件变量名有组件库前缀标识，则使用 **移除组件库前缀标识** 后的组件名（如 "ElForm"→"Form"、"ElButton"→"Button"）；若无前缀标识，则使用原始组件变量名（如"Input"→"Input"）。

  #### 整体结构
  每个独立组件均对应一个**JSON对象**，结构如下：
  {
    "name": "处理后组件名+中文名称",  // 顶层字段：如"Avatar 头像"
    "description": "组件功能描述",   // 顶层字段：非空字符串
    "components": {                 // 顶层字段：存放所有独立组件
      "处理后组件变量名": {              // 键名=移除前缀后的组件名（如"Form"）
        "properties": [],           // 必选：属性列表（无则空数组）
        "events": [],               // 必选：事件列表（无则空数组）
        "slots": [],                // 必选：插槽列表（无则空数组）
        "methods": []               // 必选：方法列表（无则空数组）
      }
    }
  }
  
  
  #### \`组件变量名\`对象的各子字段详细规范
  
  ##### 1. \`properties\`（属性列表）
  - **数组项类型**：对象（无属性时填空数组\`[]\`）
  - **提取优先级**：优先从组件显式定义的Props配置中提取（如Vue组件的\`props\`选项、React组件的\`interface Props\`定义等），示例：
    \`\`\`javascript
    // 优先从这类Props配置中提取属性信息（以checkbox为例）
    export const checkboxProps = {
      /**
       * @description binding value
       */
      modelValue: {
        type: [Number, String, Boolean],
        default: undefined,
      },
      // ...其他属性
    }
    \`\`\`
  - **每个属性项必须包含以下字段**：
    | 子字段名         | 类型     | 说明及空值处理                                                                 |
    |------------------|----------|------------------------------------------------------------------------------|
    | \`name\`         | string   | 必选。属性名（如"size"、"disabled"），严格匹配源码中的定义（区分大小写）          |
    | \`description\`  | string   | 必选。属性功能描述，优先提取源码注释原文；无注释时填""（空字符串）                |
    | \`type\`         | string   | 必选。属性类型：<br>- 单个类型直接填写（如"string"、"number"、"boolean"、"enum"、"object"、"array"）；<br>- 多个类型需用"|"分隔全部列出（如"string | number"、"boolean | object"）；<br>- 无法确定时填"unknown"  |
    | \`default\`      | any      | 必选。属性默认值：<br>- 有默认值时填实际值（如\`"small"\`、\`true\`、\`[]\`、\`{}\`）；<br>- 无默认值或源码未明确时，**必须填\`null\`**（不可填""或"undefined"）；<br>- 注意：布尔值默认值需用\`true\`/\`false\`（非字符串），数字默认值用数字类型 |
    | \`enumOptions\`  | array    | 必选。枚举值列表：<br>- 仅当\`type\`为"enum"时填写具体值（如\`["primary", "success"]\`）；<br>- 非枚举类型时，**必须填空数组\`[]\`**（不可省略） |
  
  
  ##### 2. \`events\`（事件列表）
  - **数组项类型**：对象（无事件时填空数组\`[]\`）
  - **每个事件项必须包含以下字段**：
    | 子字段名          | 类型     | 说明及空值处理                                                                 |
    |-------------------|----------|------------------------------------------------------------------------------|
    | \`name\`          | string   | 必选。事件名（如"change"、"click"），严格匹配源码中的触发名称（区分大小写）      |
    | \`description\`   | string   | 必选。事件触发时机描述，优先提取源码注释；无注释时填""（空字符串）                |
    | \`functionParams\`| string   | 必选。事件回调的参数类型描述：<br>- 有参数时填类型定义（如\`"(value: string, index: number) => void"\`）；<br>- 无参数时填\`"() => void"\`；<br>- 无法确定时填\`"(...args: any[]) => void"\` |
  
  
  ##### 3. \`slots\`（插槽列表）
  - **数组项类型**：对象（无插槽时填空数组\`[]\`）
  - **每个插槽项必须包含以下字段**：
    | 子字段名         | 类型     | 说明及空值处理                                                                 |
    |------------------|----------|------------------------------------------------------------------------------|
    | \`name\`         | string   | 必选。插槽名：<br>- 默认插槽固定填"default"；<br>- 具名插槽填实际名称（如"header"、"footer"） |
    | \`description\`  | string   | 必选。插槽用途描述，优先提取源码注释；无注释时填""（空字符串）                  |
    | \`props\`        | string   | 必选。插槽接收的参数类型：<br>- 有参数时填类型定义（如\`"{ row: object, index: number }"\`）；<br>- 无参数时填""（空字符串） |
  
  
  ##### 4. \`methods\`（方法列表）
  - **数组项类型**：对象（无方法时填空数组\`[]\`）
  - **每个方法项必须包含以下字段**：
    | 子字段名          | 类型     | 说明及空值处理                                                                 |
    |-------------------|----------|------------------------------------------------------------------------------|
    | \`name\`          | string   | 必选。方法名（如"focus"、"clear"），严格匹配源码中的定义（区分大小写）          |
    | \`description\`   | string   | 必选。方法功能描述，优先提取源码注释；无注释时填""（空字符串）                  |
    | \`functionParams\`| string   | 必选。方法回调的参数类型描述：<br>- 有参数时填类型定义（如\`"(value: string, index: number) => void"\`）；<br>- 无参数时填\`"() => void"\`；<br>- 无法确定时填\`"(...args: any[]) => void"\` |
  
  ##### 5. \`exposes\`（暴露列表）
  - **数组项类型**：对象（无方法时填空数组\`[]\`）
  - **每个方法项必须包含以下字段**：
    | 子字段名          | 类型     | 说明及空值处理                                                                 |
    |-------------------|----------|------------------------------------------------------------------------------|
    | \`name\`          | string   | 必选。暴露名（如"setCurrentValue"），严格匹配源码中的定义（区分大小写）          |
    | \`description\`   | string   | 必选。暴露功能描述，优先提取源码注释；无注释时填""（空字符串）                  |
    | \`functionParams\`| string   | 必选。暴露回调的参数类型描述：<br>- 有参数时填类型定义（如\`"(value: number) => void"\`）；<br>- 无参数时填\`"() => void"\`；<br>- 无法确定时填\`"(...args: any[]) => void"\` |
  
  
  ### 五、输出格式要求
  1. 最终仅返回**JSON数组**，数组的每个元素对应一个独立组件的JSON对象；
  2. 若仅识别到1个独立组件，数组仅含1个元素；若识别到多个，按组件名首字母排序；
  3. 输出格式：仅返回纯JSON对象，不包含任何多余内容（如解释、注释、json代码块标记）；
  4. 禁止在JSON前后添加任何文字，直接以{开头、}结尾；
  5. 确保JSON格式标准，键名用双引号，逗号分隔正确。

  源码文件内容：
  \`\`\`
  ${combinedContent}
  \`\`\`
  
  特别提醒：
  1. 严格按“注册函数+类型定义”规则识别，排除内部依赖组件；
  2. 组件名保留对外暴露的原始变量名（包括前缀），不做修改；
  3. 适配通用组件库逻辑，不局限于单一库的规范。`
    }
  ];

  try {
    console.log("🤖 正在调用大模型综合分析API信息...");
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "Qwen/Qwen3-32B",
      messages: promptMessages,
      temperature: 0.1, // 极低温度确保格式准确、结果稳定
      max_tokens: 65536, // 足够长度容纳完整API结构
      // response_format: { type: "json_object" } // 强制返回JSON（部分模型支持）
    });

    const rawResponse = completion.choices[0].message.content.trim();
    // console.log("📜 大模型完整原始返回：", rawResponse);

    // 清理并提取JSON（调用封装的函数）
    const cleanJsonText = cleanAndExtractJson(rawResponse);

    // 3. 解析为JSON对象并返回
    const apiData = JSON.parse(cleanJsonText);
    console.log("✅ 大模型生成API JSON解析成功！");

    // 补全缺失的顶级字段（避免大模型遗漏）
    return apiData;
  } catch (error) {
    console.error("❌ 大模型生成API JSON失败：", error.message);
    if (typeof rawResponse !== 'undefined') {
      console.error("📜 大模型完整原始返回：", rawResponse);
    } else {
      console.error("📜 大模型未返回内容（错误发生在请求前）");
    }
    throw error;
  }
}

/**
 * 保存API JSON到指定目录，文件名格式为“组件名-时间戳.json”
 * @param {string} componentName - 组件名（用于生成文件名）
 * @param {Object} apiJson - 要保存的结构化API JSON数据
 * @param {string} [baseDir="../code-to-api-json-log-2"] - 保存的基础目录（默认上级目录的code-to-api-json-log-2）
 * @returns {string} 保存的文件绝对路径
 */
function saveApiJsonToFile(componentName, apiJson, baseDir = "../code-to-api-json-log-2") {
  try {
    // 1. 生成时间戳（格式：YYYYMMDDHHmmss，避免特殊字符）
    const timestamp = new Date().toISOString()
      .replace(/[-T:\.Z]/g, "")
      .slice(0, 14); // 保留到秒级，如20240520143025

    // 2. 构建文件名：组件名-时间戳.json（移除组件名中可能的特殊字符）
    const safeComponentName = componentName.replace(/[^\w\u4e00-\u9fa5]/g, "-"); // 只保留字母、数字、中文、横线
    const fileName = `${safeComponentName}-${timestamp}.json`;

    // 3. 构建完整保存路径（确保目录存在）
    const saveDir = path.resolve(baseDir);
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true }); // 递归创建目录（支持多级目录）
      console.log(`📂 已创建保存目录：${saveDir}`);
    }
    const savePath = path.join(saveDir, fileName);

    // 4. 写入JSON文件（格式化输出，缩进2个空格）
    fs.writeFileSync(savePath, JSON.stringify(apiJson, null, 2), "utf-8");
    return savePath;
  } catch (error) {
    console.error("❌ 保存API JSON文件失败：", error.message);
    throw new Error("文件保存失败，请检查目录权限或路径合法性");
  }
}

/**
 * 遍历组件API数组，为每个元素单独保存为JSON文件
 * @param {Array<Object>} apiArray - 组件API数组（每个元素含name、description、components字段）
 * @param {string} [baseDir] - 保存的基础目录
 * @returns {Array<string>} 所有生成文件的绝对路径列表
 * @throws {Error} 若输入不是数组或数组元素格式错误，抛出错误
 */
function saveApiArrayToFiles(apiArray, baseDir) {
  // 1. 校验输入是否为数组
  if (!Array.isArray(apiArray)) {
    throw new Error("输入必须是组件API数组，无法保存文件");
  }
  if (apiArray.length === 0) {
    console.warn("⚠️  组件API数组为空，无需生成文件");
    return [];
  }

  // 2. 处理保存目录（转为绝对路径，确保目录存在）
  const saveDir = path.resolve(baseDir);
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true }); // 递归创建多级目录
    console.log(`📂 已创建保存目录：${saveDir}`);
  }

  // 3. 生成统一时间戳（确保同一批组件的时间戳一致）
  const timestamp = new Date().toISOString()
    .replace(/[-T:\.Z]/g, "")
    .slice(0, 14); // 格式：20250904153025（年月日时分秒）

  // 4. 遍历数组，为每个组件生成文件
  const savedFilePaths = [];
  apiArray.forEach((componentItem, index) => {
    try {
      // 4.1 从新结构中提取组件名（components对象的唯一键）
      const componentKeys = Object.keys(componentItem.components || {});
      if (componentKeys.length === 0) {
        throw new Error(`第${index + 1}个元素的components对象为空`);
      }
      // 取第一个组件键作为文件名（每个元素应只包含一个组件）
      const componentName = componentKeys[0];

      // 4.2 生成安全的文件名（移除特殊字符，避免路径错误）
      const safeComponentName = componentName.replace(/[^\w\u4e00-\u9fa5-]/g, "-");
      const fileName = `${safeComponentName}-api-${timestamp}.json`;
      const savePath = path.join(saveDir, fileName);

      // 4.3 写入文件（格式化JSON，缩进2个空格，便于阅读）
      fs.writeFileSync(savePath, JSON.stringify(componentItem, null, 2), 'utf-8');

      // 4.4 记录保存路径
      savedFilePaths.push(savePath);
      console.log(`✅ 已保存组件 ${componentName} 到：${savePath}`);
    } catch (itemError) {
      console.error(`⚠️  第${index + 1}个组件保存失败：${itemError.message}，跳过该元素`);
    }
  });

  return savedFilePaths;
}

/**
 * 主函数：串联筛选文件→读取内容→大模型分析→生成JSON
 * @param {string} target - 组件根目录路径或npm包名
 * @param {string} [sourceType="code"] - 来源类型，可选值："code"或"npm"
 * @param {string} [componentName] - 组件名(仅npm类型需要)
 * @returns {Promise<Array<Object>>} 最终的结构化API JSON数组
 */
async function generateComponentApiJson(target, sourceType = "code", componentName) {
  try {
    if (!["code", "npm"].includes(sourceType)) {
      throw new Error(`无效的来源类型: ${sourceType}，必须是"code"或"npm"`);
    }

    let combinedContent, componentInfo, componentDir;
    
    console.log(`1/3 🔍 正在从${sourceType === 'code' ? '源码' : 'NPM包'}筛选并拼接API文件...`);
    if (sourceType === "code") {
      // 处理本地源码目录
      const result = await filterAndConcatApiCodeFiles(target);
      combinedContent = result.combinedContent;
      componentDir = target;
      componentInfo = {
        type: "single",
        name: result.componentName
      };
    } else {
      // 处理npm包
      const result = await filterAndConcatNpmApiByPackage(target, componentName);
      combinedContent = result.combinedContent;
      componentDir = result.componentDir;
      componentInfo = {
        type: "multiple",
        names: result.componentNames
      };
    }

    if (!combinedContent || combinedContent.length === 0) {
      throw new Error("API文件内容拼接为空，无法生成JSON");
    }

    console.log("\n2/3 🤖 正在生成结构化API JSON...");
    const finalApiJson = await generateApiJsonWithLLM(combinedContent);

    const apiArray = Array.isArray(finalApiJson) ? finalApiJson : [finalApiJson];

    console.log(`\n🎉 结构化API生成完成！`);
    console.log(`- 组件目录：${componentDir}`);
    if (componentInfo.type === "single") {
      console.log(`- 组件名称：${componentInfo.name}`);
    } else {
      console.log(`- 识别到组件：${componentInfo.names.join(", ")}`);
    }

    return apiArray;
  } catch (error) {
    console.error("\n❌ 生成组件API JSON失败：", error.message);
    throw error;
  }
}

/**
 * 处理前端上传的单个文件或压缩包的入口函数
 * 适配新的filterAndConcatUploadedApiSource函数参数和返回值
 * @param {Object} uploadData - 上传数据对象
 * @param {Buffer} uploadData.data - 单个文件或压缩包的二进制数据
 * @param {string} uploadData.type - 上传类型："single"（单个文件）、"zip"（压缩包）
 * @param {string} uploadData.fileName - 原始文件名（含扩展名）
 * @returns {Promise<Array<Object>>} 最终的结构化API JSON数组
 */
async function generateComponentApiFromUploadedSource(uploadData) {
  try {
    // 1. 验证上传数据格式
    if (!uploadData || !uploadData.data || !uploadData.type || !uploadData.fileName) {
      throw new Error("上传数据不完整：需包含data（二进制）、type（类型）、fileName（文件名）");
    }
    if (!["single", "zip"].includes(uploadData.type)) {
      throw new Error(`无效的上传类型: ${uploadData.type}，仅支持"single"或"zip"`);
    }

    console.log(`1/3 📥 正在处理上传的${uploadData.type === 'single' ? '文件' : '压缩包'}: ${uploadData.fileName}...`);
    
    // 2. 调用新的筛选+拼接函数（原filterAndConcatUploadedApiCodeFiles已替换）
    const result = await filterAndConcatUploadedApiSource(uploadData, 3);
    const { combinedContent, componentName, tempDir } = result;

    if (!combinedContent || combinedContent.length === 0) {
      throw new Error("上传文件内容拼接为空，无法生成JSON");
    }

    // 3. 复用原有大模型生成逻辑
    console.log("\n2/3 🤖 正在生成结构化API JSON...");
    const finalApiJson = await generateApiJsonWithLLM(combinedContent);
    const apiArray = Array.isArray(finalApiJson) ? finalApiJson : [finalApiJson];

    // 4. 生成完成后清理临时目录
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`✅ 已清理临时目录: ${tempDir}`);
    } catch (cleanupError) {
      console.warn(`⚠️ 临时目录清理失败: ${cleanupError.message}，请手动清理：${tempDir}`);
    }

    // 5. 输出结果日志
    console.log(`\n🎉 结构化API生成完成！`);
    console.log(`- 组件名称：${componentName}`);

    return apiArray;
  } catch (error) {
    console.error("\n❌ 生成上传文件的API JSON失败：", error.message);
    throw error;
  }
}


/**
 * 处理npm包名和组件名，生成API JSON
 * @param {string} packageName - npm包名 (如: element-plus)
 * @param {string} componentName - 组件名 (如: affix)
 * @returns {Promise<Array<Object>>} 最终的结构化API JSON数组
 */
async function generateComponentApiFromNpmPackage(packageName, componentName) {
  try {
    console.log(`1/3 📦 正在处理npm包: ${packageName}，组件: ${componentName}...`);
    
    // 1. 调用npm包的筛选+拼接函数
    const result = await filterAndConcatNpmApiByPackage(packageName, componentName);
    const { combinedContent, componentNames, componentDir } = result;

    if (!combinedContent || combinedContent.length === 0) {
      throw new Error("npm包文件内容拼接为空，无法生成JSON");
    }

    // 2. 复用大模型生成逻辑
    console.log("\n2/3 🤖 正在生成npm包组件的结构化API JSON...");
    const finalApiJson = await generateApiJsonWithLLM(combinedContent);
    const apiArray = Array.isArray(finalApiJson) ? finalApiJson : [finalApiJson];

    // 3. 输出结果日志
    console.log(`\n🎉 npm包组件API生成完成！`);
    console.log(`- 识别到组件：${componentNames.join(", ")}`);
    console.log(`- 组件目录：${componentDir}`);

    return apiArray;
  } catch (error) {
    console.error("\n❌ 生成npm包组件的API JSON失败：", error.message);
    throw error;
  }
}

/**
 * 命令行执行入口
 */
async function main() {
  // 调整参数顺序：[来源类型] <包名/目录> [组件名(仅npm类型需要)]
  const sourceType = process.argv[2] || "code"; // 来源类型作为第一个参数
  const target = process.argv[3];              // 包名或目录作为第二个参数
  const componentName = process.argv[4];       // 组件名作为第三个参数(仅npm类型需要)

  // 参数验证
  if (!target) {
    console.error("请提供组件源码目录或npm包名，例如：");
    console.error("node file-based-api-generator.js [来源类型(code|npm)] <组件目录|npm包名> [组件名(仅npm需要)]");
    console.error("示例1: node file-based-api-generator.js code ./components/form");
    console.error("示例2: node file-based-api-generator.js npm element-plus button");
    process.exit(1);
  }

  if (sourceType === "npm" && !componentName) {
    console.error("npm类型需要提供组件名，例如：");
    console.error("node file-based-api-generator.js npm element-plus button");
    process.exit(1);
  }

  // 验证来源类型有效性
  if (!["code", "npm"].includes(sourceType)) {
    console.error(`无效的来源类型: ${sourceType}，必须是"code"或"npm"`);
    process.exit(1);
  }

  // 执行主流程
  await generateComponentApiJson(target, sourceType, componentName);
}

// 命令行直接运行时执行主函数
if (require.main === module) {
  main();
}

// 对外导出核心函数（支持其他模块调用）
module.exports = {
  generateApiJsonWithLLM,
  generateComponentApiJson,
  generateComponentApiFromUploadedSource, // code类型
  generateComponentApiFromNpmPackage, // npm类型
};
