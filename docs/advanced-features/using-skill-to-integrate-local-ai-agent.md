# 对接本地 AI Agent 生成页面或应用

## 概述

TinyEngine 现在支持将 **File 存储模式** 与一份标准化的 **DSL Skill** 结合，让本地 AI Agent（如 Claude Code、Cursor 等）能够直接生成符合 TinyEngine 协议的页面 / 应用 / 区块 JSON 文件，并立即被设计器加载和编辑。

这套能力解决了一个核心痛点：**如何让 AI Agent 可靠地产出 TinyEngine 能“看懂”的 DSL**。过去，直接让 AI 生成 Schema 容易出现事件绑定类型错误、`occupier` 非空导致不可编辑、`model` 未开启导致输入框失效等问题。Skill 把 TinyEngine 的协议规范、组件清单、常见模式和校验规则固化为一份 Agent 可读取的指令集，从而把“自由发挥的 AI”约束成“按规范出码的生成器”。

> 本文面向**希望用本地 AI Agent 批量、可控地生成 TinyEngine 页面或应用**的开发者。如果你只想在浏览器里用平台内置 AI 辅助搭建单个页面，请参考[新版AI插件使用](./new-ai-plugin-usage.md)。

## 背景与价值

这套方案由两块能力拼合而成：

| 能力 | 作用 |
| --- | --- |
| **File 存储模式** | MockServer 以纯文本 JSON 文件读写数据（`mockServer/data/`），文件即数据源，AI / 人 / Git 都能直接操作 |
| **DSL Skill** | 一份标准化指令集（`SKILL.md` + 参考文档 + 校验脚本），约束 AI Agent 产出符合 TinyEngine 协议的 DSL |

二者协同带来的价值：

- **协议一致**：Skill 内置 DSL 协议、组件清单与常见陷阱，让 AI 生成的 JSON 开箱即用。
- **可直接编辑**：生成的文件落盘到 File 模式目录后，设计器自动识别，且 `occupier` 为 `null`，进入画布即可二次编辑。
- **版本控制友好**：格式化的 JSON 可直接提交 Git，页面 / 应用的变更历史一目了然。
- **批量与可复用**：适合一次性生成整个应用（多页面 + 物料 + 关联），也可沉淀为团队模板。

> MockServer File 模式当前只支持Fork代码仓开发场景。如果是使用CLI创建全新的项目，暂无法使用全部的两块能力，但可以单独使用DSL Skill生成JSON格式Schema到指定目录（需要复制Skill到新项目Agent的Skill目录，如.agents/skills/）。


## 工作原理

整体链路如下：

```
       自然语言 / 截图描述
              │
              ▼
   ┌───────────────────────┐
   │   本地 AI Agent        │  ◄── 读取 .agents/skills/tinyengine-dsl-generator
   │  (Claude Code/Cursor)  │       (SKILL.md + references + scripts)
   └───────────────────────┘
              │  按 Skill 规范生成并校验
              ▼
   符合协议的 DSL JSON 文件
   mockServer/data/{pages,apps,blocks}/<name>.json
              │
              ▼
   ┌───────────────────────┐
   │  MockServer (File 模式) │  ◄── 启动命令：pnpm dev:file
   └───────────────────────┘
              │
              ▼
   TinyEngine 设计器加载 / 渲染 / 可编辑
```

