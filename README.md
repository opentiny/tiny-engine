# TinyEngine: LowCode-Material-Import
低代码平台物料自动导入工具，支持通过 **URL导入** 、 **NPM导入** 和 **源码导入** 三种途径，自动提取 UI 组件的 API 信息（Props/Events/Slots 等），并转换为符合 TinyEngine 组件协议的物料 JSON。配套前端提供可视化操作界面，实现 “导入 - 预览 - 编辑 - 保存” 全流程闭环，大幅简化低代码物料接入流程。


## 📋 项目介绍
本项目是低代码平台的**前后端一体化物料处理方案**，核心能力覆盖“后端解析处理”与“前端可视化操作”：
1. **后端核心**：多源数据解析（URL爬取/源码/NPM）、LLM驱动API提取、物料协议转换、异步任务管理。
2. **前端核心**：可视化操作界面、导入表单动态切换、任务进度实时展示、物料预览与编辑、批量数据管理。
3. **联调特性**：前后端接口严格对齐，支持导入类型映射、任务状态轮询、物料数据实时同步，已完成全流程联调。


## ✨ 核心功能
| 功能模块                 | 说明                                                            |
| ------------------------ | --------------------------------------------------------------- |
| 多源导入（后端）         | 支持从组件文档URL爬取API、上传Vue源码/NPM包文件                 |
| 文件智能筛选（后端）     | 自动排除`style`、`utils`等非核心目录，保留入口文件和API定义文件 |
| 结构化API提取（后端）    | 基于LLM解析组件信息，生成Props/Events/Slots/Methods结构化JSON   |
| 物料协议转换（后端）     | 对接TinyEngine组件协议，输出标准物料格式                        |
| 任务化管理（后端）       | 支持任务创建、进度查询、错误反馈，适配前端轮询交互              |
| 可视化操作界面（前端）   | 提供导入方式选择、物料列表管理、任务进度可视化入口              |
| 导入表单动态切换（前端） | 根据导入类型（URL/NPM/源码）自动切换表单（输入框/文件上传）     |
| 物料预览与编辑（前端）   | 导入后预览物料数据，支持属性/事件/插槽实时编辑并提交更新        |
| 任务卡片最小化（前端）   | 处理中任务可最小化为右侧卡片，支持重新打开模态框查看进度        |
| 搜索与筛选（前端）       | 支持按组件名筛选、关键词搜索，分页控制物料列表显示              |


## 📌 环境要求
| 环境/工具  | 版本要求                          | 说明                               |
| ---------- | --------------------------------- | ---------------------------------- |
| Node.js    | v18.18.0 及以上                   | 支持`fetch`、ES6+语法，前后端通用  |
| 包管理工具 | npm / yarn / pnpm                 | 前后端依赖安装                     |
| 前端框架   | Vue 3.2+                          | 前端使用`<script setup>`语法       |
| 构建工具   | Vite 4.0+                         | 前端项目构建与跨域代理             |
| 依赖服务   | LLM接口（如DeepSeek/Qwen/OpenAI） | 后端需配置支持JSON输出的大模型接口 |


## 🛠️ 安装与配置

### 1. 克隆仓库
```bash
git clone <仓库地址>
```

### 2. 安装依赖
分别安装后端和前端依赖，确保环境一致性：
```bash
# 1. 安装后端依赖
cd backend
npm install

# 2. 安装前端依赖
cd frontend
npm install
```

### 3. 环境配置
#### （1）后端配置
1. 复制环境变量模板文件 `.env.example` 为 `.env`：
   
    ```bash
    cp .env.example .env
    ```

