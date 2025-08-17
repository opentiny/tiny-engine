require('dotenv').config({ path: '../.env' });
const { OpenAI } = require("openai");
const fs = require('fs');
const path = require('path');

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

/**
 * 将生成的schema保存到项目根目录的schema-log文件夹
 * @param {string} schema - 大模型返回的schema字符串（可能包含```json标识）
 * @param {string} subComponentName - 子组件名（用于文件名区分）
 */
function saveSchemaToFile(schema, subComponentName) {
  try {
    let cleanedSchema = schema.trim();
    const codeBlockRegex = /^```(json|javascript|js|)\s*([\s\S]*?)\s*```$/i;
    const match = cleanedSchema.match(codeBlockRegex);

    if (match && match[2]) {
      cleanedSchema = match[2].trim();
      console.log(`子组件[${subComponentName}]：已移除代码块标识`);
    } else {
      console.log(`子组件[${subComponentName}]：未检测到代码块标识`);
    }

    if (!cleanedSchema) {
      throw new Error(`子组件[${subComponentName}]：清理后schema为空`);
    }

    // 解析schema为JSON
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(cleanedSchema);
      console.log(`子组件[${subComponentName}]：schema解析成功`);
    } catch (parseError) {
      const errorLogPath = path.join(__dirname, `../schema-log/parse-error-${subComponentName}-${new Date().getTime()}.json`);
      fs.writeFileSync(errorLogPath, cleanedSchema, 'utf8');
      throw new Error(`子组件[${subComponentName}]：schema解析失败: ${parseError.message}，原始内容已保存至${errorLogPath}`);
    }

    // 定义保存目录
    const schemaDir = path.join(__dirname, '../schema-log');
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
      console.log(`已创建schema保存目录：${schemaDir}`);
    }

    // 生成文件名（含子组件名）
    const timestamp = new Date().getTime();
    const components = Array.isArray(parsedSchema) ? parsedSchema : [parsedSchema];

    components.forEach((componentSchema, index) => {
      const componentName = componentSchema.component
        ? componentSchema.component.replace(/[^a-zA-Z0-9]/g, '-')
        : `${subComponentName}-unknown-${index}`;

      const fileName = `${componentName}-${timestamp}.json`;
      const filePath = path.join(schemaDir, fileName);
      const content = JSON.stringify(componentSchema, null, 2);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`子组件[${subComponentName}]：schema已保存至：${filePath}`);
    });

  } catch (error) {
    console.error(`保存子组件[${subComponentName}] schema失败：${error.message}`);
  }
}

/**
 * 单个子组件API转tinyEngine schema（内部函数，不直接导出）
 * @param {object} apiObj - 单个子组件的API对象
 * @param {string} model - 大模型名称
 * @param {boolean} save - 是否保存到文件
 * @returns {Promise<object>} 包含子组件名和schema的对象
 */
