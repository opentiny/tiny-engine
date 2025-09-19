require('dotenv').config({ path: '../.env' });
const { OpenAI } = require("openai");
const fs = require('fs');
const path = require('path');
const { postProcessSchemas } = require('../post-processing/post-process-schemas');
const { extractApiFromUrl } = require('../api-generation/web-based-api-generator');
const { generateComponentApiJson } = require('../api-generation/file-based-api-generator');

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  timeout: 6000000
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
      const errorLogPath = path.join(__dirname, `../../schema-log/parse-error-${subComponentName}-${new Date().getTime()}.json`);
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
 * @param {Array<string>} relatedSubComponents - 所有关联的子组件名称列表
 * @param {boolean} save - 是否保存到文件
 * @returns {Promise<object>} 包含子组件名和schema的对象
 */
async function convertSingleSubComponent(apiObj, model = process.env.OPENAI_MODEL || "Qwen/Qwen3-32B", relatedSubComponents = [], save = true) {
  const subComponentName = Object.keys(apiObj.components)[0] || 'unknown-subcomponent';
  console.log(`\n=== 开始转换子组件[${subComponentName}] ===`);

  console.log(`[任务${subComponentName} Prompt构建] 开始组装system和user指令（含组件API数据）`);
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
- \`name\`：组件名称（如 "Button"）
- \`components\`：子组件集合（如主组件、Group 组件），每个子组件包含：
  - （可选）\`properties\`：属性数组（含 name、description、type、default、enumOptions 等）
  - （可选）\`slots\`：插槽数组（含 name、description 等）
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
- \`icon\`：默认使用 \`component\` 值的「核心标识」（小写），规则如下：
  - 若为 tinyVue 组件，直接使用组件名小写（如 "Tooltip"→"tooltip"）
  - 若为其他组件库（如 element-plus），移除前缀标识后转为小写（如 "ElForm"→"form"、"ElButton"→"button"）
  - 若 \`notes\` 中有明确图标提示（如 "图标使用 'calendar'"），则优先使用该值（保持原大小写）
- \`group\`：根据组件库识别，如 element - plus 组件填 "element - plus"
- \`category\`：根据组件库识别，如 element - plus 组件填 "element - plus"
- \`description\`：直接使用输入的 \`description\` 值，否则根据组件信息自行识别
- \`tags\`：从 \`description\` 提取核心关键词（如 "按钮"→["操作","交互"]）
- \`keywords\`：同 \`tags\`，补充组件名英文（如 ["Button","按钮","操作"]）
- \`doc_url\`：直接使用输入的 \`url\` 值，否则默认为空
- \`version\`：直接使用输入的 \`version\` 值，否则默认为空
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
- \`defaultValue\`：\`property.default\`（"—" 转为 \`null\`；"undefined" 转为 \`null\`）
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
- 任务：为组件生成**符合实际使用场景**的有代表性、有意义的代码片段数组（snippets），准确体现组件的典型用法和嵌套关系，用于在组件面板中展示。
- 生成规则：
  1. **基础要求**：
    - snippets 数组应包含一个默认代码片段，需完整展示组件的核心用法。
    - 每个代码片段必须包含以下字段，且配置需遵循统一要求：
      1. name.zh_CN：填写与组件定义中一致的中文名称，比如 “表格”“表单”“按钮”；
      2. icon：填写与组件定义中一致的图标标识，比如 “table”“form”“button”；
      3. screenshot：固定填空字符串（""），预留截图位置；
      4. snippetName：填写与组件定义中 component 字段一致的完整组件名，比如 “ElTable”“ElForm”；
      5. category：填写与组件定义中一致的组件库归属，比如 “element-plus”；
      6. schema：组件核心配置结构，根据组件的信息与特性，可灵活包含 props（组件自身属性）和 / 或 children（子组件嵌套）。
  
  2. **schema 核心规则**：
    - **结构选择**：
      - 基础组件（如 ElButton、ElInput）：通过 props 配置业务常用属性（如按钮 type、输入框 placeholder），通过 children 承载文本或辅助组件（如按钮嵌套 Text 组件）。
      - 容器 / 复合组件（如 ElTable、ElForm）：可单独配置 props（如表格用 data/columns 定义数据与列）、单独配置 children（如表单嵌套 ElFormItem），或两者结合，优先匹配组件原生主流用法。
      - **父-子依赖组件（重点）**：若组件为“容器型父组件”，且存在“必须依赖的子组件”（无则无法正常使用），则 **必须在 schema.children 中包含对应子组件**，禁止用 Text 组件替代。
        - **关联子组件信息**：当前组件的所有关联子组件为：${relatedSubComponents.join(", ")}。
        - 构造 schema.children 时，若“容器型父组件”需嵌套子组件，**优先从上述关联子组件中选择**（如 ElTabs 需嵌套 ElTabPane、ElSelect 需嵌套 ElOption）。
    
    - **父-子依赖组件的识别标准**（满足任一即可判定）：
      1. **名称关联性**：父组件名称与子组件名称存在明显从属关系（如 ElTabs ↔ ElTabPane、ElSelect ↔ ElOption、ElDropdown ↔ ElDropdownItem）；
      2. **功能必要性**：父组件的核心功能依赖子组件实现（如 ElForm 必须包含 ElFormItem 才能承载表单元素、ElSteps 必须包含 ElStep 才能展示步骤）；
      3. **文档暗示性**：组件 description 或 notes 中明确提到“需配合 XX 组件使用”（如“Tabs 组件需配合 TabPane 组件使用”）。

    - **父-子依赖组件的嵌套要求**（强制）：
      1. 子组件必须是该父组件的**专用子组件**（如 ElTabs 只能嵌套 ElTabPane，不能嵌套 ElFormItem）；
      2. 子组件数量需符合实际用法（如 ElTabs 至少嵌套 2 个 ElTabPane，ElSteps 至少嵌套 2 个 ElStep）；
      3. 子组件需配置**核心必填 props**（如 ElTabPane 需配置 "label" 属性，ElOption 需配置 "label" 和 "value" 属性）；
      4. 嵌套层级需符合原生用法（如 ElTabs → ElTabPane → ElInput，禁止跨层级嵌套）。

    - **props 要求**：
      - 禁用 “请输入”“示例值” 等泛型占位符，填写真实业务场景值（如 “请输入手机号”“提交”）；
      - 复杂类型属性（数组、对象）需提供完整模拟数据（如表格 data 包含 2-4 条真实结构数据）；
      - 关联属性需严格对应（如 ElTable 的 columns.prop 与 data 中的字段名一致）。

  3. **snippets 正确示例**：
    - 示例1：按钮 ElButton（独立组件）：
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
    - 示例2：表格 ElTable（包含 column 属性）：
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
    - 示例3：表单 ElForm（包含 ElFormItem 子组件）：
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
  // console.log(`[任务${subComponentName} Prompt构建完成] 指令总长度（字符数）：${JSON.stringify(messages).length}`);
  console.log(`[任务${subComponentName} API调用准备] 即将向模型${model}发起请求`);

  // 记录开始时间（毫秒级时间戳）
  const taskStartTime = Date.now();
  const taskStartISO = new Date(taskStartTime).toISOString(); // 可读性更好的ISO时间
  console.log(`[任务${subComponentName}] 开始执行 | 时间：${taskStartISO} | 时间戳：${taskStartTime}`);

  // 调用OpenAI API
  const completion = await client.chat.completions.create({
    model: model,
    messages,
    temperature: 0.2,
    // max_tokens: 16384,
    max_tokens: 65536,
    // stream: true
  });

  console.log("[任务${subComponentName}] 正在等待大模型生成...")
  const schemaText = completion.choices[0].message.content;

  // 记录结束时间
  const taskEndTime = Date.now();
  const taskEndISO = new Date(taskEndTime).toISOString();
  const duration = (taskEndTime - taskStartTime) / 1000; // 耗时（秒）
  console.log(`[任务${subComponentName}] 执行完成 | 时间：${taskEndISO} | 耗时：${duration.toFixed(2)}秒`);

  console.log(`[任务${subComponentName} 响应结果] 生成的schema文本长度（字符数）：${schemaText.length}`);

  let parsedSchema = null;
  let success = false;

  // 保存文件
  if (save) {
    saveSchemaToFile(schemaText, subComponentName);
  }
 
  // 清理并解析schema（确保返回JSON对象）
  try {
    let cleanedSchema = schemaText.trim();
    const codeBlockRegex = /^```(json|javascript|js|)\s*([\s\S]*?)\s*```$/i;
    const match = cleanedSchema.match(codeBlockRegex);

    // if (match && match[2]) cleanedSchema = match[2].trim();
    if (match && match[2]) {
      cleanedSchema = match[2].trim();
      console.log(`[任务${subComponentName} 数据清理成功] 检测到JSON代码块标识，已移除 | 清理后长度：${cleanedSchema.length}`);
    } else {
      console.log(`[任务${subComponentName} 数据清理] 未检测到代码块标识，直接使用原始文本`);
    }
    if (!cleanedSchema) {
      throw new Error(`子组件[${subComponentName}]：清理后schema为空`);
    }

    parsedSchema = JSON.parse(cleanedSchema);
    // 新增日志：打印 parsedSchema 的类型和结构
    console.log(`子组件[${subComponentName}]：parsedSchema 类型 = ${typeof parsedSchema}`);
    console.log(`子组件[${subComponentName}]：parsedSchema 是数组 = ${Array.isArray(parsedSchema)}`);

    // 强制处理数组为单个对象
    let validSchema = null;
    if (Array.isArray(parsedSchema)) {
      console.log(`子组件[${subComponentName}]：检测到数组格式（长度=${parsedSchema.length}），开始处理`);

      // 1. 过滤数组中有效子元素（必须包含component和schema字段，符合单组件输入预期）
      const validItems = parsedSchema.filter(item => item?.component && item?.schema);

      if (validItems.length === 0) {
        // 无有效元素：直接抛出错误
        throw new Error(`子组件[${subComponentName}]：数组中无有效schema（需包含component和schema字段）`);
      } else if (validItems.length === 1) {
        // 仅1个有效元素：提取为单个对象（符合输入预期）
        validSchema = validItems[0];
        console.log(`子组件[${subComponentName}]：数组中仅1个有效元素，已提取为单个schema对象`);
      } else {
        // 多个有效元素：属于异常情况（输入单个组件却返回多组件）
        // 取第一个有效元素作为主schema，同时告警提示异常
        validSchema = validItems[0];
        console.warn(`⚠️  子组件[${subComponentName}]：输入单个组件却返回${validItems.length}个有效schema（异常），已默认取第一个元素`);
        // 可选：记录异常到日志文件（便于后续排查大模型Prompt问题）
        const warnLogPath = path.join(__dirname, `../schema-log/warn-multi-schema-${subComponentName}-${new Date().getTime()}.json`);
        fs.writeFileSync(warnLogPath, JSON.stringify(validItems, null, 2), 'utf8');
        console.warn(`⚠️  异常详情已保存至：${warnLogPath}`);
      }
    } else {
      // 非数组格式：直接校验核心字段（component + schema）
      if (!parsedSchema?.component || !parsedSchema?.schema) {
        throw new Error(`子组件[${subComponentName}]：schema缺少核心字段（需同时包含component和schema）`);
      }
      validSchema = parsedSchema;
      console.log(`子组件[${subComponentName}]：非数组格式，核心字段校验通过`);
    }

    // -------------------------- 校验最终schema的完整性 --------------------------
    if (validSchema?.schema) {
      console.log(`子组件[${subComponentName}]：最终schema包含核心schema字段，结构正常`);
    } else {
      throw new Error(`子组件[${subComponentName}]：最终schema缺少核心schema字段，无法使用`);
    }

    // 更新为处理后的有效schema（确保是单个对象）
    parsedSchema = validSchema;

    success = true;
  } catch (parseError) {
    // console.warn(`子组件[${subComponentName}]：schema文本解析为JSON失败，返回原始文本`, parseError.message);
    // parsedSchema = schemaText; // 解析失败时返回原始文本，便于后续调试
    const errorLogPath = path.join(__dirname, `../schema-log/parse-error-${subComponentName}-${new Date().getTime()}.json`);
    fs.writeFileSync(errorLogPath, cleanedSchema, 'utf8');
    throw new Error(`子组件[${subComponentName}]：schema解析失败: ${parseError.message}，原始内容已保存至${errorLogPath}`);
  }

  console.log(`[任务${subComponentName}]：转换完成`);
  return {
    subComponentName,
    schema: parsedSchema, // 返回解析后的JSON对象（或原始文本）
    rawSchemaText: schemaText, // 额外返回原始文本，便于追溯,
    success: success
  };
}

/**
 * 辅助函数：将数组拆分为指定大小的批次（用于分批并行）
 * @param {Array} array - 待拆分的原始数组
 * @param {number} batchSize - 每批大小（并发数）
 * @returns {Array<Array>} 批次数组（每个子数组为一批）
 */
function splitIntoBatches(array, batchSize) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * 批量转换API数组为tinyEngine schema数组（改进：支持分批并行处理）
 * @param {Array} apiArray - api-generation返回的子组件API对象数组
 * @param {string} model - 大模型名称（可选，默认用环境变量）
 * @param {boolean} save - 是否保存到文件（可选，默认true）
 * @param {number} concurrentLimit - 并发数上限（可选，默认3，支持环境变量配置）
 * @returns {Promise<Array>} 子组件schema结果数组（每个元素含子组件名、schema对象、原始文本）
 */
async function batchConvertToTinyEngineSchema(
  apiArray,
  model = process.env.OPENAI_MODEL || "Qwen/Qwen3-32B",
  save = true,
  concurrentLimit = 5 // 并发数配置
) {
  if (!Array.isArray(apiArray) || apiArray.length === 0) {
    throw new Error("输入必须是非空的API对象数组");
  }

  // 收集所有关联子组件名称
  const allSubComponentNames = new Set();
  apiArray.forEach(apiObj => {
    const subCompName = Object.keys(apiObj.components)[0];
    if (subCompName) allSubComponentNames.add(subCompName);
  });
  const relatedSubComponents = Array.from(allSubComponentNames);
  console.log(`已收集所有关联子组件（共${relatedSubComponents.length}个）：${relatedSubComponents.join(", ")}`);

  // 校验并发数（避免非法值，最小1，最大建议不超过10）
  const validConcurrentLimit = Math.max(1, Math.min(concurrentLimit, 10));
  console.log(`\n=== 开始批量转换 ===`);
  console.log(`总子组件数：${apiArray.length} | 并发数上限：${validConcurrentLimit} | 模型：${model}`);

  // 记录开始时间（毫秒级时间戳）
  const startTime = Date.now();
  const startISO = new Date(startTime).toISOString(); // 可读性更好的ISO时间
  console.log(`批量转换开始执行 | 时间：${startISO} | 时间戳：${startTime}`);

  // 1. 将API数组拆分为批次
  const batches = splitIntoBatches(apiArray, validConcurrentLimit);
  console.log(`共拆分为 ${batches.length} 个批次`);

  const conversionResults = [];

  // 2. 批次间串行执行（避免全量并发），批次内并行执行
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const currentBatch = batches[batchIndex];
    const batchNumber = batchIndex + 1; // 批次号（从1开始）
    console.log(`\n--- 处理批次 ${batchNumber}/${batches.length}（含 ${currentBatch.length} 个子组件）---`);

    // 3. 批次内并行处理每个子组件
    const batchPromises = currentBatch.map(async (apiObj) => {
      const subComponentName = Object.keys(apiObj.components)[0] || 'unknown';
      try {
        console.log(`[批次${batchNumber}] 开始转换子组件：${subComponentName}`);
        const result = await convertSingleSubComponent(apiObj, model, relatedSubComponents, save);
        console.log(`[批次${batchNumber}] 转换成功：${subComponentName}`);
        return result; // 成功结果（含subComponentName、schema等）
      } catch (error) {
        console.error(`[批次${batchNumber}] 转换失败：${subComponentName} | 原因：${error.message}`);
        // 失败结果（保持与原有结构一致，便于汇总）
        return {
          subComponentName,
          success: false,
          error: error.message,
          schema: null
        };
      }
    });

    // 4. 等待当前批次所有子组件处理完成（并行）
    const batchResults = await Promise.all(batchPromises);

    conversionResults.push(...batchResults); // 收集当前批次结果
    console.log(`--- 批次 ${batchNumber}/${batches.length} 处理完成 ---`);
  }

  // 记录结束时间
  const endTime = Date.now();
  const endISO = new Date(endTime).toISOString();
  const duration = (endTime - startTime) / 1000; // 耗时（秒）
  console.log(`批量转换执行完成 | 时间：${endISO} | 耗时：${duration.toFixed(2)}秒`);

  // 5. 汇总统计
  const successCount = conversionResults.filter(r => r.success !== false).length;
  const failCount = conversionResults.filter(r => r.success === false).length;
  console.log(`\n=== 批量转换全部完成 ===`);
  console.log(`总处理：${apiArray.length} 个 | 成功：${successCount} 个 | 失败：${failCount} 个`);

  return conversionResults;
}

/**
 * 解析命令行参数
 * @returns {Object} 包含解析后的参数（url, componentDir, outputPath, configPath, sourceType）
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const result = {};

  // 遍历解析参数
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        result.url = args[i + 1];
        i++;
        break;
      case '--dir':
        result.componentDir = args[i + 1];
        i++;
        break;
      case '--output':
        result.outputPath = args[i + 1];
        i++;
        break;
      case '--config':
        result.configPath = args[i + 1];
        i++;
        break;
      case '--sourceType': // 新增：解析来源类型参数
        result.sourceType = args[i + 1];
        i++;
        break;
      default:
        console.warn(`忽略未知参数: ${args[i]}`);
    }
  }

  // 全局强制验证 outputPath（两种模式都必须提供）
  if (!result.outputPath) {
    console.error('必须使用 --output 指定输出路径！');
    console.log('用法1（URL 爬取）: node convertor.js --url https://xxx --config ./config.json --output ./output');
    console.log('用法2（文件夹生成）: node convertor.js --sourceType [code|npm] --dir ./components/button --output ./output');
    process.exit(1);
  }

  // 验证：URL 模式必须提供配置文件
  if (result.url && !result.configPath) {
    console.error('通过 --url 爬取时，必须使用 --config 指定配置文件路径！');
    console.log('示例：node convertor.js --url https://xxx --config ./your-config.json --output ./output');
    process.exit(1);
  }

  // 验证：文件夹模式必须提供sourceType
  if (result.componentDir) {
    // 设置默认值为code，同时验证有效性
    result.sourceType = result.sourceType || 'code';
    if (!['code', 'npm'].includes(result.sourceType)) {
      console.error(`无效的sourceType: ${result.sourceType}，必须是"code"或"npm"`);
      console.log('示例：node convertor.js --sourceType code --dir ./components/button --output ./output');
      process.exit(1);
    }
  }

  // 验证：无有效参数时提示用法
  if (!result.url && !result.componentDir) {
    console.error('请提供 URL（需配合 --config）或组件文件夹路径（需配合 --sourceType）作为参数！');
    console.log('用法1（URL 爬取）: node convertor.js --url https://xxx --config ./config.json --output ./output');
    console.log('用法2（文件夹生成）: node convertor.js --sourceType [code|npm] --dir ./components/button --output ./output');
    process.exit(1);
  }

  // 验证：配置文件存在性
  if (result.configPath && !fs.existsSync(result.configPath)) {
    console.error(`指定的配置文件不存在: ${result.configPath}`);
    process.exit(1);
  }

  // 验证：组件文件夹存在性
  if (result.componentDir && !fs.existsSync(result.componentDir)) {
    console.error(`指定的组件文件夹不存在: ${result.componentDir}`);
    process.exit(1);
  }

  // 验证 outputPath 对应的目录是否可写（可选，增强健壮性）
  try {
    const outputDir = path.resolve(result.outputPath);
    // 若目录不存在，尝试创建；若存在，验证可写权限
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    // 写入测试文件验证权限
    const testFile = path.join(outputDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error(`输出路径 ${result.outputPath} 不可写或无法创建: ${error.message}`);
    process.exit(1);
  }

  return result;
}

/**
 * 主函数（支持两种方式获取子组件数组）
 * 方式1：通过URL爬取 - 用法: node convertor.js --url https://xxx --config ./config.json --output ./output
 * 方式2：通过组件文件夹生成 - 用法: node convertor.js --sourceType [code|npm] --dir ./components/button --output ./output
 */
async function main() {
  try {
    // 解析命令行参数
    const { url, componentDir, outputPath, configPath, sourceType } = parseCommandLineArgs();

    let apiArray;

    // 1. 根据参数类型获取子组件数组
    if (url) {
      // 方式1：URL 爬取（需读取配置文件）
      console.log(`开始爬取 URL: ${url}`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      apiArray = await extractApiFromUrl(url, config); 
      console.log(`爬取完成：共 ${apiArray.length} 个子组件`);
    } else if (componentDir) {
      // 方式2：组件文件夹生成（传入sourceType参数）
      console.log(`开始处理组件文件夹: ${componentDir}（来源类型：${sourceType}）`);
      // 调用时传入sourceType参数，对应generateComponentApiJson的参数顺序：componentDir, sourceType, outputPath
      apiArray = await generateComponentApiJson(componentDir, sourceType);

      if (!Array.isArray(apiArray) || apiArray.length === 0) {
        throw new Error("生成的API数组为空或格式不正确");
      }
      console.log(`组件API生成完成：共 ${apiArray.length} 个子组件`);
    } else {
      throw new Error("未提供有效的URL或组件文件夹路径");
    }

    // 2. 批量转换
    const conversionResults = await batchConvertToTinyEngineSchema(apiArray);

    // 3. 输出转换结果
    console.log('\n--- 转换结果明细 ---');
    conversionResults.forEach((item, index) => {
      const status = item.success === false ? '❌ 失败' : '✅ 成功';
      const msg = item.success === false ? `| 原因：${item.error}` : '';
      console.log(`[${index + 1}] 子组件[${item.subComponentName}]：${status} ${msg}`);
    });

    // 4. 后续处理
    console.log('\n--- 开始后续处理 ---');
    const finalResults = postProcessSchemas(conversionResults, outputPath);
    console.log('\n--- 批量转换全部完成 ---');
    return finalResults;

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