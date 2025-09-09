require('dotenv').config({ path: '../.env' });
const { OpenAI } = require("openai");
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const { postProcessSchemas } = require('./post-process-schemas.js');

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  timeout: 600000 // 10分钟超时
});

/**
 * 读取文件内容（支持绝对路径和相对路径）
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 文件内容
 */
async function readFileContent(filePath) {
  try {
    // 解析为绝对路径
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    // 检查文件是否存在
    await fs.access(absolutePath);
    const content = await fs.readFile(absolutePath, 'utf8');
    console.log(`✅ 成功读取文件：${absolutePath}`);
    return content;
  } catch (error) {
    throw new Error(`读取文件失败 [${filePath}]：${error.message}`);
  }
}

/**
 * 批量读取文件（支持逗号分隔的多路径）
 * @param {string} pathsStr - 逗号分隔的文件路径字符串
 * @returns {Promise<Array<{filename: string, content: string}>>} 文件名+内容数组
 */
async function batchReadFiles(pathsStr) {
  if (!pathsStr) return [];

  // 分割路径、去重、过滤空路径
  const paths = [...new Set(pathsStr.split(',').map(p => p.trim()).filter(Boolean))];
  const result = [];

  for (const filePath of paths) {
    const content = await readFileContent(filePath);
    // 提取文件名及后缀
    const filename = path.basename(filePath);
    result.push({ filename, content });
  }
  return result;
}

/**
 * 处理文件内容：分类并拼接不同类型的文件内容
 * @param {Array<{filename: string, content: string}>} typeFiles - 待处理的文件数组
 * @returns {Object} 包含各类文件拼接内容的对象
 */
function processFileContents(typeFiles) {
  // 按文件类型分组处理内容
  const groupedFiles = {
    ts: [],
    dts: [],
    vueDjs: []
  };

  // 分类文件
  typeFiles.forEach(({ filename, content }) => {
    if (filename.endsWith('.ts')) {
      groupedFiles.ts.push({ filename, content });
    } else if (filename.endsWith('.d.ts')) {
      groupedFiles.dts.push({ filename, content });
    } else if (filename.endsWith('.vue.d.js')) {
      groupedFiles.vueDjs.push({ filename, content });
    }
  });

  // 拼接TS文件内容
  const tsContentStr = groupedFiles.ts.map(({ filename, content }) =>
    `### TypeScript文件：${filename}\n\`\`\`typescript\n${content}\n\`\`\``
  ).join('\n\n') || '无TS类型文件';
  console.log(`✅ 构建TS文件内容成功，长度为：${tsContentStr.length}`);

  // 拼接d.ts文件内容
  const dtsContentStr = groupedFiles.dts.map(({ filename, content }) =>
    `### 类型声明文件：${filename}\n\`\`\`typescript\n${content}\n\`\`\``
  ).join('\n\n') || '无d.ts类型声明文件';
  console.log(`✅ 构建d.ts文件内容成功，长度为：${dtsContentStr.length}`);

  // 拼接.vue.d.js文件内容
  const vueDjsContentStr = groupedFiles.vueDjs.map(({ filename, content }) =>
    `### Vue编译文件：${filename}\n\`\`\`javascript\n${content}\n\`\`\``
  ).join('\n\n') || '无.vue.d.js编译文件';
  console.log(`✅ 构建.vue.d.js文件内容成功，长度为：${vueDjsContentStr.length}`);

  return {
    tsContentStr,
    dtsContentStr,
    vueDjsContentStr
  };
}

/**
 * 保存物料JSON（每个组件单独保存）
 * @param {Array<object>} materialJsonArray - 物料JSON数组
 * @returns {Array<string>} 所有保存路径的数组
 */
