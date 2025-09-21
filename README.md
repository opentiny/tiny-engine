项目目录：
src/
├── file-collection/          # 1. 文件收集层：从源码/NPM包收集API相关文件
│   ├── component-code-file-filter.js  # 从组件源码收集文件
│   └── component-npm-file-filter.js   # 从NPM包收集文件
├── api-generation/           # 2. API生成层：生成“组件API结构化JSON数组”
│   ├── file-based-api-generator.js    # （原generate-component-api-json.js）从文件生成API
│   └── web-based-api-generator.js       # （原generic-api-crawler.js）从网页爬取生成API
├── schema-conversion/        # 3. Schema转换层：将API转为物料Schema
│   └── convertor.js
├── post-processing/          # 4. 后处理层：对生成的Schema做后续加工
│   ├── post-process-schemas.js
│   └── multi-component-handlers/  # 后处理的子模块（保持原有结构）
└── utils/                    # （可选）通用工具层：抽离公共工具函数（如文件操作、日志）


LowCode-Material-Import/
├─ .env                  # 新增：后端服务配置（端口、CORS等）
├─ server/               # 新增：后端服务核心目录
│  ├─ index.js           # 后端入口（初始化Express、注册路由）
│  ├─ routes/            # 路由定义
│  │  └─ material.js    # 物料导入相关路由
│  ├─ controllers/       # 控制器（接口逻辑处理）
│  │  └─ materialController.js # 物料导入核心逻辑
│  ├─ middlewares/       # 中间件
│  │  ├─ errorHandler.js # 全局错误处理
│  │  └─ paramsValidator.js # 参数验证
│  └─ utils/             # 服务端工具
│     └─ taskManager.js  # 任务状态管理（追踪流程进度）
├─ api-generation/       # 原有：API生成模块（不变）
│  ├─ file-based-api-generator.js
│  └─ web-based-api-generator.js
├─ file-collection/      # 原有：文件收集模块（不变）
│  ├─ component-code-file-filter.js
│  └─ component-npm-file-filter.js
├─ post-processing/      # 原有：后处理模块（不变）
│  ├─ post-process-schemas.js
│  └─ multi-component-handlers/
│     ├─ merge-table-columns.js
│     └─ remove-item-snippets.js
└─ schema-conversion/    # 原有：Schema转换模块（不变）
   ├─ cli.js             # 移除命令行入口逻辑（保留工具函数导出）
   └─ convertor.js


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