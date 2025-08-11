const { OpenAI } = require("openai");
require('dotenv').config();

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "你的API密钥",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

/**
 * 使用OpenAI模型分析网页内容并提取API信息
 * @param {string} pageContent - 网页文本内容
 * @param {string} url - 原始URL（用于提示）
 * @returns {Promise<Object>} - 提取的API信息
 */
async function analyzeApiContent(pageContent, url) {
  try {
    // 构建提示信息
    const messages = [
      {
        role: "system",
        content: `你是专业的组件文档解析工具，需100%完整提取网页中组件API文档的所有层级结构和细节信息`
      },
      {
        role: "user",
        // 网页提取分析使用以下简洁版的提取效果好一点
        content: `请提取网页${url}中所有组件的API内容，输出完整JSON。需包含所有组件API的所有层级及每个字段的全部细节（包括结构详情、版本标记等），可选值（enum）需完整列出所有选项及格式（如：可选值：'large' | 'default' | 'small'）。
        网页内容如下：
        ${pageContent}`
        // content: `请提取网页${url}中grid的API内容，输出完整JSON。需包含组件API的所有层级及每个字段的全部细节（包括结构详情、版本标记等），可选值（enum）需完整列出所有选项及格式（如：可选值：'large' | 'default' | 'small'）。
        // 网页内容如下：
        // ${pageContent}`

        // content: `请从网页${url}的内容中，提取所有组件的 API 文档信息，并输出完整的结构化 JSON，要求如下：
        // 【提取目标】
        // - 遍历网页中所有组件，逐个提取其 API 内容；
        // - 每个组件的 API 应包含其所有属性（Props）、事件（Events）、插槽（Slots）、方法（Methods）、暴露字段（Exposes）等；
        // - 所有层级结构必须与原文档保持一致，保证完整性和准确性，严禁遗漏嵌套字段或继承字段；
        // - 所有字段的内容都必须完整保留，不可删除或修改；
        // - 可选值（enum） 必须包含完整的描述，如：可选值：'large' | 'default' | 'small'。`

        //   content: `请从网页${url}的内容中，提取所有组件的API文档信息，并输出完整的结构化JSON。具体要求如下：
        //   【核心任务】
        //   1. **组件识别**：首先完整识别网页中所有独立组件（如“Button”和“ButtonGroup”为两个独立组件，需分别提取），确保无遗漏任何在文档中单独描述的组件。
        //   2. **结构完整性**：
        //      - 每个组件作为JSON的顶层键（如"Button API"、"ButtonGroup API"），彼此为并列关系；
        //      - 每个组件的API内容需包含其所有原生层级（如属性/Attributes、事件/Events、插槽/Slots、暴露字段/Exposes等），层级嵌套关系与原文档完全一致；
        //      - 继承字段、关联字段需按原文档位置保留，不得擅自合并或删减。
        //   3. **内容准确性**：
        //      - 所有字段（如属性名、类型、描述、默认值、版本标记等）需完整保留，包括特殊标记（如“2.2.0”“enum”等）；
        //      - 可选值（enum）需完整列出所有选项及格式（如：可选值：'large' | 'default' | 'small'）；
        //      - 插槽、事件等的子字段（如插槽的“Name”“Description”“Subtags”）需全部提取，不得遗漏。`
        // 

      //   content: `请从网页${url}提取组件 API 并输出结构化 JSON，严格遵循以下规则：

      // 【1. 组件拆分】
      // - 按网页**独立标题**（含“组件名+API/文档”，如“Button API”）拆分独立组件，每个标题作为 JSON 顶层键（键名完全匹配标题文本）。
      // - 非组件标题内容（如全局说明）直接忽略。

      // 【2. 层级结构】
      // - 严格对应文档的标题/列表嵌套关系：
      //   - 一级标题（如“Attributes”“Events”）→ JSON 一级子键；
      //   - 二级子标题/列表 → JSON 二级子键，以此类推。
      // - 必含核心层级（文档有则全提，无则空对象）：Attributes/属性、Events/事件、Slots/插槽、Exposes/暴露。

      // 【3. 字段完整度】
      // - 每个属性/事件/插槽必须提取：名称、类型、描述、默认值、版本标记（如“v2.2.0+”）。
      // - 可选值（enum）完整保留所有选项（如“'large'|'small'”），不删改格式。
      // - 事件参数需拆分参数名和类型（如“(e: Event) → void”→ params: [{name: "e", type: "Event"}]）。

      // 【4. 禁止操作】
      // - 不合并、不删减任何层级或字段（即使内容为空）；
      // - 不修改原文格式（如引号、版本号、枚举符号）。

      // 输出标准 JSON，确保无语法错误。`
      }
    ];

    // 调用OpenAI API
    const completion = await client.chat.completions.create({
      // model: "gpt-4",
      // model: "Qwen/QwQ-32B",
      model: "Qwen/Qwen3-32B", // 网页提取效果好一点
      // model: "Qwen/Qwen2.5-7B-Instruct",
      // model: "Qwen/Qwen3-8B",
      // model: "Qwen/Qwen3-14B",
      // model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
      messages,
      temperature: 0, // 低温度以获取更确定性的输出
    });

    // 解析并返回结果
    const result = completion.choices[0].message.content;
    console.log(`成功获取API内容，长度: ${result.length} 字符`);
    try {
      // 预处理：移除开头的 ```json 和结尾的 ```
      const jsonContent = result
        .replace(/^```json\s*/, '') // 移除开头的 ```json（包括可能的空格）
        .replace(/\s*```$/, '');   // 移除结尾的 ```（包括可能的空格）
      return JSON.parse(jsonContent); // 解析处理后的纯JSON内容
    } catch (e) {
      // 如果无法解析为JSON，直接返回文本结果
      console.warn("无法解析为JSON，返回原始文本结果");
      return result;
    }
  } catch (error) {
    console.error(`调用OpenAI API失败: ${error.message}`);
    if (error.response) {
      console.error("API响应:", error.response.data);
    }
    throw error;
  }
}

module.exports = { analyzeApiContent };    