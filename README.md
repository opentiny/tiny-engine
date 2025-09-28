# TinyEngine: LowCode-Material-Import
低代码平台物料自动导入工具，支持通过 **URL爬取** 和 **文件上传** 两种途径，自动提取UI组件的API信息（Props/Events/Slots等），并转换为符合TinyEngine组件协议的物料JSON，大幅简化低代码物料接入流程。


## 📋 项目介绍
本项目是低代码平台的后端物料处理服务，核心能力包括：
1. **多途径导入**：支持从组件文档URL爬取API，或直接上传组件源码（Code类型）/NPM包文件（NPM类型）。
2. **智能文件筛选**：自动过滤无关文件（如`style`文件夹、`.map`文件），精准提取API相关核心文件。
3. **大模型驱动**：基于LLM（如DeepSeek、Qwen）解析组件源码，生成结构化API JSON。
4. **物料协议转换**：将原始API信息转换为符合TinyEngine的标准物料格式，并支持后续加工处理。
5. **任务化管理**：异步任务调度+进度查询，适配大文件处理和复杂解析场景。


## ✨ 核心功能
| 功能模块                | 说明                                                                 |
|-------------------------|----------------------------------------------------------------------|
| 多源导入                | 支持URL爬取（组件文档）、文件上传（Vue源码/NPM包）                   |
| 文件智能筛选            | 自动排除`style`、`utils`等非核心目录，保留入口文件和API定义文件       |
| 结构化API提取           | 提取组件Props/Events/Slots/Methods，生成标准JSON结构                  |
| 物料协议转换            | 对接TinyEngine组件协议，输出可直接导入的物料JSON                      |
| 任务进度追踪            | 支持任务创建、进度查询、错误反馈，适配前端轮询交互                    |
| 临时文件管理            | 自动创建/清理临时目录，避免文件残留，支持多用户并发上传              |


## 📌 环境要求
- **Node.js**：v18.18.0 及以上（需支持`fetch`和ES6+语法）
- **包管理工具**：npm / yarn / pnpm
- **依赖服务**：需配置支持JSON输出的LLM接口（如DeepSeek、OpenAI、Qwen）


## 🛠️ 安装与配置

### 1. 克隆仓库
```bash
git clone <仓库地址>
cd LowCode-Material-Import
```

### 2. 安装依赖
```bash
# 进入backend目录安装后端依赖
cd backend
npm install
# 或
yarn install
```

### 3. 环境配置
1. 复制环境变量模板文件 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```
2. 编辑 `.env` 文件，配置关键参数：
   ```env
   # 服务器配置
   SERVER_PORT=3001                  # 后端服务端口
   CORS_ALLOW_ORIGIN=http://localhost:8080 # 前端项目地址（解决跨域）

   # 默认路径配置（自动创建，无需手动创建）
   DEFAULT_OUTPUT_DIR=output-log       # 最终物料JSON输出目录
   DEFAULT_SCHEMA_LOG_DIR=schema-log   # 转换过程日志目录
   DEFAULT_API_LOG_DIR=raw-api-log     # 原始API JSON日志目录

   # LLM模型配置（必填，替换为实际值）
   OPENAI_MODEL=deepseek-reasoner            # 模型名称（如deepseek-reasoner、Qwen3-32B）
   OPENAI_API_KEY=your_api_key_here          # 模型API密钥
   OPENAI_BASE_URL=https://api.deepseek.com/v1 # 模型接口地址
   ```


## 🚀 快速启动

### 1. 启动后端服务
```bash
# 进入backend目录
cd backend
# 开发环境启动（需全局安装nodemon，或用node直接启动）
nodemon server/index.js
# 或
node server/index.js
```

启动成功后，服务会监听配置的 `SERVER_PORT`（默认3001），可通过 `http://localhost:3001/api/material/docs` 访问简易接口文档。


### 2. 前端对接（可选）

#### 启动前端服务
```bash
# 进入前端目录
cd frontend
# 安装依赖（若未安装）
npm install
# 启动开发服务器
npm run dev
```

