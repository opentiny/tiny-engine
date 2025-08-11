1. 安装必要的依赖：
   npm init -y
   npm install langchain puppeteer openai dotenv
2. 创建一个名为 `.env` 的文件，并添加以下内容：
   OPENAI_API_KEY=sk-你的API密钥
   OPENAI_BASE_URL=https://api.chatanywhere.tech/v1  # 如果使用代理服务
3. 运行程序：
   node src/index.js 用户需要提取的页面链接url
   node src/index.js https://cn.element-plus.org/zh-CN/component/form.html
4. 输出结果：
   {
    "formApi": {
        "Attributes": [
        {
            "名称": "model",
            "描述": "表单数据对象",
            "类型": "object",
            "默认值": "—",
            "枚举值": "",
            "版本": "",
            "结构详情": "Record<string, any>"
        },
        // 更多属性...
        ],
        "Events": [
        // 事件...
        ]
    },
    "formItemApi": {
        // FormItem组件的API...
    }
    }