2. 编辑 `.env` 文件，配置关键参数：
   
    ```env
    # 服务器配置
    SERVER_PORT=3001                  # 后端服务端口（默认3001）
    CORS_ALLOW_ORIGIN=http://localhost:8080 # 前端地址（解决跨域，需与前端端口一致）

    # 数据库配置
    MYSQL_HOST=localhost       # MySQL 服务地址
    MYSQL_PORT=3306            # MySQL 端口（默认3306）
    MYSQL_USER=root            # MySQL 用户名（需替换为你的实际用户名）
    MYSQL_PASSWORD=your_password    # MySQL 密码（需替换为你的实际密码）
    MYSQL_DATABASE=lowcode_material # 数据库名（需提前手动创建该库）

    # LLM模型配置（必填，替换为实际值）
    OPENAI_MODEL=deepseek-reasoner            # 模型名称（如deepseek-reasoner、Qwen3-32B）
    OPENAI_API_KEY=your_api_key_here          # 模型API密钥
    OPENAI_BASE_URL=https://api.deepseek.com/v1 # 模型接口地址
    
    # 默认路径配置（自动创建，无需手动创建）
    DEFAULT_OUTPUT_DIR=output-log       # 最终物料JSON输出目录
    DEFAULT_SCHEMA_LOG_DIR=schema-log   # 转换过程日志目录
    DEFAULT_API_LOG_DIR=raw-api-log     # 原始API JSON日志目录
    ```


#### （2）前端配置（跨域与端口）
前端需配置代理对接后端服务，编辑 `frontend/vite.config.js`：

 ```javascript
  import { defineConfig } from 'vite'; 
  import vue from '@vitejs/plugin-vue'; 

  export default defineConfig({
    plugins: [vue()],
    server: {
      port: 8080, // 前端端口（默认8080，需与后端CORS_ALLOW_ORIGIN一致）
      proxy: {
        // 代理所有/api请求到后端服务
        '/api': {
          target: 'http://localhost:3001', // 后端服务地址（与SERVER_PORT一致）
          changeOrigin: true, // 解决跨域问题
        }
      }
    }
  });
```

## 🚀 快速启动
前后端需分别启动，且需先启动MySQL数据库服务，再启动后端服务，最后启动前端服务：

### 1. 启动MySQL数据库服务
确保本地MySQL服务已启动（以常见系统为例）：
- **Windows**：通过服务管理器启动“MySQL”服务；
- **macOS（Homebrew安装）**：执行 `brew services start mysql`；
- **Linux（系统服务）**：执行 `sudo systemctl start mysql`（或对应发行版的MySQL服务启动命令）。


### 2. 启动后端服务
```bash
# 进入backend目录
cd backend
# 开发环境启动
node server/index.js
```

启动成功后，服务会监听配置的 `SERVER_PORT`（默认3001），可通过 `http://localhost:3001/api/material/docs` 访问简易接口文档。


### 3. 启动前端服务
```bash
# 新开终端，进入前端目录
cd frontend
# 启动开发环境（支持热更新）
npm run dev
```
- 启动成功标识：终端输出 VITE v7.1.7 ready in 300 ms，并显示访问地址
- 前端访问地址：默认 http://localhost:8080（打开后进入物料管理首页）

## 📂 项目目录结构
```
LowCode-Material-Import/
├── backend/              # 后端服务核心
│   ├── .env              # 后端环境变量（用户配置）
│   ├── .env.example      # 后端环境变量模板
│   ├── server/           # 服务入口与核心逻辑
│   │   ├── index.js      # 后端服务启动入口
│   │   ├── controllers/  # 业务控制器（物料导入、任务状态、保存物料）
│   │   ├── middlewares/  # 中间件（参数校验、错误处理）
│   │   ├── routes/       # 接口路由
│   │   ├── db/           # 数据库操作
│   │   └── utils/        # 工具函数（任务管理）
│   ├── src/              # 核心业务模块
│   │   ├── api-generation/   # API生成（LLM调用、URL爬取）
│   │   ├── file-collection/  # 文件筛选（核心文件识别、临时文件管理）
│   │   ├── post-processing/  # 物料后处理（协议转换、数据补全）
│   │   └── schema-conversion/# 物料协议对接（TinyEngine格式）
│   └── package.json      # 后端依赖配置
├── frontend/             # 前端可视化项目
│   ├── index.html        # 前端入口HTML
│   ├── package.json      # 前端依赖配置
│   ├── package-lock.json # 前端依赖版本锁定
│   ├── vite.config.js    # 前端构建配置（跨域代理、端口）
│   ├── public/           # 静态资源
│   └── src/              # 前端源代码
│       ├── App.vue       # 根组件
│       ├── main.js       # 前端入口（Vue初始化、路由配置）
│       ├── style.css     # 全局样式
│       ├── assets/       # 静态资源
│       ├── components/   # 通用组件（导入模态框、物料表格）
│       ├── router/       # 路由配置
│       └── views/        # 页面视图（首页）
└── README.md             # 项目说明文档（前后端全流程）
```