function saveMaterialJson(materialJsonArray) {
  try {
    // 创建保存目录
    const materialDir = path.join(__dirname, '../code-to-material-output');
    if (!fsSync.existsSync(materialDir)) {
      fsSync.mkdirSync(materialDir, { recursive: true });
      console.log(`📂 创建物料保存目录：${materialDir}`);
    }

    const timestamp = new Date().getTime();
    const savePaths = [];

    // 遍历数组，每个组件单独保存
    materialJsonArray.forEach((materialJson, index) => {
      // 获取顶层component字段作为文件名主体（兼容异常情况）
      const componentName = materialJson.component || `Component-${index}-${timestamp}`;
      const fileName = `${componentName}-${timestamp}.json`;
      const filePath = path.join(materialDir, fileName);

      // 格式化保存单个组件JSON
      const content = JSON.stringify(materialJson, null, 2);
      fsSync.writeFileSync(filePath, content, 'utf8');
      savePaths.push(filePath);
      console.log(`📁 组件JSON已保存至：${filePath}`);
    });

    return savePaths;
  } catch (error) {
    throw new Error(`保存物料JSON失败：${error.message}`);
  }
}

/**
 * 适配 postProcessSchemas 格式：将物料JSON数组转换为 conversionResults 结构
 * @param {Array<object>} materialJsonArray - 你的代码生成的物料JSON数组
 * @returns {Array<object>} 符合 postProcessSchemas 要求的 conversionResults 数组
 */
function adaptToPostProcessFormat(materialJsonArray) {
  // 过滤无效的 schema（确保每个元素是对象且包含 component 字段）
  const validSchemas = materialJsonArray.filter(schema =>
    typeof schema === 'object' && schema !== null && !Array.isArray(schema) && schema.component
  );

  // 映射为 conversionResults 结构
  const result = validSchemas.map(schema => ({
    // subComponentName：优先取 schema.component（如 "ElTable"），移除前缀后作为组件名
    subComponentName: extractSubComponentName(schema.component),
    schema: schema, // 直接传递单个组件的 JSON Schema
    success: true // 标记为转换成功（你的代码生成的 schema 均视为成功）
  }));
  console.log(`✅ 构建转换结果成功，subComponentName 列表：${result.map(item => item.subComponentName).join(', ')}`);

  return result;
}

/**
 * 辅助函数：从 schema.component 中提取 subComponentName（移除组件库前缀）
 * 例如："ElTable" → "Table"，"ElTableColumn" → "Table-column"，"TinyButton" → "Button"
 * @param {string} componentFullName - schema.component 字段（如 "ElTable"）
 * @returns {string} 提取后的子组件名
 */
function extractSubComponentName(componentFullName) {
  if (!componentFullName) return "UnknownComponent";

  // 常见组件库前缀映射（可根据实际需求扩展）
  const prefixMap = [
    { prefix: "El", separator: "" }, // Element-plus：ElTable → Table
    { prefix: "Tiny", separator: "" }, // TinyVue：TinyButton → Button
    { prefix: "Vuetify", separator: "" } // Vuetify：VuetifyCard → Card
  ];

  // 匹配前缀并移除
  for (const { prefix, separator } of prefixMap) {
    if (componentFullName.startsWith(prefix)) {
      const baseName = componentFullName.slice(prefix.length);
      return baseName
    }
  }
  console.log(`提取到的SubComponentName为：${componentFullName}`)

  // 无匹配前缀时，直接返回原始名称
  return componentFullName;
}

/**
 * 构建大模型Prompt
 * @param {object} inputData - 输入数据
 * @returns {Array<object>} 大模型消息数组
 */
