# TinyEngine 操作指南

## 概述
本文档包含 TinyEngine 低代码平台的标准操作流程和最佳实践。所有操作都必须严格遵循这些指南。

## 实战案例

### 案例1：创建用户管理页面（复杂任务）

**用户需求**："创建一个完整的用户管理页面"

**使用 Sequential Thinking 规划**：
```
Thought 1/5: 分析需求，用户管理页面需要：列表展示、搜索、新增、编辑、删除
Thought 2/6: 设计页面结构：顶部搜索栏、中间表格、操作按钮
Thought 3/6: 规划状态管理：用户列表、搜索条件、编辑状态
Thought 4/6: 设计交互流程：搜索→列表更新、点击编辑→弹窗
Thought 5/7: 发现需要添加分页功能（调整总数）
Thought 6/7: 确定实施顺序：1.基础布局 2.状态 3.方法 4.样式
Thought 7/7: 生成执行计划并验证完整性
```

**执行步骤**：
1. 使用资源学习页面结构设计
2. 添加页面状态（用户列表、分页信息）
3. 添加搜索和CRUD方法
4. 创建组件结构（搜索框、表格、按钮）
5. 配置组件属性和事件绑定
6. 添加样式美化

### 案例2：样式优化（简单任务，无需Sequential Thinking）

**用户需求**："优化按钮样式"

**直接执行**：
1. 获取当前组件信息
2. 查看可用的Tailwind类
3. 设置className属性

---

## 通用操作原则

### 资源学习流程
1. **识别任务类型** - 理解用户需求
2. **评估复杂度** - 判断是否需要分步思考
3. **查找协议文档** - 理解数据结构
4. **查找示例文档** - 学习操作方法
5. **获取当前状态** - 了解现有配置
6. **制定操作方案** - 使用sequential_thinking规划复杂任务
7. **执行操作** - 按照示例步骤执行
8. **验证结果** - 确认操作成功

### 思维工具使用

#### Sequential Thinking 工具
**用途**：处理复杂问题的分步思考和方案制定

**适用场景**：
- 设计完整的页面结构（需要规划组件布局、状态管理、事件处理）
- 重构现有页面（需要分析现状、制定方案、逐步实施）
- 复杂的组件交互设计（需要考虑多种状态和边界情况）
- 不确定最佳方案时的探索性任务
- 需要试错和调整的配置任务
- 多步骤操作的规划和执行

**使用时机**：
1. 用户需求涉及多个相互关联的操作
2. 任务的最终目标明确但路径不清晰
3. 需要权衡多种实现方案
4. 操作可能需要回溯或修正
5. 任务复杂度超过3个步骤

**使用示例**：
- "创建一个完整的用户管理页面" → 需要思考布局、功能、交互
- "优化页面性能" → 需要分析问题、制定方案、逐步优化
- "实现复杂的表单验证" → 需要设计验证规则、错误处理、用户反馈

**与资源学习的配合**：
1. 先用sequential_thinking制定方案
2. 在思考过程中识别需要的资源
3. 查询并学习相关资源
4. 根据学习结果调整方案
5. 执行最终方案

### 工具调用原则
- 复杂任务先用sequential_thinking规划
- 直接执行工具，不返回JSON描述
- 操作前先获取上下文
- 出错时查看错误信息并调整

---

## 常见操作指南

### 0. 复杂任务规划（使用 Sequential Thinking）

**适用场景**：任务涉及多个步骤或需要探索性设计

**标准流程**：
1. 识别任务的复杂度和不确定性
2. 使用 `sequential_thinking` 进行分步思考
3. 在思考中识别需要的资源和工具
4. 根据思考结果制定执行计划
5. 按计划执行，必要时回到思考调整

**示例场景**：
- "创建一个完整的用户管理页面，包含列表、搜索、新增、编辑功能"
- "将现有页面改造成响应式设计"
- "实现一个复杂的多步骤表单向导"