async function convertSingleSubComponent(apiObj, model = process.env.OPENAI_MODEL || "Qwen/Qwen3-32B", save = true) {
  const subComponentName = Object.keys(apiObj.components)[0] || 'unknown-subcomponent';
  console.log(`\n=== 开始转换子组件[${subComponentName}] ===`);

  const messages = [
    {
      role: "system",
      content: `你是专业的组件协议转换工具，负责将组件API文档转换为符合tinyEngine组件协议的标准schema。请严格遵循tinyEngine的规范，确保输出格式正确、信息完整。`
    },
    {
      role: "user",
      content: `# 任务：组件 API 转 tinyEngine 组件协议 schema

你是精通组件协议转换的工程师，需将从网页提取的组件 API 信息（支持多组件库，如 element - plus、tinyVue 等），转换为符合 tinyEngine 组件协议的完整 JSON schema。若输入包含多个组件（如主组件、Group 组件等），需拆分为对应数量的 schema。输出必须是**完整、格式正确的 JSON 对象**，无额外文字。

### 前置检查：输入信息验证
**必需输入**：从网页提取的组件 API 信息，包含以下核心字段：
- \`component\`：组件名称（如 "Button"）
- \`version\`：组件版本（如 "2.3.4"）
- \`description\`：组件描述
- \`components\`：子组件集合（如主组件、Group 组件），每个子组件包含：
  - \`properties\`：属性数组（含 name、description、type、default、enumOptions 等）
  - （可选）\`slots\`：插槽数组（含 name、description 等）
  - （可选）\`exposes\`：暴露的方法/属性数组（含 name、description、type 等）
  - （可选）\`events\`：事件数组（含 name、description、parameters 等）
- （可选）\`notes\`：组件备注（含废弃说明、使用提示等）

**若必需字段缺失，输出需明确提示缺失内容（如 "缺少 components.Button.properties 字段，请补充"）。**

### 转换规则

#### 1. 顶层字段构建
- \`component\`：
  - 若为 tinyVue 组件，直接使用组件名（如 "Tooltip"）
  - 其他组件库（如 element - plus），组件名前加额外标识（如 element - plus 的 Form 组件为 "ElForm"）
- \`name\`：i18n 格式，\`{"zh_CN": 组件中文名称}\`。规则：
  - 若 \`description\` 含中文名称，优先提取（如 "常用的操作按钮"→"按钮"）
  - 否则按组件名语义翻译（如 "Input"→"输入框"，"Select"→"选择器"）
- \`icon\`：默认使用 \`component\` 值（如 "Button"）；若 \`notes\` 有图标提示则替换
- \`group\`：根据组件库识别，如 element - plus 组件填 "element - plus"
- \`category\`：固定为 "element-plus"（可根据实际调整）
- \`description\`：直接使用输入的 \`description\` 值
- \`tags\`：从 \`description\` 提取核心关键词（如 "按钮"→["操作","交互"]）
- \`keywords\`：同 \`tags\`，补充组件名英文（如 ["Button","按钮","操作"]）
- \`doc_url\`：直接使用输入的 \`url\` 值，否则默认为空
- \`version\`：直接使用输入的 \`version\` 值
- \`devMode\`：固定为 "proCode"

#### 2. \`npm\` 对象构建
- \`package\`：根据组件库识别，如 element - plus 填 "element - plus"，tinyVue 填 "@opentiny/vue" 等
- \`exportName\`：
  - 若为 tinyVue 组件，直接使用组件名（如 "Tooltip"）
  - 其他组件库（如 element - plus），组件名前加额外标识（如 element - plus 的 Form 组件为 "ElForm"）

#### 3. \`configure\` 对象构建
- **基础行为控制**：
  - \`loop\`：固定为 \`true\`
  - \`condition\`：固定为 \`true\`
  - \`styles\`：固定为 \`true\`（组件支持样式配置）

- **组件类型标识**：
  - \`isContainer\`： 根据组件分析决定：
    - 若子组件 \`slots\` 数组长度 > 0 则为 \`true\`（含插槽即为容器）
    - 如果组件名称暗示容器用途（如 Layout、Container、Wrapper），设置为 \`true\`
    - 否则设置为 \`false\`
  - \`isModal\`：若组件明确是模态框，则为 \`true\`，否则 \`false\`
  - \`isPopper\`：若组件明确是弹出框，则为 \`true\`，否则 \`false\`
  - \`isNullNode\`：固定为 \`false\`
  - \`isLayout\`：根据组件用途判断，Layout 类组件设置为为 \`true\`，否则 \`false\`

- **嵌套规则**：
  - \`nestingRule\`：\`{"childWhitelist": "","parentWhitelist": "","descendantBlacklist": "","ancestorWhitelist": ""}\`

- **编辑器配置**：
  - \`rootSelector\`：固定为 ""
  - \`shortcuts.properties\`：从 \`properties\` 中选 1 - 3 个核心属性（如 Button 的 "type"|"size"|"disabled"）
  - \`contextMenu\`：\`{"actions": ["copy", "remove", "insert", "updateAttr", "bindEvent"],"disable": []}\`

- **交互行为**：
  - \`clickCapture\`：对于按钮类、交互类组件设置为 \`true\`，其他组件可省略或设置为 \`false\`
  - \`framework\`：根据组件库识别，如 Vue 生态组件填 "Vue"

#### 4. \`schema\` 对象构建
##### 4.1 \`schema.properties\`（Properties 分组）
必须严格按功能将 \`properties\` 划分为不同分组，每组包含：
- \`name\`：分组标识（"0"|"1"|"2"|"3"，按分组顺序递增）
- \`label.zh_CN\`：分组中文名称（必须从以下选项中选择："基础属性"|"样式属性"|"行为属性"|"高级属性"|"其他属性"）
- \`description.zh_CN\`：分组描述（需精准说明该组属性的共同功能，具体为：
  "基础属性"："组件核心功能相关的配置，包括 name、size、type 等核心属性"
  "样式属性"："组件外观、颜色、尺寸相关的配置，包括 width、height、backgroundColor、color 等与视觉呈现相关的属性"
  "行为属性"："组件交互、事件、状态相关的配置，包括 disabled、loading、onClick 等与用户操作和状态相关的属性"
  "高级属性"："组件可选的专业配置项，包括复杂对象配置、高级功能选项等不常用的特殊配置"
  "其他属性"："无法归属到 “基础/样式/行为/高级属性” 的特殊配置项，这类属性通常不具备前四类分组的明确功能共性"
  ）
- \`content\`：属性配置数组，必须覆盖输入中对应子组件的所有 'property'（无遗漏、无额外新增），每个数组元素与一个完整 'property' 严格一一对应，且每个 'property' 必须且只能归属到一个分组（分组逻辑需基于属性功能的关联性，同一分组内的属性应具有明确的功能共性）

**\`content\` 属性映射规则**：
- \`property\`：\`property.name\`（如 "size"）
- \`label.text.zh_CN\`：\`property.name\` 的中文释义（如 "尺寸"）
- \`description\`：\`property.description\`
- \`required\`：若 \`property.default\` 为 "—" 且无默认值则 \`true\`，否则 \`false\`
- \`readOnly\`：固定为 \`false\`
- \`disabled\`：固定为 \`false\`
- \`cols\`：固定为 \`12\`
- \`labelPosition\`：固定为 "left"
- \`type\`：\`property.type\`（转为小写，如 "enum"|"boolean"）
- \`defaultValue\`：\`property.default\`（"—" 转为 \`null\`）
- \`widget\`：按以下优先级推断：
  1. 若 \`type\` 为 "enum"：\`{"component": "SelectConfigurator","props": {"options": property.enumOptions.map(v => ({label: v, value: v}))}}\`
  2. 若 \`type\` 为 "boolean"：
     - 名称含 "show"|"enable"|"is"：\`{"component": "SwitchConfigurator","props": {}}\`
     - 其他（如 "disabled"|"loading"|"plain"|"round"|"circle"）：\`{"component": "CheckBoxConfigurator","props": {}}\`
  3. 若 \`type\` 为 "number"：\`{"component": "NumberConfigurator","props": {"step": 1}}\`
  4. 若 \`type\` 为 "string"：\`{"component": "InputConfigurator","props": {"placeholder": "请输入..."}}\`
  5. 若 \`type\` 为 "Object"或"Array"：\`{"component": "CodeConfigurator","props": { "language": "json", "height": 150 }}\`
  6. 若名称含 "color" 或 默认值以 \`#\` 开头：\`{"component": "ColorConfigurator","props": {}}\`
  7. 若名称含 "icon"：\`{"component": "InputConfigurator","props": { "placeholder": "请输入图标名称" }}\`
  
##### 4.2 \`schema.events\`（事件映射）
- 从 \`components.[子组件].events\` 提取事件（若存在）
- 每个事件转换为：\`"on[首字母大写驼峰式(CamelCase)的事件名]": {"description": 事件描述, "type": "event", "defaultValue": "", "functionInfo": {"params": [{"name": "","type": "","defaultValue": "","description": {"zh_CN": "事件参数的描述文字"}}],"returns": {"type": "","defaultValue": "","description": {"zh_CN": "事件返回值的描述文字"}}}}\`
  - 示例：事件 "validate"→\`"onValidate":{
    "label": {
      "zh_CN": "任一表单项被校验后触发"
    },
    "description": {
      "zh_CN": "任一表单项被校验后触发"
    },
    "type": "event",
    "functionInfo": {
      "params": [],
      "returns": {}
    },
    "defaultValue": ""
  }\`


##### 4.3 \`schema.slots\`（插槽映射）
- 遍历 \`components.[子组件].slots\`，每个插槽映射为：
  - \`[slot.name]\`: \`{"label.zh_CN": slot.name 的中文（如 "default"→"默认内容"）,"description.zh_CN": slot.description}\`
  - 示例：\`"default": {"label.zh_CN": "默认内容","description.zh_CN": "自定义默认内容"}\`

##### 4.4 \`schema.exposes\`（暴露方法/属性）
- 从 \`components.[子组件].exposes\` 提取，每个映射为：
  - \`[expose.name]\`: \`{"type": expose.type,"description": expose.description}\`

#### 5. 多组件处理
若输入 \`components\` 包含多个子组件（如主组件、Group 组件），需按以下规则处理：
- **输出格式**：生成一个**子组件对象数组**，数组中的每个元素对应一个子组件的完整 schema
- **字段对应**：每个子组件的 schema 需包含独立的 \`component\`、\`name\`、\`schema\` 等字段，与该子组件的信息严格对应
- **关联性**：若子组件间存在依赖关系（如 ButtonGroup 包含 Button），无需在 schema 中额外标注，保持各自独立的完整结构即可
- **示例**：若输入包含 "Button" 和 "ButtonGroup" 两个子组件，输出格式为：
  [
    { "component": "ElButton", "name": { "zh_CN": "按钮" }, ... },
    { "component": "ElButtonGroup", "name": { "zh_CN": "按钮组" }, ... }
  ]

#### 6. \`snippets\`（代码片段）
- 任务：为组件生成一个有代表性、有意义的代码片段数组（snippets），用于在组件面板中展示。
- 生成规则：
  - snippets 数组应包含一个默认代码片段。
  - 每个代码片段对象必须包含以下字段：
    - name.zh_CN：组件的中文名称，例如："按钮"。
    - icon：组件对应的图标。
    - snippetName：组件的名称，例如："ElButton"。
    - category：组件库名称，例如："element-plus"。
    - schema.children：此数组是生成的核心。它应包含一个组件对象，其 props 字段应根据组件的核心功能，为最关键的属性设置有意义的示例值。
  - 请确保示例值是能清晰展示组件基本功能的，而不是留空或使用通用占位符。
- 示例参考（以 ElButton 为例）：
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

### 输出要求
严格遵循上述上述规则执行转换，需确保确保字段与输入信息完整映射、格式完全符合 JSON 规范。
- 若输出为单组件,则输出单个 schema JSON 对象；
- 若输出为多组件,则输出 JSON 数组，数组元素数量与子组件数量严格一致（每个元素对应一个子组件的 schema）。
注意:生成的 JSON 必须保证语法完整闭合,生成后需自查 "未闭合的字段名、缺失的引号、未结束的对象 / 数组"，严禁出现 JSON 截断、语法不完整的情况，确保可直接通过 JSON.parse 解析。


### 示例参考
#### 输入：DatePicker 日期选择器原始 API 数据
{
  "url": "https://element-plus.org/zh-CN/component/date-picker.html",
  "name": "DatePicker 日期选择器",
  "description": "用于选择或输入日期",
  "version": "2.10.7",
  "components": {
    "DatePicker": {
      "properties": [
        {
          "name": "model-value / v-model",
          "description": "绑定值，如果它是数组，长度应该是 2",
          "type": "number / string / object",
          "默认": "''"
        },
        {
          "name": "readonly",
          "description": "只读",
          "type": "boolean",
          "默认": "false"
        },
        {
          "name": "disabled",
          "description": "禁用",
          "type": "boolean",
          "默认": "false"
        },
        {
          "name": "size",
          "description": "输入框尺寸",
          "type": "enum",
          "默认": "—",
          "enumOptions": [
            "",
            "large",
            "default",
            "small"
          ]
        },
        {
          "name": "editable",
          "description": "文本框可输入",
          "type": "boolean",
          "默认": "true"
        },
        {
          "name": "clearable",
          "description": "是否显示清除按钮",
          "type": "boolean",
          "默认": "true"
        },
        {
          "name": "placeholder",
          "description": "非范围选择时的占位内容",
          "type": "string",
          "默认": "''"
        },
        {
          "name": "start-placeholder",
          "description": "范围选择时开始日期的占位内容",
          "type": "string",
          "默认": "—"
        },
        {
          "name": "end-placeholder",
          "description": "范围选择时结束日期的占位内容",
          "type": "string",
          "默认": "—"
        },
        {
          "name": "type",
          "description": "显示类型",
          "type": "enum",
          "默认": "date",
          "enumOptions": [
            "year",
            "years |month",
            "months",
            "date",
            "dates",
            "datetime",
            "week",
            "datetimerange",
            "daterange",
            "monthrange",
            "yearrange"
          ]
        },
        {
          "name": "format",
          "description": "显示在输入框中的格式",
          "type": "参见 date formats",
          "默认": "YYYY-MM-DD"
        },
        {
          "name": "popper-class",
          "description": "DatePicker 下拉框的类名",
          "type": "string",
          "默认": "—"
        },
        {
          "name": "popper-options",
          "description": "自定义 popper 选项，更多请参考 popper.js",
          "type": "object",
          "默认": "{}"
        },
        {
          "name": "range-separator",
          "description": "选择范围时的分隔符",
          "type": "string",
          "默认": "'-'"
        },
        {
          "name": "default-value",
          "description": "可选，选择器打开时默认显示的时间",
          "type": "object",
          "默认": "—"
        },
        {
          "name": "default-time",
          "description": "范围选择时选中日期所使用的当日内具体时刻",
          "type": "object",
          "默认": "—"
        },
        {
          "name": "value-format",
          "description": "可选，绑定值的格式。 不指定则绑定值为 Date 对象",
          "type": "参见 date formats",
          "默认": "—"
        },
        {
          "name": "id",
          "description": "等价于原生 input id 属性",
          "type": "string / object",
          "默认": "—"
        },
        {
          "name": "name",
          "description": "等价于原生 input name 属性",
          "type": "string / object",
          "默认": "''"
        },
        {
          "name": "unlink-panels",
          "description": "在范围选择器里取消两个日期面板之间的联动",
          "type": "boolean",
          "默认": "false"
        },
        {
          "name": "prefix-icon",
          "description": "自定义前缀图标 如果 type的值是TimeLikeType，那么就是 Clock，不然就是 Calendar",
          "type": "string / object",
          "默认": "''"
        },
        {
          "name": "clear-icon",
          "description": "自定义清除图标",
          "type": "string / object",
          "默认": "CircleClose"
        },
        {
          "name": "validate-event",
          "description": "是否触发表单验证",
          "type": "boolean",
          "默认": "true"
        },
        {
          "name": "disabled-date",
          "description": "一个用来判断该日期是否被禁用的函数，接受一个 Date 对象作为参数。 应该返回一个 Boolean 值。",
          "type": "Function",
          "默认": "—"
        },
        {
          "name": "shortcuts",
          "description": "设置快捷选项，需要传入数组对象",
          "type": "object",
          "默认": "[]"
        },
        {
          "name": "cell-class-name",
          "description": "设置自定义类名",
          "type": "Function",
          "默认": "—"
        },
        {
          "name": "teleported",
          "description": "是否将 date-picker 的下拉列表插入至 body 元素",
          "type": "boolean",
          "默认": "true"
        },
        {
          "name": "empty-values",
          "description": "组件的空值配置 参考config-provider",
          "type": "array",
          "默认": "—"
        },
        {
          "name": "value-on-clear",
          "description": "清空选项的值 参考 config-provider",
          "type": "string / number / boolean / Function",
          "默认": "—"
        },
        {
          "name": "fallback-placements",
          "description": "Tooltip 可用的 positions 请查看popper.js 文档",
          "type": "array",
          "默认": "—"
        },
        {
          "name": "placement",
          "description": "下拉框出现的位置",
          "type": "Placement",
          "默认": "bottom"
        },
        {
          "name": "show-footer",
          "description": "是否显示 footer",
          "type": "boolean",
          "默认": "true"
        },
        {
          "name": "show-week-number",
          "description": "显示周数(除周外)",
          "type": "boolean",
          "默认": "false"
        }
      ],
      "events": [
        {
          "name": "change",
          "description": "当用户确认值或点击外部时触发",
          "type": "Function"
        },
        {
          "name": "blur",
          "description": "在组件 Input 失去焦点时触发",
          "type": "Function"
        },
        {
          "name": "focus",
          "description": "在组件 Input 获得焦点时触发",
          "type": "Function"
        },
        {
          "name": "clear",
          "description": "可清空的模式下用户点击清空按钮时触发",
          "type": "Function"
        },
        {
          "name": "calendar-change",
          "description": "在日历所选日期更改时触发 仅用于 range",
          "type": "Function"
        },
        {
          "name": "panel-change",
          "description": "当日期面板改变时触发。",
          "type": "Function"
        },
        {
          "name": "visible-change",
          "description": "当 DatePicker 的下拉列表出现/消失时触发",
          "type": "Function"
        }
      ],
      "slots": [
        {
          "name": "default",
          "description": "自定义单元格内容"
        },
        {
          "name": "range-separator",
          "description": "自定义范围分割符内容"
        },
        {
          "name": "prev-month",
          "description": "上个月的图标"
        },
        {
          "name": "next-month",
          "description": "下个月的图标"
        },
        {
          "name": "prev-year",
          "description": "上一年图标"
        },
        {
          "name": "next-year",
          "description": "下一年图标"
        }
      ],
      "methods": [],
      "exposes": [
        {
          "name": "focus",
          "description": "使组件获取焦点",
          "type": "Function"
        },
        {
          "name": "blur",
          "description": "使组件失去焦点",
          "type": "Function"
        },
        {
          "name": "handleOpen",
          "description": "打开日期选择器弹窗",
          "type": "Function"
        },
        {
          "name": "handleClose",
          "description": "关闭日期选择器弹窗",
          "type": "Function"
        }
      ],
      "others": []
    }
  },
  "others": []
}

#### 输出：符合 tinyEngine 协议的 DatePicker schema
{
  "id": 1,
  "version": "2.4.2",
  "name": {
    "zh_CN": "日期选择器"
  },
  "component": "ElDatePicker",
  "icon": "datepick",
  "description": "日期选择器",
  "doc_url": "",
  "screenshot": "",
  "tags": "",
  "keywords": "",
  "dev_mode": "proCode",
  "npm": {
    "package": "element-plus",
    "exportName": "ElDatePicker",
    "destructuring": true
  },
  "group": "表单组件",
  "category": "element-plus",
  "configure": {
    "loop": true,
    "condition": true,
    "styles": true,
    "isContainer": false,
    "isModal": false,
    "isPopper": false,
    "nestingRule": {
      "childWhitelist": "",
      "parentWhitelist": "",
      "descendantBlacklist": "",
      "ancestorWhitelist": ""
    },
    "isNullNode": false,
    "isLayout": false,
    "rootSelector": "",
    "shortcuts": {
      "properties": [
        "type",
        "size"
      ]
    },
    "contextMenu": {
      "actions": [
        "copy",
        "remove",
        "insert",
        "updateAttr",
        "bindEvent",
        "createBlock"
      ],
      "disable": []
    },
    "invalidity": [
      ""
    ],
    "clickCapture": true,
    "framework": "Vue"
  },
  "schema": {
    "properties": [
      {
        "name": "0",
        "label": {
          "zh_CN": "基础属性"
        },
        "content": [
          {
            "property": "modelValue",
            "label": {
              "text": {
                "zh_CN": "绑定值"
              }
            },
            "description": {
              "zh_CN": "绑定值"
            },
            "required": false,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "type": "string",
            "widget": {
              "component": "InputConfigurator",
              "props": {}
            }
          },
          {
            "property": "readonly",
            "label": {
              "text": {
                "zh_CN": "只读"
              }
            },
            "description": {
              "zh_CN": "是否只读"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "type": "boolean",
            "defaultValue": false,
            "widget": {
              "component": "CheckBoxConfigurator",
              "props": {}
            }
          },
          {
            "property": "disabled",
            "label": {
              "text": {
                "zh_CN": "禁用"
              }
            },
            "description": {
              "zh_CN": "是否禁用"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "type": "boolean",
            "defaultValue": false,
            "widget": {
              "component": "CheckBoxConfigurator",
              "props": {}
            }
          },
          {
            "property": "size",
            "label": {
              "text": {
                "zh_CN": "尺寸"
              }
            },
            "description": {
              "zh_CN": "输入框尺寸"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "type": "string",
            "defaultValue": "",
            "widget": {
              "component": "SelectConfigurator",
              "props": {
                "allowClear": true,
                "options": [
                  {
                    "label": "large",
                    "value": "large"
                  },
                  {
                    "label": "default",
                    "value": "default"
                  },
                  {
                    "label": "small",
                    "value": "small"
                  }
                ]
              }
            }
          },
          {
            "property": "editable",
            "label": {
              "text": {
                "zh_CN": "是否可编辑"
              }
            },
            "description": {
              "zh_CN": "文本框是否可编辑"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "type": "boolean",
            "defaultValue": true,
            "widget": {
              "component": "CheckBoxConfigurator",
              "props": {}
            },
            "device": []
          },
          {
            "property": "clearable",
            "label": {
              "text": {
                "zh_CN": "是否可清除"
              }
            },
            "description": {
              "zh_CN": "是否显示清楚按钮"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "type": "boolean",
            "defaultValue": true,
            "widget": {
              "component": "CheckBoxConfigurator",
              "props": {}
            },
            "device": []
          },
          {
            "property": "placeholder",
            "label": {
              "text": {
                "zh_CN": "占位文本"
              }
            },
            "description": {
              "zh_CN": "非范围选择时的占位内容"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "defaultValue": "",
            "type": "string",
            "widget": {
              "component": "InputConfigurator",
              "props": {}
            },
            "device": []
          },
          {
            "property": "start-placeholder",
            "label": {
              "text": {
                "zh_CN": "起始占位文本"
              }
            },
            "description": {
              "zh_CN": "范围选择时开始日期的占位内容"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "defaultValue": "",
            "type": "string",
            "widget": {
              "component": "InputConfigurator",
              "props": {}
            },
            "device": []
          },
          {
            "property": "end-placeholder",
            "label": {
              "text": {
                "zh_CN": "结束占位文本"
              }
            },
            "description": {
              "zh_CN": "范围选择时结束日期的占位内容"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "defaultValue": "",
            "type": "string",
            "widget": {
              "component": "InputConfigurator",
              "props": {}
            },
            "device": []
          },
          {
            "property": "type",
            "label": {
              "text": {
                "zh_CN": "类型"
              }
            },
            "description": {
              "zh_CN": "显示类型"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "defaultValue": "date",
            "type": "string",
            "widget": {
              "component": "SelectConfigurator",
              "props": {
                "options": [
                  {
                    "label": "year",
                    "value": "year"
                  },
                  {
                    "label": "years",
                    "value": "years"
                  },
                  {
                    "label": "month",
                    "value": "month"
                  },
                  {
                    "label": "months",
                    "value": "months"
                  },
                  {
                    "label": "date",
                    "value": "date"
                  },
                  {
                    "label": "dates",
                    "value": "dates"
                  },
                  {
                    "label": "datetime",
                    "value": "datetime"
                  },
                  {
                    "label": "week",
                    "value": "week"
                  },
                  {
                    "label": "datetimerange",
                    "value": "datetimerange"
                  },
                  {
                    "label": "daterange",
                    "value": "daterange"
                  },
                  {
                    "label": "monthrange",
                    "value": "monthrange"
                  },
                  {
                    "label": "yearrange",
                    "value": "yearrange"
                  }
                ]
              }
            },
            "device": []
          },
          {
            "property": "popper-class",
            "label": {
              "text": {
                "zh_CN": "下拉框类名"
              }
            },
            "description": {
              "zh_CN": "DatePicker 下拉框的类名"
            },
            "required": true,
            "readOnly": false,
            "disabled": false,
            "cols": 12,
            "labelPosition": "left",
            "defaultValue": "",
            "type": "string",
            "widget": {
              "component": "InputConfigurator",
              "props": {}
            },
            "device": []
          }
        ],
        "description": {
          "zh_CN": ""
        }
      }
    ],
    "events": {
      "onUpdate:modelValue": {
        "label": {
          "zh_CN": "双向绑定值改变时触发"
        },
        "description": {
          "zh_CN": "双向绑定值改变时触发"
        }
      },
      "onChange": {
        "label": {
          "zh_CN": "用户确认选定的值时触发"
        },
        "description": {
          "zh_CN": "用户确认选定的值时触发"
        },
        "type": "event",
        "defaultValue": ""
      },
      "onBlur": {
        "label": {
          "zh_CN": "在组件 Input 失去焦点时触发"
        },
        "description": {
          "zh_CN": "在组件 Input 失去焦点时触发"
        },
        "type": "event",
        "defaultValue": ""
      },
      "onFocus": {
        "label": {
          "zh_CN": "在组件 Input 获得焦点时触发"
        },
        "description": {
          "zh_CN": "在组件 Input 获得焦点时触发"
        },
        "type": "event",
        "defaultValue": ""
      },
      "onCalendarChange": {
        "label": {
          "zh_CN": "在日历所选日期更改时触发"
        },
        "description": {
          "zh_CN": "在日历所选日期更改时触发"
        },
        "type": "event",
        "defaultValue": ""
      },
      "onPanelChange": {
        "label": {
          "zh_CN": "当日期面板改变时触发。"
        },
        "description": {
          "zh_CN": "当日期面板改变时触发。"
        },
        "type": "event",
        "defaultValue": ""
      },
      "onVisibleChange": {
        "label": {
          "zh_CN": "当 DatePicker 的下拉列表出现/消失时触发"
        },
        "description": {
          "zh_CN": "当 DatePicker 的下拉列表出现/消失时触发"
        },
        "type": "event",
        "defaultValue": ""
      }
    },
    "slots": {
      "default": {
        "label": {
          "zh_CN": "自定义单元格内容"
        },
        "description": {
          "zh_CN": "自定义单元格内容"
        }
      },
      "range-separator": {
        "label": {
          "zh_CN": "自定义范围分割符内容"
        },
        "description": {
          "zh_CN": "自定义范围分割符内容"
        }
      }
    }
  },
  "snippets": [
    {
      "name": {
        "zh_CN": "日期选择器"
      },
      "icon": "datepick",
      "screenshot": "",
      "snippetName": "ElDatePicker",
      "schema": {},
      "category": "element-plus"
    }
  ]
}

通过此示例可直观参考**输入原始 API 结构**与**输出 tinyEngine schema 结构**的映射关系，转换时请严格遵循规则对齐。

### 待转换的组件 API 内容
组件API内容: ${JSON.stringify(apiObj, null, 2)}`
    }
  ];

  // 调用OpenAI API
  const completion = await client.chat.completions.create({
    model: model,
    messages,
    temperature: 0.2,
    max_tokens: 16384,
  });

  const schemaText = completion.choices[0].message.content;
  let parsedSchema = null;

  // 清理并解析schema（确保返回JSON对象）
  try {
    let cleanedSchema = schemaText.trim();
    const codeBlockRegex = /^```(json|javascript|js|)\s*([\s\S]*?)\s*```$/i;
    const match = cleanedSchema.match(codeBlockRegex);
    if (match && match[2]) cleanedSchema = match[2].trim();
    
    parsedSchema = JSON.parse(cleanedSchema);
  } catch (parseError) {
    console.warn(`子组件[${subComponentName}]：schema文本解析为JSON失败，返回原始文本`, parseError.message);
    parsedSchema = schemaText; // 解析失败时返回原始文本，便于后续调试
  }

  // 保存文件
  if (save) {
    saveSchemaToFile(schemaText, subComponentName);
  }

  console.log(`子组件[${subComponentName}]：转换完成`);
  return {
    subComponentName,
    schema: parsedSchema, // 返回解析后的JSON对象（或原始文本）
    rawSchemaText: schemaText // 额外返回原始文本，便于追溯
  };
}