function buildPrompt(inputData) {
  const { typeFiles, packageJsonContent, metadata } = inputData;
  
  // 调用封装的函数处理文件内容
  const { tsContentStr, dtsContentStr, vueDjsContentStr } = processFileContents(typeFiles);

  return [
    {
      role: "system",
      content: `你是一位精通 Vue 3 Composition API、TypeScript 及低代码平台组件集成的资深架构师。你的任务是接收一个 Vue 组件的源代码及相关项目文件，然后生成一个完全符合指定规则、高度精确且信息丰富的 JSON Schema 文件，用于驱动低代码平台。你的输出必须是一个完整的、格式正确的 JSON 对象，不包含任何额外的解释性文字。`
    },
    {
      role: "user",
      content: `# 任务：Vue 组件 Schema 生成器 (专业级)

## 输入数据
### 1. TypeScript 代码 (.ts)
\`\`\`typescript
${tsContentStr}
\`\`\`

### 2. 类型声明文件 (.d.ts)
\`\`\`typescript
${dtsContentStr}
\`\`\`

### 3. Vue编译文件 (.vue.d.js)
\`\`\`javascript
${vueDjsContentStr}
\`\`\`

### 4. package.json
\`\`\`json
${packageJsonContent}
\`\`\`

### 5. 组件元数据 (可选)
${JSON.stringify(metadata || {}, null, 2)}

---

## 前置检查：验证输入信息
**以下项目是必需的：**
1. 组件源代码(.ts 或 .d.ts 或 .vue.d.js)
2. package.json

**以下项目是可选的：**
* 组件元数据
    *   \`中文名称 (zh_CN)\`: 如果未提供，从组件的 \`defineComponent({ name: '...' })\` 中提取 \`name\` 值。
    *   \`图标 (icon)\`: 如果未提供，从组件的 \`defineComponent({ name: '...' })\` 中提取 \`name\` 值。
    *   \`描述 (description)\`
    *   \`标签 (tags)\`
    *   \`关键词 (keywords)\`
    *   \`文档链接 (doc_url)\`

**如果必需信息缺失，请返回明确的缺失提示，否则继续执行生成步骤。**

---

## 组件识别核心指令（优先级最高，所有逻辑必须服从）

### 1. 识别范围与规则锁定
- 从输入的.vue和.ts文件内容中提取组件，**严格限制在以下预设的多组件关系列表内**，不允许识别列表外的任何组件组合：
  1. Button 相关：仅识别 Button、ButtonGroup
  2. Checkbox 相关：仅识别 Checkbox、CheckboxGroup、CheckboxButton
  3. Radio 相关：仅识别 Radio、RadioGroup、RadioButton
  4. Cascader 相关：仅识别 Cascader、CascaderPanel
  5. Tag 相关：仅识别 Tag、CheckTag
  6. Statistic 相关：仅识别 Statistic、Countdown
  7. Image 相关：仅识别 Image、Image Viewer
  8. Table 相关：仅识别 Table、Table-column（禁止识别 TableFilterPanel 等无关组件）
  9. TableV2 相关：仅识别 TableV2、Column
  10. Splitter 相关：仅识别 Splitter、SplitterPanel
  11. Transfer 相关：仅识别 Transfer、Transfer Panel
  12. Form 相关：仅识别 Form、FormItem
  13. Carousel 相关：仅识别 Carousel、Carousel-Item
  14. Collapse 相关：仅识别 Collapse、Collapse Item
  15. Descriptions 相关：仅识别 Descriptions、DescriptionsItem
  16. Skeleton 相关：仅识别 Skeleton、SkeletonItem
  17. Timeline 相关：仅识别 Timeline、Timeline-Item
  18. Breadcrumb 相关：仅识别 Breadcrumb、BreadcrumbItem
  19. Dropdown 相关：仅识别 Dropdown、Dropdown-Menu、Dropdown-Item
  20. Tour 相关：仅识别 Tour、TourStep
  21. Anchor 相关：仅识别 Anchor、AnchorLink
  22. Steps 相关：仅识别 Steps、Step
  23. Tabs 相关：仅识别 Tabs、Tab-pane、Tab-nav
  24. Layout 相关：仅识别 Row、Col
  25. Select 相关：仅识别 Select、Option Group、Option
  26. Menu 相关：仅识别 Menu、SubMenu、Menu-Item、Menu-Item-Group
  27. Container 相关：仅识别 Container、Header、Aside、Main、Footer
  28. Config Provider 相关：仅识别 Config Provider、Button、Card、Dialog、Message

### 2. 独立组件定义（强制遵守）
- 列表中每个组件均为独立组件（如 Form 和 FormItem 是两个独立组件，必须分别生成JSON）。
- 未在列表中出现的组件，按单个独立组件处理，但**禁止将列表内组件与列表外组件合并识别**（例如 Table 只能与 Table-column 共存，不能与 TableFilterPanel 等列表外组件同时出现）。

### 3. 校验与修正机制
- 识别完成后，必须执行以下检查：
  1. 检查是否包含列表外组件（如 TableFilterPanel、自定义扩展组件等），若有则**立即删除**；
  2. 检查列表内组件是否完整（如识别到 Table 时必须同时识别 Table-column，缺一不可），若缺失则**报错并终止处理**；
  3. 统计独立组件数量时，必须与列表中的组件一一对应，不允许多报或少报。

---

## 生成规则
### 第一步：顶层字段填充
- \`component\`: 从组件的 \`defineComponent({ name: '...' })\` 中提取 \`name\` 值。
- \`name.zh_CN\`: 
  - 若组件元数据提供中文名称则使用，否则根据组件名\`component\`智能翻译（如Button→按钮、From→表单等）
- \`icon\`: 
  - 若组件元数据提供则使用，否则默认使用 \`component\` 值的「核心标识」（小写），规则如下：
    - 若为 tinyVue 组件，直接使用组件名小写（如 "Tooltip"→"tooltip"）
    - 若为其他组件库（如 element-plus），移除前缀标识后转为小写（如 "ElForm"→"form"、"ElButton"→"button"）
- \`group\`: 固定为"element-plus"
- \`category\`: 固定为"element-plus"
- \`description\`: 如果 \`组件元数据\` 中提供了 \`description\`，则使用该值；否则默认为 \`""\`。
- \`tags\`: 如果 \`组件元数据\` 中提供了 \`tags\`，则使用该值；否则默认为 \`""\`。
- \`keywords\`: 如果 \`组件元数据\` 中提供了 \`keywords\`，则使用该值；否则默认为 \`""\`。
- \`doc_url\`: 如果 \`组件元数据\` 中提供了 \`doc_url\`，则使用该值；否则默认为 \`""\`。
- \`devMode\`: 固定为"proCode"

### 第二步：npm 对象构建
根据 \`package.json\` 的内容，动态构建 \`npm\` 对象：
- \`package\`: 从package.json读取 \`name\` 字段
- \`exportName\`: **必须**与顶层 \`component\` 字段的值保持一致。
- \`version\`: 从package.json读取 \`version\` 字段
- \`script\`: 格式为"http://192.168.0.212:4874/{package}@{version}/js/web-component.mjs"
- \`destructuring\`: 固定为true

### 第三步：configure 对象构建
生成完整的 \`configure\` 对象，包含以下所有字段：
#### 基础行为控制
- \`loop\`: 固定为 \`true\`（支持循环渲染）
- \`condition\`: 固定为 \`true\`（支持条件渲染）
- \`styles\`: 固定为 \`true\`（支持样式配置）

#### 组件类型标识
- \`isContainer\`: 根据组件分析决定：
  - 如果组件模板中包含 \`<slot>\` 标签，设置为 \`true\`
  - 如果组件名称暗示容器用途（如 Layout、Container、Wrapper），设置为 \`true\`
  - 否则设置为 \`false\`
- \`isModal\`: 固定为 \`false\`（除非明确是模态框）
- \`isPopper\`: 固定为 \`false\`（除非明确是弹出框）
- \`isNullNode\`: 固定为 \`false\`
- \`isLayout\`: 根据组件用途判断，Layout 类组件设置为 \`true\`，否则为 \`false\`

#### 嵌套规则
- \`nestingRule\`: 对象包含以下字段，通常设置为默认值：
    - \`childWhitelist\`: \`""\`（允许的子组件白名单，通常为空）
    - \`parentWhitelist\`: \`""\`（允许的父组件白名单，通常为空）
    - \`descendantBlacklist\`: \`""\`（禁止的后代组件黑名单，通常为空）
    - \`ancestorWhitelist\`: \`""\`（允许的祖先组件白名单，通常为空）

#### 编辑器配置
- \`rootSelector\`: ""
- \`shortcuts.properties\`: 识别出组件最核心、最常用的 1-3 个 props，填入此数组
- \`contextMenu\`: 对象包含：
  - \`actions\`: 默认为 \`["copy", "remove", "insert", "updateAttr", "bindEevent"]\`
  - \`disable\`: 默认为 \`[]\`

#### 交互行为 (可选字段，根据组件类型添加)：
- \`clickCapture\`: 对于按钮类、交互类组件设置为 \`true\`，其他组件可省略或设置为 \`false\`
- \`framework\`: 如果是第三方组件库保持原值，自定义组件设置为 \`"Vue"\`

### 第四步：schema.properties (Props 分组映射)
将 Vue 组件的所有 props 按逻辑功能分组，生成一个**严格的数组（Array）**，直接包含分组对象：
**分组策略**：
*   **基础属性**: 核心功能相关的 props（如 name、size、type 等）
*   **样式属性**: 外观、颜色、尺寸相关的 props（如 width、height、backgroundColor、color 等）
*   **行为属性**: 交互、事件、状态相关的 props（如 disabled、loading、onClick 等）
*   **高级属性**: 可选的、专业配置项（如复杂对象配置、高级选项等）
*   **其他属性**: 无法归属到 “基础/样式/行为/高级属性” 的特殊配置项，这类属性通常不具备前四类分组的明确功能共性

**每个分组对象必须包含**：
- \`name\`: 分组标识符，使用数字字符串（"0"|"1"|"2"|"3"，按分组顺序递增）
- \`label.text.zh_CN\`: 组的中文显示名称（必须从以下选项中选择："基础属性"|"样式属性"|"行为属性"|"高级属性"|"其他属性"）
- \`description.zh_CN\`: 分组的中文描述
- \`content\`: 该分组下的具体属性配置数组，数组中的每个属性对象必须包含以下固定字段：
  - \`property\`: prop的名称
  - \`label.text.zh_CN\`: 中文标签
  - \`description\`: 中文描述
  - \`required\`: 根据 Vue Prop 的 \`required\` 字段决定，默认为 \`false\`
  - \`readOnly\`: 固定为 \`false\`
  - \`disabled\`: 固定为 \`false\`
  - \`cols\`: 固定为 \`12\`
  - \`labelPosition\`: 固定为 \`"left"\`
  - \`type\`: Vue 类型转换为小写字符串
  - \`defaultValue\`: Vue Prop 的默认值（"—" 转为 \`null\`；"undefined" 转为 \`null\`）
  - \`widget\`: 根据以下规则推断

**Widget 推断规则 (按优先级顺序)**：
1. **validator 函数解析 (最高优先级)**:
  - 如果 Prop 定义中存在 \`validator\` 函数，解析函数体中的选项数组
  - 设置 \`widget.component\` 为 \`"SelectConfigurator"\`
  - 设置 \`widget.props.options\` 为解析出的选项数组
2. **属性名称模式匹配**:
  - 名称包含 \`color\` 或默认值以 \`#\` 开头 -> \`"ColorConfigurator"\`, props: \`{}\`
  - 名称包含 \`icon\` -> \`"InputConfigurator"\`, props: \`{ "placeholder": "请输入图标名称" }\`
3. **Vue 类型 + 语义推断**:
  - \`Boolean\` 类型:
    - 开关语义 (show*, enable*, is*) -> \`"SwitchConfigurator"\`, props: \`{}\`
    - 选项语义 (disabled, loading, plain, round, circle) -> \`"CheckBoxConfigurator"\`，props: \`{}\`
  - \`Number\` 类型 -> \`"NumberConfigurator"\`，根据属性名称设置 props:
    - 尺寸类 (width, height, size): \`{ "min": 50, "max": 2000, "step": 10 }\`
    - 角度类 (rotate, angle): \`{ "min": 0, "max": 360, "step": 1 }\`
    - 比例类 (scale): \`{ "min": 0.1, "max": 5, "step": 0.1 }\`
    - 时间类 (duration, delay): \`{ "min": 0, "max": 50, "step": 0.1 }\`
    - 默认: \`{ "step": 1 }\`
  - \`String\` 类型 -> \`"InputConfigurator"\`，props: \`{ "placeholder": "请输入..." }\`
  - \`Object\`/\`Array\` 类型 -> \`"CodeConfigurator"\`，props: \`{ "language": "json", "height": 150 }\`
4. **智能类型分析**:
  - 如果 Prop 类型为 \`Array as PropType<SomeInterface[]>\`，在 \`description\` 中补充接口结构信息

### 第五步：schema.events (事件映射)
- 在组件 \`<script>\` 中搜索所有 \`emit('event-name', ...)\` 的调用；或在.ts文件 搜索所有名称以组件名（如 Form、Button 等组件的具体名称）开头且以 "Emits" 结尾的变量定义（例如形式为export const [组件名]Emits = { ... }的代码结构）。
- 每一个 \`event-name\` (kebab-case) 都对应 \`events\` 对象中的一个键。
- 该键的命名规则为 **\`'on' +\` 将 \`event-name\` 转换为首字母大写的驼峰式 (CamelCase)**。例如，\`emit('menu-item-click')\` 映射为 \`onMenuItemClick\`。
- 分析 \`emit\` 的参数，为该事件生成 \`functionInfo.params\` 数组。
- 每个事件转换为：\`"on[首字母大写驼峰式(CamelCase)的事件名]": {"description": 事件描述, "type": "event", "defaultValue": "", "functionInfo": {"params": [{"name": "","type": "","defaultValue": "","description": {"zh_CN": "事件参数的描述文字"}}],"returns": {"type": "","defaultValue": "","description": {"zh_CN": "事件返回值的描述文字"}}}}\`

### 第六步：schema.slots (插槽分析)
- 扫描组件的 \`<template>\` 部分，寻找所有 \`<slot>\` 标签。
- 对于每一个**具名插槽** (例如 \`<slot name="menu-items">\`)，在 \`schema.slots\` 对象中为其添加一个条目。
- 该条目的键为插槽名 (\`menu-items\`)，值为一个包含 \`label.zh_CN\` 和 \`description.zh_CN\` 的对象，用于描述该插槽的用途。

### 第七步：snippets (智能代码片段生成)
- 任务：为组件生成**符合实际使用场景**的有代表性、有意义的代码片段数组（snippets），准确体现组件的典型用法和嵌套关系，用于在组件面板中展示。
- 生成规则：
  - snippets 数组应包含 **一个** 默认代码片段，需完整展示组件的核心用法。
  - 该代码片段必须包含以下字段，且配置需遵循统一要求：
    1. name.zh_CN：填写与组件定义中一致的中文名称，比如 “表格”“表单”“按钮”；
    2. icon：填写与组件定义中一致的图标标识，比如 “table”“form”“button”；
    3. screenshot：固定填空字符串（""），预留截图位置；
    4. snippetName：填写与组件定义中 component 字段一致的完整组件名，比如 “ElTable”“ElForm”；
    5. category：填写与组件定义中一致的组件库归属，比如 “element-plus”；
    6. schema：组件核心配置结构，根据组件的信息与特性，可灵活包含 props（组件自身属性）和 / 或 children（子组件嵌套）。
  - schema 核心规则
    1. 结构选择
      - 容器 / 复合组件（如 ElTable、ElForm）：可单独配置 props（如表格用 data/columns 定义数据与列）、单独配置 children（如表单嵌套 ElFormItem），或两者结合，优先匹配组件原生主流用法；
      - 基础组件（如 ElButton、ElInput）：通过 props 配置业务常用属性（如按钮 type、输入框 placeholder），通过 children 承载文本或辅助组件（如按钮嵌套 Text 组件）。
    2. props 要求
      - 禁用 “请输入”“示例值” 等泛型占位符，填写真实业务场景值（如 “请输入手机号”“提交”）；
      - 复杂类型属性（数组、对象）需提供完整模拟数据（如表格 data 包含 2-4 条真实结构数据）；
      - 关联属性需严格对应（如 ElTable 的 columns.prop 与 data 中的字段名一致）。
    3. children 要求
      - 若有专用子组件，需嵌套组件专用子组件（如 ElForm→ElFormItem、Splitter→SplitterPanel），禁止嵌套无关组件；
      - 嵌套层级符合组件原生用法（如 ElForm→ElFormItem→ElInput），子组件 props 需与父组件逻辑一致。

  - snippets 正确示例：
    1. ElButton 按钮示例：
      "snippets": [
        {
          "name": {
            "zh_CN": "按钮"
          },
          "icon": "button",
          "screenshot": "",
          "snippetName": "ElButton",
          "schema": {
            "children": [
              {
                "componentName": "Text",
                "props": {
                  "text": "按钮文本"
                }
              }
            ]
          },
          "category": "element-plus"
        }
      ]
    2. 表格（ElTable）示例：
      "snippets": [
        {
          "name": {
            "zh_CN": "表格"
          },
          "icon": "grid",
          "screenshot": "",
          "snippetName": "ElTable",
          "schema": {
            "props": {
              "data": [
                {
                  "date": "2016-05-03",
                  "name": "Tom",
                  "address": "No. 189, Grove St, Los Angeles"
                },
                {
                  "date": "2016-05-02",
                  "name": "Tom",
                  "address": "No. 189, Grove St, Los Angeles"
                },
                {
                  "date": "2016-05-04",
                  "name": "Tom",
                  "address": "No. 189, Grove St, Los Angeles"
                },
                {
                  "date": "2016-05-01",
                  "name": "Tom",
                  "address": "No. 189, Grove St, Los Angeles"
                }
              ],
              "columns": [
                {
                  "type": "index"
                },
                {
                  "label": "Date",
                  "prop": "date"
                },
                {
                  "label": "Name",
                  "prop": "name"
                },
                {
                  "label": "Address",
                  "prop": "address"
                }
              ]
            }
          },
          "category": "element-plus"
        }
      ]
    3. 表单（ElForm）示例：
        "snippets": [
          {
            "name": {
              "zh_CN": "表单"
            },
            "icon": "form",
            "screenshot": "",
            "snippetName": "ElForm",
            "schema": {
              "children": [
                {
                  "componentName": "ElFormItem",
                  "props": {
                    "label": "账号",
                    "prop": "account"
                  },
                  "children": [
                    {
                      "componentName": "ElInput",
                      "props": {
                        "modelValue": "",
                        "placeholder": "请输入账号"
                      }
                    }
                  ]
                },
                {
                  "componentName": "ElFormItem",
                  "props": {
                    "label": "密码",
                    "prop": "password"
                  },
                  "children": [
                    {
                      "componentName": "ElInput",
                      "props": {
                        "modelValue": "",
                        "placeholder": "请输入密码",
                        "type": "password"
                      }
                    }
                  ]
                },
                {
                  "componentName": "ElFormItem",
                  "props": {},
                  "children": [
                    {
                      "componentName": "ElButton",
                      "props": {
                        "type": "primary",
                        "style": "margin-right: 10px"
                      },
                      "children": [
                        {
                          "componentName": "Text",
                          "props": {
                            "text": "提交"
                          }
                        }
                      ]
                    },
                    {
                      "componentName": "ElButton",
                      "props": {
                        "type": "primary"
                      },
                      "children": [
                        {
                          "componentName": "Text",
                          "props": {
                            "text": "重置"
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            "category": "element-plus"
          }
        ]

---

## 输出要求
请按最终通过校验的组件数量，为每个组件生成独立JSON文件，最终返回生成完整的 JSON 数组，确保格式正确、无额外文字。无论识别出 1 个还是多个组件，均统一输出 JSON 数组：
- 若识别为单组件：JSON 数组仅包含 1 个元素，该元素为该组件的 schema JSON 对象；
- 若识别为多组件：JSON 数组元素数量与独立组件数量严格一致，每个元素对应一个组件的 schema JSON 对象。
`
    }
  ];
}

