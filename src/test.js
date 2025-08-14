const { OpenAI } = require("openai");
require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

async function getOpenAiClient() {
    console.log("环境变量加载测试：");
    console.log("OPENAI_API_KEY是否存在：", !!process.env.OPENAI_API_KEY);
    console.log("OPENAI_BASE_URL：", process.env.OPENAI_BASE_URL);
    console.log("OPENAI_MODEL：", process.env.OPENAI_MODEL);

  const messages = [
    {
      role: "user",
      content: `求二叉树的最大深度`
    }
  ]
  // 调用OpenAI API进行转换
  const completion = await client.chat.completions.create({
    model: "Qwen/Qwen3-8B",
    messages,
    temperature: 0.2, // 适当提高温度以增加灵活性，但保持结果稳定性
  });

  const result = completion.choices[0].message.content;

  console.log(`成功获取tinyEngine schema: ${result}`);
  return result;
}

if (require.main === module) {
  getOpenAiClient()
}