/**
 * 批量转换API数组为tinyEngine schema数组（对外导出的核心函数）
 * @param {Array} apiArray - crawlElementPlusAPI返回的子组件API对象数组
 * @param {string} model - 大模型名称（可选，默认用环境变量）
 * @param {boolean} save - 是否保存到文件（可选，默认true）
 * @returns {Promise<Array>} 子组件schema结果数组（每个元素含子组件名、schema对象、原始文本）
 */
async function batchConvertToTinyEngineSchema(apiArray, model = process.env.OPENAI_MODEL || "Qwen/Qwen3-32B", save = true) {
  if (!Array.isArray(apiArray) || apiArray.length === 0) {
    throw new Error("输入必须是非空的API对象数组（来自crawlElementPlusAPI）");
  }

  console.log(`\n开始批量转换：共${apiArray.length}个子组件`);
  const conversionResults = [];

  // 逐个转换（串行执行，避免并发调用API导致限流）
  for (const apiObj of apiArray) {
    try {
      const result = await convertSingleSubComponent(apiObj, model, save);
      conversionResults.push(result);
    } catch (error) {
      const subComponentName = Object.keys(apiObj.components)[0] || 'unknown';
      console.error(`子组件[${subComponentName}]转换失败，跳过该组件`, error.message);
      // 失败时仍记录，便于后续排查
      conversionResults.push({
        subComponentName,
        success: false,
        error: error.message,
        schema: null
      });
    }
  }

  console.log(`\n批量转换完成：成功${conversionResults.filter(r => r.success !== false).length}个，失败${conversionResults.filter(r => r.success === false).length}个`);
  return conversionResults;
}