/**
 * 调用大模型生成物料JSON
 * @param {Array<object>} promptMessages - Prompt消息数组
 * @returns {Promise<Array<object>>} 生成的物料JSON数组
 */
async function generateMaterialJson(promptMessages) {
  try {
    console.log(`🚀 开始调用大模型生成物料JSON`);
    const startTime = Date.now();

    // 调用OpenAI API
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "Qwen/Qwen3-32B",
      messages: promptMessages,
      temperature: 0.2, // 低温度保证稳定性
      max_tokens: 65536, // 足够长度容纳复杂JSON
    });

    const rawContent = completion.choices[0].message.content.trim();
    console.log(`⏱️  大模型调用完成，耗时：${(Date.now() - startTime) / 1000}秒`);

    // 清理代码块标识（如果有）
    const codeBlockRegex = /^```(json|)\s*([\s\S]*?)\s*```$/i;
    const match = rawContent.match(codeBlockRegex);
    const cleanedContent = match ? match[2].trim() : rawContent;

    // 解析JSON
    try {
      const materialJson = JSON.parse(cleanedContent);
      console.log(`✅ 物料JSON解析成功`);
      return materialJson;
    } catch (parseError) {
      // 保存解析失败的原始内容
      const errorPath = path.join(__dirname, `../code-to-material-output/parse-error-${Date.now()}.txt`);
      fsSync.writeFileSync(errorPath, cleanedContent, 'utf8');
      throw new Error(`物料JSON解析失败，原始内容已保存至${errorPath}：${parseError.message}`);
    }
  } catch (error) {
    throw new Error(`大模型生成失败：${error.message}`);
  }
}