项目暂未提供前端源码，可参考以下方式对接：
- **文件上传**：使用Vue/React实现文件夹上传组件（参考[Vue文件夹上传组件示例](#vue-文件夹上传组件示例)），保留文件相对路径。
- **任务交互**：调用API创建任务后，通过轮询查询任务状态，获取物料生成结果。


## 🔌 API接口文档
所有接口前缀：`http://localhost:3001/api/material`

### 1. 创建URL爬取任务
- **请求方式**：POST
- **接口路径**：`/import`
- **Content-Type**：`application/json`
- **请求参数**：
  | 参数名       | 类型   | 必需 | 说明                     |
  |--------------|--------|------|--------------------------|
  | url          | string | 是   | 组件文档URL（如Element Plus组件文档） |
  | config       | object | 是   | 爬取配置（含组件解析规则） |

- **请求示例**：
  ```json
  {
    "url": "https://element-plus.org/zh-CN/component/button.html",
    "config": {
      "components": [
        {
          "name": "Button",
          "tables": {
            "props": ".el-table__body",
            "events": ".el-table__body"
          }
        }
      ]
    }
  }
  ```

- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "任务创建成功，可通过taskId查询进度",
    "taskId": "task-123456-abcdef",
    "success": true
  }
  ```


### 2. 创建文件上传任务
- **请求方式**：POST
- **接口路径**：`/import/file`
- **Content-Type**：`multipart/form-data`
- **请求参数**：
  | 参数名       | 类型   | 必需 | 说明                     |
  |--------------|--------|------|--------------------------|
  | files        | file[] | 是   | 上传的文件列表（支持文件夹上传，保留相对路径） |
  | sourceType   | string | 是   | 文件类型（`code`：源码组件；`npm`：NPM包组件） |

- **响应示例**：同URL爬取任务


### 3. 查询任务状态
- **请求方式**：GET
- **接口路径**：`/status/:taskId`
- **路径参数**：
  | 参数名   | 类型   | 说明       |
  |----------|--------|------------|
  | taskId   | string | 任务ID（创建任务时返回） |

- **响应示例（成功）**：
  ```json
  {
    "code": 200,
    "success": true,
    "taskId": "task-123456-abcdef",
    "status": "success",
    "progress": 100,
    "step": {
      "name": "finish",
      "message": "组件物料json后续处理完成，请确认后完成导入"
    },
    "result": {
      "totalComponents": 1,
      "successCount": 1,
      "failCount": 0,
      "outputDir": "/path/to/output-log", 
      "finalSchemas": [/* 符合TinyEngine的物料JSON */]
    }
  }
  ```


## 📂 项目目录结构
```
LowCode-Material-Import/
├── backend/              # 后端服务核心（所有后端代码移入该目录）
│   ├── .env              # 环境变量（用户配置）
│   ├── .env.example      # 环境变量模板
│   ├── server/           # 服务入口、路由、控制器等
│   │   ├── index.js      # 服务启动入口
│   │   ├── controllers/  # 业务逻辑控制器
│   │   ├── middlewares/  # 中间件（参数校验、错误处理）
│   │   ├── routes/       # 接口路由配置
│   │   └── utils/        # 工具函数（任务管理等）
│   ├── src/              # 核心业务逻辑（API生成、文件筛选、物料转换等）
│   │   ├── api-generation/   # API生成模块
│   │   ├── file-collection/  # 文件筛选模块
│   │   ├── post-processing/  # 物料后处理
│   │   └── schema-conversion/# 物料协议转换
│   ├── package.json      # 后端依赖配置
│   └── package-lock.json # 依赖版本锁定
└── README.md             # 项目说明文档
```


## 🎯 关键模块说明
### 1. 文件筛选模块（`backend/src/file-collection`）
- **Code类型**：适配普通Vue组件源码，筛选`index.js/ts`入口文件及Props/Events定义文件。
- **NPM类型**：适配NPM包组件，强制校验`index.mjs`入口，提取含组件关键词的核心文件。
- **过滤规则**：自动跳过`style`文件夹、`.map`文件、内部工具函数等非API相关内容。

### 2. API生成模块（`backend/src/api-generation`）
- **文件上传流程**：接收前端文件→保存临时目录（重建目录结构）→筛选核心文件→LLM解析→生成API JSON。
- **URL爬取流程**：解析爬取配置→请求文档HTML→提取表格数据→结构化API JSON。

### 3. 物料转换模块（`backend/src/schema-conversion`）
基于LLM将原始API JSON转换为符合TinyEngine的物料格式，包含：
- 组件基本信息（名称、描述、分类）
- Props定义（类型、默认值、描述）
- Events定义（参数、触发时机）
- Slots定义（名称、用途、参数）



## ❓ 常见问题
### 1. 文件上传后，后端无法识别目录结构？
- 前端需通过`webkitdirectory`实现文件夹上传，且`formData.append`时传入`file.webkitRelativePath`作为文件名。
- 后端`saveUploadedFilesToTempDir`函数已处理路径重建，确保`originalname`包含相对路径。

### 2. LLM接口调用失败？
- 检查`backend/.env`中`OPENAI_API_KEY`和`OPENAI_BASE_URL`是否正确。
- 确认模型名称（`OPENAI_MODEL`）与接口支持的模型一致（如DeepSeek支持`deepseek-reasoner`）。

### 3. 任务一直处于`processing`状态？
- 查看服务日志，可能是大模型超时或文件处理异常。
- 检查临时目录是否正常创建（`os.tmpdir()`路径下），权限是否足够。


## 网页url爬取 - config json对象配置说明

### 一、核心用途
统一爬取规则，实现 “配置即规则”，无需修改爬虫核心代码即可适配不同网页。
精准映射网页 DOM 结构与目标数据字段，支持属性、事件、插槽、方法等组件信息的提取。
兼容悬浮提示（Tooltip）等交互元素的内容抓取，提升数据完整性。

### 二、配置模板
```json
{
  "basicInfo": {
    "name": "填写配置名称或页面标题的DOM选择器（如'h1'）",
    "description": "填写配置描述或页面描述的DOM选择器（如'.description'）",
    "version": "填写版本信息的DOM选择器（如'.version'）"
  },
  "commonSelectors": {
    "tableRow": "tbody tr", // 表格行通用选择器（默认适配大多数表格，无需修改）
    "tableHeader": "thead th, tr:first-child th" // 表头通用选择器（兼容thead或首行表头）
  },
  "tooltipInteraction": {
    "triggerButton": "填写触发悬浮提示的元素选择器（如'button.el-tooltip__trigger'，无则留空）",
    "tooltipContainer": "填写悬浮提示容器选择器（如'.el-popper'，无则留空）",
    "tooltipContent": "填写悬浮提示内容选择器（如'.m-1 > code'，无则留空）"
  },
  "components": [
    {
      "name": "填写组件名称（如'Button'）",
      "tables": {
        "properties": {
          "selector": "填写属性表格的DOM选择器（如'h3#button-attributes + div.vp-table'）",
          "fieldMapping": {
            "name": "填写表格中'属性名'对应的列名（如'属性'）",
            "description": "填写表格中'说明'对应的列名（如'描述'）",
            "type": "填写表格中'类型'对应的列名（如'数据类型'）",
            "default": "填写表格中'默认值'对应的列名（如'默认值'）"
          }
        },
        "events": {
          "selector": "填写事件表格的DOM选择器（如'h3#button-events + div.vp-table'）",
          "fieldMapping": {
            "name": "填写表格中'事件名'对应的列名（如'事件'）",
            "description": "填写表格中'说明'对应的列名（如'触发时机'）",
            "type": "填写表格中'类型'对应的列名（如'事件类型'）",
            "functionParams": "填写表格中'参数'对应的列名（如'回调参数'）"
          }
        },
        "slots": {
          "selector": "填写插槽表格的DOM选择器（如'h3#button-slots + div.vp-table'）",
          "fieldMapping": {
            "name": "填写表格中'插槽名'对应的列名（如'插槽'）",
            "description": "填写表格中'说明'对应的列名（如'用途'）",
            "type": "填写表格中'类型'对应的列名（如'插槽类型'）",
            "props": "填写表格中'参数'对应的列名（如'插槽属性'）"
          }
        },
        "methods": {
          "selector": "填写方法表格的DOM选择器（如'h3#button-methods + div.vp-table'）",
          "fieldMapping": {
            "name": "填写表格中'方法名'对应的列名（如'方法'）",
            "description": "填写表格中'说明'对应的列名（如'功能'）",
            "type": "填写表格中'返回值'对应的列名（如'返回类型'）",
            "functionParams": "填写表格中'参数'对应的列名（如'方法参数'）"
          }
        }
      }
    }
    // 新增组件：复制上方组件配置块，删除无需的表格类型（如无methods则删除methods对象）
    // ,{
    //   "name": "第二个组件名称（如'Input'）",
    //   "tables": { ... }
    // }
  ]
}
```

### 三、配置示例（Element Plus 按钮组件）
以下为针对 Element Plus Button & ButtonGroup 组件文档 的实际配置，可直接参考适配其他组件：
```json
{
  "basicInfo": {
    "name": "h1",
    "description": "h1 + p",
    "version": "span.el-tag__content"
  },
  "commonSelectors": {
    "tableRow": "tbody tr",
    "tableHeader": "thead th, tr:first-child th"
  },
  "tooltipInteraction": {
    "triggerButton": "button.el-button.el-tooltip__trigger",
    "tooltipContainer": ".el-popper",
    "tooltipContent": ".m-1 > code"
  },
  "components": [
    {
      "name": "Button",
      "tables": {
        "properties": {
          "selector": "h3#button-attributes + div.vp-table",
          "fieldMapping": {
            "name": "属性名",
            "description": "说明",
            "type": "类型",
            "default": "默认值"
          }
        },
        "slots": {
          "selector": "h3#button-slots + div.vp-table",
          "fieldMapping": {
            "name": "插槽名",
            "description": "说明"
          }
        }
        // 无events和methods表格，故删除对应配置
      }
    },
    {
      "name": "ButtonGroup",
      "tables": {
        "properties": {
          "selector": "h3#buttongroup-attributes + div.vp-table",
          "fieldMapping": {
            "name": "属性名",
            "description": "说明",
            "type": "类型",
            "default": "默认值"
          }
        },
        "slots": {
          "selector": "h3#buttongroup-slots + div.vp-table",
          "fieldMapping": {
            "name": "插槽名",
            "description": "说明"
          }
        }
        // 无events和methods表格，故删除对应配置
      }
    }
  ]
}
```
