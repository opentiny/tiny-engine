const { OpenAI } = require("openai");
const { extractApiContent } = require('./api-content-extractor');
require('dotenv').config();

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "你的API密钥",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

/**
 * 将提取的API内容转换为符合tinyEngine组件协议的schema
 * @param {object} apiContent - 从API提取器获取的内容
 * @param {string} url - 原始URL
 * @returns {Promise<string>} 符合tinyEngine协议的schema原始文本
 */
async function convertToTinyEngineSchema(apiContent, url) {
  try {
    // 构建提示信息
    // const messages = [
    //   {
    //     role: "system",
    //     content: `你是专业的组件协议转换工具，负责将组件API文档转换为符合tinyEngine组件协议的标准schema。请严格遵循tinyEngine的规范，确保输出格式正确、信息完整。`
    //   },
    //   {
    //     role: "user",
    //     content: `请将以下组件API内容转换为符合tinyEngine组件协议的schema，输出完整JSON。
        
    //     转换需遵循以下规则：

    //     ### 输入内容说明
    //     输入为从网页提取的element-plus组件API信息，包含以下核心字段：
    //     - component：组件名称
    //     - version：组件版本
    //     - description：组件描述
    //     - apis：包含各子组件（如主组件、Group组件等）的详细API信息，每个子组件下可能包含：
    //       - attributes/props：组件属性数组，每个属性包含name、description、type、default、enum等信息
    //       - slots：插槽数组，每个插槽包含name、description等信息
    //       - exposes：暴露的方法/属性数组，每个包含name、description、type等信息
    //     - notes：组件备注信息，可能包含废弃说明、自定义提示等

    //     ### 转换规则
    //     1. **组件基础字段映射**
    //       - component：直接使用输入中的component值
    //       - version：直接使用输入中的version值
    //       - description：直接使用输入中的description值
    //       - name：以i18n格式构造，基础格式为{"zh-CN": 组件名称}
    //       - icon、screenshot、npm、group：无对应信息时保持空值或空对象

    //     2. **schema字段（组件元数据）映射**
    //       - properties数组：由apis中对应组件的attributes转换而来，每个属性对应结构：
    //         - label：以i18n格式构造，基础格式为{"zh-CN": attribute.name}
    //         - description：以i18n格式构造，基础格式为{"zh-CN": attribute.description}
    //         - collapse：保持空对象
    //         - content：数组，每个元素包含：
    //           - property：对应attribute.name
    //           - type：对应attribute.type
    //           - defaultValue：对应attribute.default
    //           - label：同外层label格式
    //           - cols：保持空值
    //           - rules：保持空数组
    //           - hidden：默认false
    //           - required：默认false（可根据实际需求后续优化）
    //           - readOnly：默认false
    //           - disabled：默认false
    //           - widget：根据type选择对应组件，enum类型用MetaSelect（options从enum转换），其他类型默认用MetaInput
    //           - device：保持空值

    //       - events：暂保持空对象（可根据组件实际事件信息后续补充）
    //       - shortcuts：保持空对象
    //       - contentMenu：保持空对象

    //     3. **configure字段映射**
    //       无明确对应信息时，统一使用以下默认结构：
    //       {
    //         "loop": false,
    //         "condition": false,
    //         "styles": false,
    //         "iscontainer": false,
    //         "ismodal": false,
    //         "nestingRule": {
    //           "childWhitelist": "",
    //           "parentWhitelist": "",
    //           "descendantBlacklist": "",
    //           "ancestorWhitelist": ""
    //         },
    //         "isnullNode": false,
    //         "islayout": false,
    //         "rootSelector": "",
    //         "shortcuts": {
    //           "properties": []
    //         },
    //         "contextMenu": {
    //           "actions": [],
    //           "disable": []
    //         }
    //       }

    //     ### 输出要求
    //     输出完整的tinyEngine组件协议格式JSON，包含所有规定字段，严格遵循上述映射规则，未明确说明的字段按规则保持默认值或空值。
        
    //     原始API来源: ${url}
    //     组件API内容: ${JSON.stringify(apiContent, null, 2)}`
    //   }
    // ];
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
- \`apis\`：子组件集合（如主组件、Group 组件），每个子组件包含：
  - \`attributes\`：属性数组（含 name、description、type、default、enum 等）
  - （可选）\`slots\`：插槽数组（含 name、description 等）
  - （可选）\`exposes\`：暴露的方法/属性数组（含 name、description、type 等）
  - （可选）\`events\`：事件数组（含 name、description、parameters 等）
- （可选）\`notes\`：组件备注（含废弃说明、使用提示等）

**若必需字段缺失，输出需明确提示缺失内容（如 "缺少 apis.Button.attributes 字段，请补充"）。**

### 转换规则

#### 1. 顶层字段构建
- \`component\`：
  - 若为 tinyVue 组件，直接使用组件名（如 "Tooltip"）
  - 其他组件库（如 element - plus），组件名前加额外标识（如 element - plus 的 Form 组件为 "ElForm"）
- \`name\`：i18n 格式，\`{"zh-CN": 组件中文名称}\`。规则：
  - 若 \`description\` 含中文名称，优先提取（如 "常用的操作按钮"→"按钮"）
  - 否则按组件名语义翻译（如 "Input"→"输入框"，"Select"→"选择器"）
- \`icon\`：默认使用 \`component\` 值（如 "Button"），若 \`notes\` 有图标提示则替换
- \`group\`：根据组件库识别，如 element - plus 组件填 "element - plus"，tinyVue 填 "tinyVue" 等
- \`category\`：固定为 "UI 组件"（可根据实际调整）
- \`description\`：直接使用输入的 \`description\` 值
- \`tags\`：从 \`description\` 提取核心关键词（如 "按钮"→["操作","交互"]）
- \`keywords\`：同 \`tags\`，补充组件名英文（如 ["Button","按钮","操作"]）
- \`doc_url\`：默认空，若 \`notes\` 有文档链接则填充
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
  - \`isContainer\`：若子组件 \`slots\` 数组长度 > 0 则为 \`true\`（含插槽即为容器），否则 \`false\`
  - \`isModal\`：组件名含 "Modal" 则为 \`true\`，否则 \`false\`
  - \`isPopper\`：组件名含 "Dropdown"|"Tooltip" 则为 \`true\`，否则 \`false\`
  - \`isNullNode\`：固定为 \`false\`
  - \`isLayout\`：组件名含 "Layout"|"Row"|"Col" 则为 \`true\`，否则 \`false\`

- **嵌套规则**：
  - \`nestingRule\`：\`{"childWhitelist": "","parentWhitelist": "","descendantBlacklist": "","ancestorWhitelist": ""}\`

- **编辑器配置**：
  - \`rootSelector\`：固定为 ""
  - \`shortcuts.properties\`：从 \`attributes\` 中选 1 - 3 个核心属性（如 Button 的 "type"|"size"|"disabled"）
  - \`contextMenu\`：\`{"actions": ["copy", "remove", "insert", "updateAttr", "bindEvent"],"disable": []}\`

- **交互行为**：
  - \`clickCapture\`：组件名含 "Button"|"Switch" 则为 \`true\`，否则 \`false\`
  - \`framework\`：根据组件库识别，如 Vue 生态组件填 "Vue"

#### 4. \`schema\` 对象构建
##### 4.1 \`schema.properties\`（Props 分组）
将 \`attributes\` 按功能分组为数组，每组包含：
- \`name\`：分组标识（"0"|"1"|"2"|"3"）
- \`label.zh_CN\`：分组中文名称（"基础属性"|"样式属性"|"行为属性"|"高级属性"）
- \`description.zh_CN\`：分组描述（如 "组件核心功能配置"）
- \`content\`：属性配置数组（每个元素对应一个 \`attribute\`）

**\`content\` 属性映射规则**：
- \`property\`：\`attribute.name\`（如 "size"）
- \`label.text.zh_CN\`：\`attribute.name\` 的中文释义（如 "尺寸"）
- \`description\`：\`attribute.description\`
- \`required\`：若 \`attribute.default\` 为 "—" 且无默认值则 \`true\`，否则 \`false\`
- \`readOnly\`：固定为 \`false\`
- \`disabled\`：固定为 \`false\`
- \`cols\`：固定为 \`12\`
- \`labelPosition\`：固定为 "left"
- \`type\`：\`attribute.type\`（转为小写，如 "enum"|"boolean"）
- \`defaultValue\`：\`attribute.default\`（"—" 转为 \`null\`）
- \`widget\`：按以下优先级推断：
  1. 若 \`type\` 为 "enum"：\`{"component": "SelectConfigurator","props": {"options": attribute.enum.map(v => ({label: v, value: v}))}}\`
  2. 若 \`type\` 为 "boolean"：
     - 名称含 "show"|"enable"：\`{"component": "SwitchConfigurator","props": {}}\`
     - 其他（如 "disabled"|"loading"）：\`{"component": "CheckBoxConfigurator","props": {}}\`
  3. 若 \`type\` 为 "number"：\`{"component": "NumberConfigurator","props": {"step": 1}}\`
  4. 若名称含 "color"：\`{"component": "ColorConfigurator","props": {}}\`
  5. 默认：\`{"component": "InputConfigurator","props": {"placeholder": "请输入" + label.text.zh_CN}}\`

##### 4.2 \`schema.events\`（事件映射）
- 从 \`apis.[子组件].events\` 提取事件（若存在），无则基于组件类型推断（如 Button 默认 "click"）
- 每个事件转换为：\`"on[首字母大写事件名]": {"description": 事件描述,"params": 事件参数数组}\`
  - 示例：事件 "click"→\`"onClick": {"description": "点击按钮时触发","params": []}\`

##### 4.3 \`schema.slots\`（插槽映射）
- 遍历 \`apis.[子组件].slots\`，每个插槽映射为：
  - \`[slot.name]\`: \`{"label.zh_CN": slot.name 的中文（如 "default"→"默认内容"）,"description.zh_CN": slot.description}\`
  - 示例：\`"default": {"label.zh_CN": "默认内容","description.zh_CN": "自定义默认内容"}\`

##### 4.4 \`schema.exposes\`（暴露方法/属性）
- 从 \`apis.[子组件].exposes\` 提取，每个映射为：
  - \`[expose.name]\`: \`{"type": expose.type,"description": expose.description}\`

#### 5. 多组件处理
若输入 \`apis\` 包含多个子组件（如主组件、Group 组件），为每个子组件单独生成一个 schema，确保组件基础信息（\`component\`、\`name\` 等）与子组件对应。

#### 6. \`snippets\`（代码片段）
- 生成默认片段数组：\`[{"name.zh_CN": name.zh_CN,"icon": icon,"snippetName": component,"schema.props": 核心属性示例值}]\`
- 示例（Button）：\`{"schema.props": {"type": "primary","size": "large","disabled": false}}\`

### 输出要求
严格按上述规则转换，确保所有字段完整映射，格式符合 JSON 规范。未明确提及的字段按默认值填充（如空字符串、空数组、\`false\`）。若输入含多个子组件，输出对应数量的 schema JSON 对象。

原始API来源: ${url}
组件API内容: ${JSON.stringify(apiContent, null, 2)}`
      }
  ]

    // 调用OpenAI API进行转换
    const completion = await client.chat.completions.create({
      model: "Qwen/Qwen3-32B",
      messages,
      temperature: 0.2, // 适当提高温度以增加灵活性，但保持结果稳定性
    });

    // 直接返回大模型输出的原始结果，不进行JSON解析
    const result = completion.choices[0].message.content;
    console.log(`成功获取tinyEngine schema，长度: ${result.length} 字符`);
    return result;
  } catch (error) {
    console.error(`转换为tinyEngine schema失败: ${error.message}`);
    if (error.response) {
      console.error("API响应:", error.response.data);
    }
    throw error;
  }
}

/**
 * 主函数：提取API内容并转换为tinyEngine schema
 */
async function main() {
  try {
    // 从命令行参数获取URL
    const url = process.argv[2];
    
    if (!url) {
      console.error('请提供URL作为参数');
      console.log('使用示例: node index.js https://cn.element-plus.org/zh-CN/component/form.html');
      return;
    }
    
    // 1. 提取API内容
    console.log(`开始处理URL: ${url}`);
    const apiContent = await extractApiContent(url);
    console.log('成功提取API内容');
    
    // 2. 转换为tinyEngine组件协议
    console.log('开始转换为tinyEngine组件协议...');
    const tinyEngineSchema = await convertToTinyEngineSchema(apiContent, url);
    
    // 3. 输出最终结果
    console.log('\n--- 符合tinyEngine组件协议的schema ---');
    console.log(tinyEngineSchema);  // 直接输出原始文本，无需JSON.stringify
    
    console.log('\n--- 处理完成 ---');
    
  } catch (error) {
    console.error('程序执行出错:', error.message);
    process.exit(1);
  }
}

// 执行主程序
main().catch(console.error);