/**
 * 主函数：执行源码转物料JSON流程
 * @param {object} options - 配置选项
 * @param {string} options.filePath - 逗号分隔的组件文件路径（支持.ts、.d.ts、.vue.d.js）
 * @param {string} options.packageJsonPath - package.json路径
 * @param {object} [options.metadata] - 组件元数据（可选）
 */
async function main(options) {
  try {
    console.log(`=== 开始执行组件源码转物料JSON流程 ===`);

    // 1. 批量读取输入文件（支持多种类型文件，package.json单路径）
    const [typeFiles, packageJsonContent] = await Promise.all([
      batchReadFiles(options.filePath), // 多类型文件：[{filename, content}, ...]
      readFileContent(options.packageJsonPath) // package.json单文件
    ]);

    // 2. 构建输入数据
    const inputData = {
      typeFiles,
      packageJsonContent,
      metadata: options.metadata || {}
    };

    // 3. 构建Prompt（包含自定义提示）
    console.log(`📝 正在构建大模型Prompt`);
    const promptMessages = buildPrompt(inputData);

    // 4. 生成物料JSON（大模型返回JSON数组）
    const materialJsonArray = await generateMaterialJson(promptMessages);

    // 5. 保存物料JSON（以时间戳命名，包含所有组件数组）
    const savePaths = saveMaterialJson(materialJsonArray);

    // 6. 适配 postProcessSchemas 格式
    console.log(`🔄 正在适配 postProcessSchemas 输入格式`);
    const conversionResults = adaptToPostProcessFormat(materialJsonArray);
    if (conversionResults.length === 0) {
      throw new Error("无有效组件Schema可传递给postProcessSchemas");
    }
    console.log(`✅ 适配完成，共生成 ${conversionResults.length} 个组件的conversionResults`);

    // 7. 调用 postProcessSchemas 进行后续处理
    console.log(`=== 开始执行 postProcessSchemas 后续处理 ===`);
    const processedResults = await postProcessSchemas(conversionResults);

    console.log(`=== 流程完成 ===`);

    return {
      materialJsonArray,
      savePaths,
      conversionResults,
      processedResults
    };
  } catch (error) {
    console.error(`❌ 流程执行失败：${error.message}`);
    process.exit(1);
  }
}

/**
 * 命令行参数解析
 * @returns {object} 解析后的参数
 */
function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {};

  // 解析参数（格式：--key value）
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }

  // 验证必填参数
  const requiredParams = ['filePath', 'packageJsonPath'];
  const missingParams = requiredParams.filter(param => !options[param]);

  if (missingParams.length > 0) {
    console.error(`❌ 缺少必填参数：${missingParams.join(', ')}`);
    console.log(`\n使用示例：`);
    console.log(`# 基础用法`);
    console.log(`node code-convertor.js --filePath ./component.ts,./component.d.ts,./component.vue.d.js --packageJsonPath ./package.json`);
    console.log(`\n参数说明：`);
    console.log(`--filePath: 组件文件路径（必填，支持.ts、.d.ts、.vue.d.js，多路径用逗号分隔）`);
    console.log(`--packageJsonPath: package.json文件路径（必填）`);
    process.exit(1);
  }

  return options;
}

// 命令行运行入口
if (require.main === module) {
  const cliOptions = parseCliArgs();
  main(cliOptions);
}

// 导出供编程调用
module.exports = {
  main,
  readFileContent,
  generateMaterialJson,
  saveMaterialJson,
  processFileContents // 导出新封装的函数
};