**关键点**：
- 允许动态调整思考步骤数
- 可以修正之前的判断
- 支持探索多种方案
- 生成假设并验证

### 1. 变量绑定操作

**适用场景**：需要将组件属性绑定到页面状态

**标准流程**：
1. 使用 `get_current_selected_node` 获取选中组件信息
2. 使用 `get_page_schema` 查看现有state结构
3. 使用 `edit_page_schema` 添加state变量
4. 使用 `change_node_props` 绑定组件属性到state

**关键点**：
- state变量必须先创建后绑定
- 绑定使用JSExpression格式：`this.state.variableName`
- 支持计算属性和访问器

### 2. 样式修改操作

**适用场景**：需要修改组件的视觉样式

**标准流程**：
1. 获取当前组件信息
2. 阅读CSS协议章节了解结构
3. 阅读CSS示例章节学习方法
4. 根据场景选择合适的样式方式：
   - 通用样式 → edit_page_schema 添加CSS类 + change_node_props 设置className
   - 快速样式 → 直接使用 Tailwind CSS 类
   - 动态样式 → 可使用 style 属性（特殊情况）

**关键点**：
- 优先使用 className + CSS 类（最佳实践）
- Tailwind CSS 适合快速开发
- style 属性仅用于必要场景（如动态计算值）
- merge策略在末尾追加CSS

**样式方式选择**：
- **className + CSS**：通用、可复用、易维护（推荐）
- **Tailwind CSS**：快速、响应式、原子化
- **style属性**：动态值、一次性样式（谨慎使用）

### 3. 事件处理操作

**适用场景**：为组件添加交互功能

**标准流程**：
1. 阅读methods示例了解函数格式
2. 使用 `edit_page_schema` 添加方法到methods
3. 使用 `change_node_props` 绑定事件属性

**关键点**：
- 方法必须是JSFunction格式
- 事件绑定使用JSExpression
- 方法名称要语义化

### 4. 页面创建操作

**适用场景**：创建新页面

**标准流程**：
1. 使用 `get_page_list` 查看现有页面
2. 使用 `add_page` 创建页面
3. 使用 `edit_page_in_canvas` 切换到新页面
4. 根据需要配置页面schema

**关键点**：
- 页面名称首字母大写
- 路由只能包含英文、数字、下划线、连字符
- 可指定父级页面ID

### 5. 组件添加操作

**适用场景**：向页面添加新组件

**标准流程**：
1. 使用 `get_component_list` 查看可用组件
2. 使用 `get_page_schema` 了解页面结构
3. 使用 `add_node` 添加组件
4. 使用 `change_node_props` 配置组件属性

**关键点**：
- 需要指定父节点ID或添加到根节点
- 可以指定相对位置(before/after)
- 组件props根据组件类型而定

### 6. 国际化配置

**适用场景**：添加多语言支持

**标准流程**：
1. 使用 `get_i18n` 查看现有配置
2. 使用 `add_i18n` 添加新的翻译项
3. 在组件中使用i18n表达式引用

**关键点**：
- key格式通常为 `lowcode.xxxxx`
- 必须同时提供zh_CN和en_US
- 使用JSExpression引用：`this.i18n('key')`

### 7. 工具函数管理

**适用场景**：添加可复用的函数或NPM依赖

**标准流程**：
1. 使用 `get_utils_tool` 查看现有工具
2. 使用 `add_or_edit_utils_tool` 添加新工具
3. 在页面methods中调用工具函数

**关键点**：
- 支持function和npm两种类型
- NPM类型需要指定package和exportName
- function类型需要提供完整函数代码

---

## 错误处理指南

### 常见错误及解决方案

**state不是对象**
- 错误：将state写成数组
- 解决：确保state是键值对对象

**方法格式错误**
- 错误：methods的值不是JSFunction
- 解决：使用 `{ type: "JSFunction", value: "..." }`

**样式修改选择**
- 问题：不知道该用哪种样式方式
- 解决：
  - 通用可复用 → className + CSS
  - 快速原型 → Tailwind CSS  
  - 动态计算 → style 属性
  - 默认选择 → className + CSS