/**
 * 主函数：命令行入口（调用批量转换函数）
 */
async function main() {
  try {
    const url = process.argv[2];
    if (!url) {
      console.error('请提供URL作为参数');
      console.log('使用示例: node convertor.js https://cn.element-plus.org/zh-CN/component/button.html');
      return;
    }

    // 1. 先爬取API数组（依赖element-api-crawler.js）
    const { crawlElementPlusAPI } = require('./element-api-crawler');
    console.log(`开始爬取URL: ${url}`);
    const apiArray = await crawlElementPlusAPI(url);
    console.log(`爬取完成：共${apiArray.length}个子组件`);

    // 2. 调用批量转换函数
    const results = await batchConvertToTinyEngineSchema(apiArray);

    // 3. 输出汇总结果
    console.log('\n--- 批量转换汇总 ---');
    results.forEach((item, index) => {
      if (item.success === false) {
        console.log(`[${index + 1}] 子组件[${item.subComponentName}]：失败 - ${item.error}`);
      } else {
        console.log(`[${index + 1}] 子组件[${item.subComponentName}]：成功`);
      }
    });

  } catch (error) {
    console.error(`整体流程失败: ${error.message}`);
  }
}

// 命令行直接运行时执行主函数
if (require.main === module) {
  main();
}

// 对外导出批量转换函数（原单个转换函数可按需导出，此处优先暴露核心批量函数）
module.exports = {
  batchConvertToTinyEngineSchema,
  convertSingleSubComponent // 可选导出，供调试单个子组件转换
};