## 🎯 后端关键模块说明
### 1. 文件筛选模块（`backend/src/file-collection`）
- **源码类型**：适配普通Vue组件源码，筛选`index.js/ts`入口文件及Props/Events定义文件。
- **NPM类型**：适配NPM包组件，强制校验`index`入口，提取含组件关键词的核心文件。
- **过滤规则**：自动跳过`style`文件夹、`.map`文件、内部工具函数等非API相关内容。

### 2. API生成模块（`backend/src/api-generation`）
- **文件驱动流程**：处理源码上传 / NPM 导入，接收输入→筛选核心文件→LLM 解析→生成 API JSON。
- **URL 表格驱动流程**：处理 URL 爬取，Puppeteer 爬表格（带重试）→LLM 转换表格数据→生成 API JSON。

### 3. 物料转换模块（`backend/src/schema-conversion`）
基于LLM将原始API JSON转换为符合TinyEngine的物料格式，包含：
- 组件基本信息（名称、描述、分类）
- Props定义（类型、默认值、描述）
- Events定义（参数、触发时机）
- Slots定义（名称、用途、参数）


## 🖥️ 前端核心模块说明

### 1. 核心页面功能
#### （1）物料管理首页（MaterialManagement.vue）
- 导入卡片区：3 个卡片对应三种导入方式，点击触发ImportModal模态框。
- 物料操作区：支持 “导出选中物料”“批量删除”，提供组件名筛选下拉框和关键词搜索框。
- 物料列表区：展示已保存的物料，支持分页（默认 10 条 / 页），点击 “删除” 按钮删除单个物料。

#### （2）导入模态框（ImportModal.vue）
- 动态表单：根据activeModal（url/npm/code）显示对应表单：
  - URL 导入：输入 “URL 地址”“表格 CSS 选择器”
  - NPM 导入：输入 “NPM 包名”“组件名”
  - 源码导入：上传文件（支持单个文件 / ZIP 压缩包）
- 任务进度：提交后显示进度条（0-100%），实时更新任务状态（处理中 / 成功 / 失败）。
- 物料预览：任务成功后，通过MaterialTable展示生成的物料，支持编辑属性 / 事件 / 插槽。
- 任务卡片：处理中任务可点击 “最小化”，生成右侧悬浮卡片，点击卡片可重新打开模态框。

#### （3）物料表格（MaterialTable.vue）
- 主表展示：显示物料基本信息（组件名、导入类型、导入时间），支持勾选批量操作。
- 子表编辑：点击展开行，显示属性、事件、插槽三种子表：
  - 编辑：点击 “编辑” 进入编辑状态，支持修改字段值。
  - 保存：编辑后点击 “保存”，提交更新到后端。
  - 取消：编辑后点击 “取消”，放弃修改并恢复原始数据。
  - 删除：点击 “删除”，删除对应属性 / 事件 / 插槽并提交后端。

### 2. 前端核心交互流程
1. 选择导入方式：首页点击导入卡片（如 “URL 导入”），打开ImportModal。
2. 填写表单并提交：输入必填项（如 URL 地址），点击 “确定” 创建导入任务。
3. 查看任务进度：模态框显示进度条，轮询查询任务状态。
4. 预览与编辑物料：任务成功后，预览物料数据，编辑子表（如修改属性描述）。
5. 保存到物料库：点击 “保存到物料库”，将物料同步到后端数据库。
6. 管理物料：首页刷新物料列表，支持筛选、搜索、删除、导出操作。


## 🔌 API接口文档
### 一、物料导入与任务管理接口（前缀：`http://localhost:3001/api/material`）
#### 1. 创建物料导入任务（统一入口）
- **请求方式**：POST  
- **接口路径**：`/import`  
- **Content-Type**：  
  - url/npm类型：`application/json`  
  - code类型：`multipart/form-data`  
- **必填公共参数**：  
  | 参数名       | 类型   | 说明                  |
  |--------------|--------|-----------------------|
  | importType   | string | 导入类型（`url`/`code`/`npm`） |
