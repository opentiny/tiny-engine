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

element-plus的package.json文件：C:\Users\zyun\Desktop\LowCode-Material-Import\node_modules\element-plus\package.json

node code-convertor.js --vuePath D:\OSPP\element-plus\packages\components\badge\src\badge.vue --tsPath D:\OSPP\element-plus\packages\components\badge\src\badge.ts --packageJsonPath C:\Users\zyun\Desktop\LowCode-Material-Import\node_modules\element-plus\package.json

node code-convertor.js --vuePath D:\OSPP\element-plus\packages\components\button\src\button-group.vue,D:\OSPP\element-plus\packages\components\button\src\button.vue --tsPath D:\OSPP\element-plus\packages\components\button\src\button-group.ts,D:\OSPP\element-plus\packages\components\button\src\button.ts --packageJsonPath C:\Users\zyun\Desktop\LowCode-Material-Import\node_modules\element-plus\package.json

node code-convertor.js --vuePath D:\OSPP\element-plus\packages\components\table\src\table.vue,D:\OSPP\element-plus\packages\components\table\src\filter-panel.vue --tsPath D:\OSPP\element-plus\packages\components\table\src\table\defaults.ts,D:\OSPP\element-plus\packages\components\table\src\table-column\defaults.ts --packageJsonPath C:\Users\zyun\Desktop\LowCode-Material-Import\node_modules\element-plus\package.json