**merge策略误解**
- 错误：期望深层合并
- 解决：理解merge只做顶层键合并

**CSS追加遗漏换行**
- 错误：新CSS与旧CSS黏连
- 解决：在CSS字符串开头添加 `\n`

---

## 决策树

### 任务复杂度评估

```
收到用户请求
├─ 评估任务复杂度
│   ├─ 简单任务（1-2步）？
│   │   └─ 直接执行操作
│   │
│   ├─ 中等复杂（3-5步）？
│   │   ├─ 路径清晰？ → 按流程执行
│   │   └─ 路径不明？ → 使用 sequential_thinking
│   │
│   └─ 高度复杂（5步以上）？
│       └─ 必须使用 sequential_thinking 规划
│
└─ 使用 sequential_thinking 的判断
    ├─ 需要设计完整方案？ → 是
    ├─ 涉及多个相关操作？ → 是
    ├─ 可能需要试错调整？ → 是
    ├─ 初始范围不明确？ → 是
    └─ 需要权衡多种方案？ → 是
```

### 需要修改页面？

```
判断修改类型
├─ 结构修改？
│   ├─ 添加组件 → 使用 add_node
│   ├─ 删除组件 → 使用 del_node
│   └─ 修改属性 → 使用 change_node_props
│
├─ 样式修改？
│   ├─ 有Tailwind类？ → 直接设置className
│   └─ 需要自定义？ → edit_page_schema添加CSS + 设置className
│
├─ 状态修改？
│   ├─ 添加变量 → edit_page_schema的state.add
│   ├─ 更新变量 → edit_page_schema的state.update
│   └─ 删除变量 → edit_page_schema的state.remove
│
├─ 逻辑修改？
│   ├─ 添加方法 → edit_page_schema的methods
│   └─ 添加生命周期 → edit_page_schema的lifeCycles
│
└─ 综合设计？
    └─ 使用 sequential_thinking 制定完整方案
```

### 资源查询策略

```
需要学习操作？
├─ 知道具体功能？
│   ├─ 是 → search_resources精确搜索
│   └─ 否 → discover_resources浏览探索
│
├─ 找到相关资源？
│   ├─ 协议文档 → 理解结构
│   ├─ 示例文档 → 学习方法
│   └─ 操作指南 → 掌握流程
│
└─ 准备执行？
    ├─ 已读协议？ → 继续
    ├─ 已读示例？ → 继续
    └─ 已获取状态？ → 执行操作
```

---

## 最佳实践

### DO - 推荐做法
- ✅ 先查看再修改
- ✅ 分步骤执行复杂操作
- ✅ 使用语义化命名
- ✅ 添加必要的注释
- ✅ 验证操作结果
- ✅ 保持样式模块化
- ✅ 使用Tailwind优先

### DON'T - 避免错误
- ❌ 凭记忆执行操作
- ❌ 跳过资源学习
- ❌ 过度使用style属性（仅特殊场景使用）
- ❌ 使用replace策略而不备份
- ❌ 忽略错误信息
- ❌ 创建过于通用的CSS选择器
- ❌ 在不了解结构时修改

---

## 资源引用

### 必读资源
- 页面Schema协议：`tinyengine://docs/page-schema`
- 操作示例集合：`tinyengine://docs/edit-page-schema-examples`

### 分节资源
- State操作：`tinyengine://docs/edit-page-schema-examples/state`
- CSS操作：`tinyengine://docs/edit-page-schema-examples/css`
- Methods操作：`tinyengine://docs/edit-page-schema-examples/methods`
- 最佳实践：`tinyengine://docs/edit-page-schema-examples/do-dont`

### 查询策略
1. 使用 `discover_resources` 探索可用资源
2. 使用 `search_resources` 精确查找
3. 使用 `read_resources` 深入学习

---

*记住：所有操作都必须基于资源学习，不得凭假设执行。*