几个关键约定（生成时务必遵守，详见后文 [Skill 中的关键规则](#skill-中的关键规则速查)）：

- **文件即数据**：File 模式下，MockServer 直接扫描 `mockServer/data/` 目录的 JSON 文件，文件名优先取 `name || label`（冲突时自动追加后缀）。
- **可编辑性**：页面 / 区块的 `occupier` 必须为 `null`，否则进入画布后会提示被占用而无法编辑。
- **命名与关联**：页面通过 `app` 字段关联所属应用，`route` 需在应用内唯一；应用 ID 使用整数，Page 文件的 `app` 引用使用字符串。

## 前置条件

1. 已安装仓库依赖（`pnpm install`）。
2. 本地能正常启动 MockServer 与设计器。
3. 仓库中已包含 DSL Skill：`.agents/skills/tinyengine-dsl-generator`（详情见下一节）。

## 准备 Skill（让 AI Agent 感知到它）

DSL Skill 的规范位置在仓库内的：

```
.agents/skills/tinyengine-dsl-generator/
├── SKILL.md                  # 主指令：生成流程、结构、关键规则、常见陷阱
├── references/
│   ├── protocol.md           # DSL 协议完整规范（含 TypeScript 接口）
│   ├── components.md         # 可用组件清单与 props/events
│   └── patterns.md           # 列表页 / 表单页等常见模板与交互模式
└── scripts/
    ├── validate_dsl.mjs      # 结构校验
    ├── check_event_bindings.mjs
    ├── check_css.mjs
    └── validate_all.sh       # 一键综合校验
```

### Claude Code/Cursor/OpenCode/Codex（开箱即用）

Cursor/OpenCode/Codex等多数Agent会自动识别.agents/skills目录中的技能，对于Claude Code，已将 `.claude/skills` 软链到 `.agents/skills`，因此在仓库内启动 Claude Code/Cursor/OpenCode/Codex 时，`tinyengine-dsl-generator` Skill 会被**自动发现并加载**，无需额外配置。直接用自然语言描述目标即可，Agent 会主动调用该 Skill。

### 其他本地 Agent

如果你的 Agent 不自动扫描 `.agents/skills`，只需在对话中**显式指向 `SKILL.md`**，例如：

```text
请阅读 .agents/skills/tinyengine-dsl-generator/SKILL.md 及其 references/ 目录，
按照其中的协议规范，帮我生成一个 TinyEngine 登录页面，并写入到
mockServer/data/pages/Login.json。
```

Agent 读取 `SKILL.md` 后，即可获得完整的生成流程、结构定义与校验规则。

## 使用流程

### 1. 启动 File 模式的 MockServer

```bash
pnpm dev:file  # 同时启动设计器前端 与 File模式的MockServer
# 或者单独启动 mock server
pnpm serve:backend:file
```

数据将读写 `mockServer/data/` 目录。

### 2. 向 AI Agent 描述目标

明确告诉 Agent 你要生成什么，越具体越好。例如：

- “生成一个登录页面，包含用户名、密码输入框和登录按钮，点击登录校验非空后跳转。”
- “生成一个用户管理列表页，顶部搜索表单 + 表格 + 分页，表格带状态列和操作列。”
- “基于这张设计稿截图生成页面。”（部分 Agent 支持图片输入）

### 3. Agent 按 Skill 生成 DSL

Agent 会遵循 Skill 内定义的标准流程：

1. **理解目标**：判断产物类型 —— 单页面（Page）、可复用区块（Block）还是完整应用（App，多页面 + 物料 + meta）。
2. **收集需求**：组件层级、状态、事件、数据源；区块还要收集对外暴露的 props；应用还要收集页面清单与共享物料。
3. **查阅参考**：按需对照 `references/protocol.md`（结构）、`references/components.md`（组件 props/events）、`references/patterns.md`（模板）。
4. **生成 DSL**：严格按协议结构产出 JSON。
5. **自检与校验**：套用 Skill 内的「生成前检查清单」，并运行校验脚本。
6. **落盘**：写入对应目录（见下节）。

### 4. 在设计器中查看与编辑

文件写入后，回到运行中的设计器：

- 确保当前应用与页面 `app` 字段一致；
- 在页面列表中即可看到新生成的页面，点击进入画布；
- 因为 `occupier` 为 `null`，画布可直接二次编辑、保存。

### 5. 持续迭代与版本管理

- 继续用自然语言迭代：“把表格的列宽调大”“增加一个重置按钮”，Agent 会更新对应 JSON。
- 生成的 JSON 可直接 `git add` 提交，团队成员通过 Git 查看页面配置的演进。
- 若需迁回 DB 模式或发布到远端 DB 环境，可使用 `npm run export-db-to-file` 等迁移脚本互转（两模式数据格式完全兼容）。

## 生成产物说明

### 文件输出路径

| 产物 | 文件路径 | 文件名规则 |
| --- | --- | --- |
| 应用 | `mockServer/data/apps/<app-name>.json` | 应用 `name` |
| 页面 | `mockServer/data/pages/<PageName>.json` | 页面 `name` |
| 区块 | `mockServer/data/blocks/<BlockName>.json` | 区块 `label` |

### Page 文件结构（外层包装 + 内层 DSL）

`page_content` 内才是 `componentName: "Page"` 的真正页面 DSL。

```json
{
  "name": "Login",
  "id": "a1b2c3d4e5f6g7h8",
  "app": "1",
  "route": "Login",
  "page_content": {
    "componentName": "Page",
    "fileName": "Login",
    "props": { "className": "login-page" },
    "css": ".login-page { display: flex; justify-content: center; padding: 40px; }",
    "state": { "form": { "username": "", "password": "" } },
    "methods": {},
    "lifeCycles": {},
    "children": [],
    "dataSource": { "list": [] }
  },
  "tenant": 1,
  "parentId": "0",
  "isPage": true,
  "group": "staticPages",
  "occupier": null,
  "isHome": false
}
```

### Block 文件结构

`content` 内是 `componentName: "Block"` 的区块 DSL，`schema.properties` 描述对外可配置的 props。

```json
{
  "id": "BlockUniqueId1234567",
  "label": "PortalBlock",
  "framework": "Vue",
  "path": "portal",
  "content": {
    "componentName": "Block",
    "fileName": "PortalBlock",
    "props": {},
    "state": {},
    "methods": {},
    "children": [],
    "schema": { "properties": [], "events": {}, "slots": {} }
  },
  "public": 1,
  "is_published": true,
  "occupier": null
}
```

### App 文件结构要点

应用文件主要承载元信息，关键字段：

- `id`：应用 ID（Skill 推荐整数，如 `918`），供页面通过 `app` 字段引用；
- `name`：应用名，同时决定文件名；
- `framework`：通常为 `"Vue"`；
- `created_at` / `updated_at`：ISO 时间字符串。

### 命名与关联约定

- 文件名优先使用记录的 `name || label`；同名冲突时 MockServer 会自动追加随机后缀。
- 页面的 `route` 需在所属应用内唯一，否则会被唯一性约束拦截。
- 页面的 `app` 字段必须以字符串形式引用所属应用的 `id`，例如应用 `id` 为 `1` 时页面写 `"app": "1"`。

## 示例：生成一个登录页

向 Agent 输入：

```text
请用 tinyengine-dsl-generator Skill 生成一个登录页面：
- 用户名输入框、密码输入框、登录按钮
- 点击登录时校验非空
- 写入到 mockServer/data/pages/Login.json，并校验通过
```

Agent 产出的页面核心 DSL（节选）：

```json
{
  "name": "Login",
  "id": "a1b2c3d4e5f6g7h8",
  "app": "1",
  "route": "Login",
  "page_content": {
    "componentName": "Page",
    "fileName": "Login",
    "props": { "className": "login-page" },
    "state": { "form": { "username": "", "password": "" } },
    "methods": {
      "handleSubmit": {
        "type": "JSFunction",
        "value": "function(event) { if (!this.state.form.username || !this.state.form.password) { return; } /* 提交逻辑 */ }"
      }
    },
    "lifeCycles": {},
    "children": [
      {
        "componentName": "TinyInput",
        "id": "input-username",
        "props": {
          "placeholder": "请输入用户名",
          "modelValue": { "type": "JSExpression", "value": "this.state.form.username", "model": true }
        }
      },
      {
        "componentName": "TinyInput",
        "id": "input-password",
        "props": {
          "placeholder": "请输入密码",
          "modelValue": { "type": "JSExpression", "value": "this.state.form.password", "model": true }
        }
      },
      {
        "componentName": "TinyButton",
        "id": "btn-login",
        "props": {
          "text": "登录",
          "type": "primary",
          "onClick": { "type": "JSExpression", "value": "this.handleSubmit" }
        }
      }
    ],
    "dataSource": { "list": [] }
  },
  "tenant": 1,
  "parentId": "0",
  "isPage": true,
  "group": "staticPages",
  "occupier": null,
  "isHome": false
}
```

关键点回顾：输入框用 `model: true` 实现双向绑定；按钮 `onClick` 用 `JSExpression` 引用 `methods` 中的方法；`occupier` 为 `null` 保证可编辑。

## DSL产物校验

Skill 自带校验脚本，通过校验可以避免把不规范的结构带入画布。

一键综合校验（结构 + 事件绑定 + CSS）：

```bash
bash .agents/skills/tinyengine-dsl-generator/scripts/validate_all.sh mockServer/data/pages/Login.json
```

也可以单独运行：

```bash
# 结构校验（必填字段、componentName、meta、ID 等）
node .agents/skills/tinyengine-dsl-generator/scripts/validate_dsl.mjs mockServer/data/pages/Login.json

# 事件绑定检查（确保用 JSExpression 引用方法）
node .agents/skills/tinyengine-dsl-generator/scripts/check_event_bindings.mjs mockServer/data/pages/Login.json

# CSS 语法检查
node .agents/skills/tinyengine-dsl-generator/scripts/check_css.mjs mockServer/data/pages/Login.json basic
```

此外，Skill 内置一份**生成前检查清单（Pre-Generation Checklist）**，Agent 会在落盘前逐条核对，主要包括：事件绑定全部用 `JSExpression`、方法首参为 `event`、`modelValue` 带 `model: true`、应用与页面 ID 统一为整数、生命周期名以 `on` 开头、`occupier` 为 `null`、组件 ID 唯一、CSS 类名用 `className`。完整清单见 [SKILL.md](https://github.com/opentiny/tiny-engine/blob/develop/.agents/skills/tinyengine-dsl-generator/SKILL.md)。

## Skill 中的关键规则（速查）

| 场景 | 正确做法 | 常见错误 |
| --- | --- | --- |
| 事件绑定 | `JSExpression` 引用方法：`{ "type": "JSExpression", "value": "this.handleSubmit" }` | 用 `JSFunction` 写内联函数 |
| 方法参数 | 方法签名首参恒为 `event`，额外参数经 `params` 追加 | 漏掉 `event` 导致取参错位 |
| 双向绑定 | `modelValue` 带 `"model": true` | 用 `model: { prop: ... }` 或省略，输入框不生效 |
| 生命周期 | 名称以 `on` 开头（`onMounted`），用带函数名的完整函数体 | 用 `mounted` 或匿名函数 |
| 可编辑性 | `"occupier": null` | 写入用户对象，画布提示被占用 |
| CSS 类名 | 使用 `className` | 使用 `class` |
| 组件 ID | 全局唯一 | 复用 ID 导致渲染/选中异常 |
| 保留名 | 禁止自定义组件叫 `Page`/`Block`/`Text`/`Template`/`Slot`/`Collection` | 与内置容器冲突 |

## 常见问题

### 页面在设计器中不可编辑 / 提示被占用

检查页面 / 区块 JSON 的 `occupier` 字段，必须为 `null`。AI 直接落盘的文件若带了占用者信息会导致无法进入编辑。

### 输入框无法输入 / 数据不回填

确认输入组件的 `modelValue` 绑定带了 `"model": true`，且引用的 `state` 变量已在 `state` 中声明。

### 按钮点击无反应 / 事件不触发

事件绑定（`onClick`/`onChange`/`onKeyup` 等）必须用 `JSExpression` 引用 `methods` 中定义的方法，且方法名正确。不要把函数定义直接写在事件绑定的 `value` 里。

### 设计器里看不到新生成的页面

依次排查：

1. MockServer 是否以 `MOCK_DB_MODE=file` 启动；
2. 文件是否在 `mockServer/data/pages/` 下，且文件名与记录 `name` 一致；
3. 页面的 `app` 字段是否与当前应用的 `id` 匹配；
4. `route` 是否与同应用内已有页面重复被唯一性约束拦截。

### 想让团队复用生成的页面 / 应用

直接把 `mockServer/data/` 下的 JSON 提交到 Git。其他人拉取后以 File 模式启动即可看到同样的页面配置与变更历史。需要迁回 DB 模式时，使用迁移脚本即可（两模式格式兼容）。

## 相关文档

- [DSL Skill](https://github.com/opentiny/tiny-engine/blob/develop/.agents/skills/tinyengine-dsl-generator/SKILL.md)
