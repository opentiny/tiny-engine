const { ChatOpenAI } = require("@langchain/openai");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { ElementApiCrawlerTool, TinyEngineConverterTool } = require("./tools");
require('dotenv').config();

// 初始化模型
const model = new ChatOpenAI({
  temperature: 0,
  modelName: process.env.OPENAI_MODEL || "Qwen/Qwen3-32B",
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

// 注册工具
const tools = [
  new ElementApiCrawlerTool(),
  new TinyEngineConverterTool()
];

// Agent系统提示词（指导工作流顺序）
const systemPrompt = `
你是一个组件协议转换助手，负责完成以下工作流：
1. 首先使用element_api_crawler工具，传入Element Plus组件文档的URL，获取原始API数据
2. 然后将第一步得到的JSON结果作为输入，使用tiny_engine_converter工具转换为tinyEngine schema
3. 最终输出转换后的schema结果

注意事项：
- 必须严格按照上述顺序执行，不可跳过任何步骤
- 如果没有URL，先向用户请求Element Plus组件的文档URL
- 若工具调用失败，根据错误信息重试或提示用户
- 确保转换工具的输入是爬虫工具返回的完整JSON字符串
`;

/**
 * 运行Agent处理组件转换任务
 * @param {string} query - 用户查询（应包含组件URL或请求提供URL）
 */
async function runConversionWorkflow(query) {
  // 初始化Agent执行器
  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "chat-conversational-react-description",
    verbose: true,
    agentArgs: {
      systemMessage: systemPrompt
    }
  });

  console.log(`开始处理任务: ${query}`);
  
  // 执行工作流
  const result = await executor.invoke({ input: query });
  
  console.log("\n=== 最终转换结果 ===");
  console.log(result.output);
  return result.output;
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