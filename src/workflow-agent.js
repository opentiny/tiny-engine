// 加载环境变量（指定上级目录的.env文件）
require('dotenv').config({ path: '../.env' });
const { ChatOpenAI } = require("@langchain/openai");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { ElementApiCrawlerTool, TinyEngineConverterTool, SchemaPostProcessorTool } = require("./tools");

// 移除：不需要手动导入ChatMessageHistory和BufferMemory（避免版本兼容问题）

// 环境变量校验（提前报错，避免后续执行失败）
if (!process.env.OPENAI_API_KEY) {
  console.error("错误：未配置OPENAI_API_KEY，请在../.env文件中设置");
  process.exit(1); // 终止程序
}

// 调试输出环境变量状态
console.log("环境变量加载测试：");
console.log("OPENAI_API_KEY是否存在：", !!process.env.OPENAI_API_KEY);
console.log("OPENAI_BASE_URL：", process.env.OPENAI_BASE_URL || "默认(https://api.openai.com/v1)");
console.log("OPENAI_MODEL：", process.env.OPENAI_MODEL || "默认(Qwen/Qwen3-32B)");

// 初始化模型（添加超时配置，避免无限等待）
const model = new ChatOpenAI({
  temperature: 0, // 固定输出，避免随机性
  modelName: process.env.OPENAI_MODEL || "Qwen/Qwen3-32B",
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

// 注册工具
const tools = [
  new ElementApiCrawlerTool(),
  new TinyEngineConverterTool(),
  new SchemaPostProcessorTool()
];

// Agent系统提示词（强化步骤强制性，适配chat-conversational类型）
const systemPrompt = `
你是一个严格遵循工作流的组件协议转换助手，必须按以下步骤执行：

第一步：检查输入是否包含Element Plus组件文档的URL（如https://element-plus.org/zh-CN/component/button.html）。
- 若没有URL，直接回复"请提供Element Plus组件的文档URL（例如：https://element-plus.org/zh-CN/component/button.html）"
- 若有URL，立即使用element_api_crawler工具爬取API数据，工具输入仅填URL，无需额外内容

第二步：爬取完成后，将返回的完整JSON字符串作为输入，调用tiny_engine_converter工具转换为tinyEngine schema。
- 必须完整使用第一步的输出（不可删减或修改任何字符）
- 若转换失败，直接返回错误信息（如"转换失败：xxx，请检查URL是否正确"）

第三步：转换完成后，将返回的完整JSON字符串作为输入，调用schema_post_processor工具进行后处理。
- 必须完整使用第二步的输出（不可删减或修改任何字符）
- 后处理完成后，将结果直接输出，不添加任何额外解释文字

注意：
- 严格按"爬取→转换→后处理"顺序执行，不跳过任何步骤
- 每次仅调用一个工具，工具调用完成后再进行下一步
- 无需询问用户确认，直接执行流程
- 若输入包含多个Element Plus组件URL（用逗号、“和”“以及”等连接），需逐个按三步流程处理，前一个完成后再处理下一个
- 所有URL处理完成后，汇总输出所有最终结果，不遗漏任何一个
`;

/**
 * 运行Agent处理组件转换任务
 * @param {string} query - 用户查询（应包含组件URL或请求提供URL）
 */
async function runConversionWorkflow(query) {
  try {
    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "chat-conversational-react-description",
      verbose: true, // 输出工具调用日志，便于调试
      agentArgs: {
        systemMessage: systemPrompt,
      },
    });

    console.log(`\n开始处理任务: ${query}`);

    // 执行工作流
    const result = await executor.invoke({ input: query });

    console.log("\n=== 全流程完成！ ===");
    return result.output;


  } catch (error) {
    console.error("\n=== 工作流执行失败 ===");
    console.error("错误原因：", error.message);
    if (error.message.includes("API key")) {
      console.error("请检查.env文件中的OPENAI_API_KEY是否正确配置");
    } else if (error.message.includes("timeout")) {
      console.error("请求超时，请检查网络连接或稍后重试");
    } else if (error.message.includes("tool")) {
      console.error("工具调用失败，请检查tools.js中的函数是否正常导出");
    }
    process.exit(1);
  }
}

// 命令行调用
if (require.main === module) {
  const query = process.argv.slice(2).join(' ');
  if (query) {
    runConversionWorkflow(query);
  } else {
    console.log("请提供查询内容，例如：");
    console.log("node workflow-agent.js \"转换Button组件，URL是https://element-plus.org/zh-CN/component/button.html\"");
  }
}

module.exports = { runConversionWorkflow };