- **各类型专属必填参数**：  
  - url类型：`url`（组件文档URL）、`tableSelector`（表格CSS选择器）  
  - code类型：`files`（单个文件/ZIP，字段名固定）  
  - npm类型：`packageName`（NPM包名）、`componentName`（组件名）  
- **响应示例**：  
  ```json
  { "code": 200, "success": true, "message": "任务创建成功", "taskId": "task-123456" }
  ```

#### 2. 查询任务状态
- **请求方式**：GET  
- **接口路径**：`/status/:taskId`  
- **路径参数**：`taskId`（创建任务返回的ID，必填）  
- **响应示例（成功）**：  
  ```json
  {
    "code": 200, "success": true, "taskId": "task-123456",
    "status": "success", "progress": 100,
    "steps": [{"step": "初始化", "status": "success"}],
    "result": { "finalSchemas": [/* 物料JSON */] }
  }
  ```

#### 3. 保存物料到数据库
- **请求方式**：POST  
- **接口路径**：`/save`  
- **Content-Type**：`application/json`  
- **必填参数（Body）**：  
  | 参数名         | 类型   | 说明                  |
  |----------------|--------|-----------------------|
  | materials      | array  | 物料数组（必填）      |
  | materials[].componentName | string | 组件名（必填） |
  | materials[].importType | string | 导入类型（必填） |
  | materials[].source | string | 来源（URL/包名/文件名，必填） |
  | materials[].content | object | 物料完整内容（必填） |
- **响应示例**：  
  ```json
  { "code": 200, "success": true, "savedCount": 1, "message": "物料保存成功" }
  ```

#### 4. 获取接口文档
- **请求方式**：GET  
- **接口路径**：`/docs`  
- **说明**：返回HTML格式的完整接口说明


### 二、物料基础管理接口（前缀：`http://localhost:3001/api/materials`）
#### 1. 获取物料列表
- **请求方式**：GET  
- **接口路径**：`/`  
- **查询参数**：  
  | 参数名         | 类型   | 说明                  |
  |----------------|--------|-----------------------|
  | importType     | string | 导入类型（可选，精确匹配） |
  | componentName  | string | 组件名（可选，精确匹配） |
  | keyword        | string | 内容关键词（可选，模糊匹配） |
  | page           | number | 页码（可选，默认1） |
  | limit          | number | 每页数量（可选，默认20，1-100） |
- **响应示例**：  
  ```json
  {
    "code": 200, "success": true,
    "rows": [/* 物料列表 */],
    "totalCount": 10, "currentPage": 1, "pageSize": 20
  }
  ```

#### 2. 获取去重组件名
- **请求方式**：GET  
- **接口路径**：`/component-names`  
- **响应示例**：  
  ```json
  { "code": 200, "success": true, "componentNames": ["Button", "Input"] }
  ```

#### 3. 获取单个物料详情
- **请求方式**：GET  
- **接口路径**：`/:id`  
- **路径参数**：`id`（物料ID，数字，必填）  
- **响应示例**：  
  ```json
  { "code": 200, "success": true, "data": { "id": 1, "componentName": "Button", "content": {} } }
  ```

#### 4. 更新物料
- **请求方式**：PUT  
- **接口路径**：`/:id`  
- **Content-Type**：`application/json`  
- **路径参数**：`id`（物料ID，数字，必填）  
- **必填参数（Body）**：`content`（物料内容JSON，必填）  
- **响应示例**：  
  ```json
  { "code": 200, "success": true, "affectedCount": 1, "message": "更新成功" }
  ```

#### 5. 批量删除物料
- **请求方式**：DELETE  
- **接口路径**：`/batch`  
- **Content-Type**：`application/json`  
- **必填参数（Body）**：`ids`（物料ID数组，数字类型，必填）  
- **响应示例**：  
  ```json
  { "code": 200, "success": true, "affectedCount": 2, "message": "成功删除2个物料" }
  ```

#### 6. 删除单个物料
- **请求方式**：DELETE  
- **接口路径**：`/:id`  
- **路径参数**：`id`（物料ID，数字，必填）  
- **响应示例**：  
  ```json
  { "code": 200, "success": true, "affectedCount": 1, "message": "彻底删除成功" }
  ```
