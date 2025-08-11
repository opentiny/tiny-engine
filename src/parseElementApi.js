/**
 * 解析Element Plus组件API文档文本为结构化数据
 * @param {string} content - 从网页获取的文本内容
 * @returns {Object} 结构化的API数据
 */
function parseElementApi(content) {
  // 替换多余的空白字符，便于处理
  const normalized = content.replace(/\s+/g, ' ').replace(/\s*:\s*/g, ':');
  
  // 提取所有组件（如form、form-item等）
  const components = [];
  const componentMatches = normalized.match(/([\w-]+)\s+component/g);
  
  if (componentMatches) {
    // 去重组件名
    const uniqueComponents = [...new Set(componentMatches.map(m => m.split(' ')[0]))];
    
    uniqueComponents.forEach(componentName => {
      // 提取当前组件的所有内容
      const componentStart = normalized.indexOf(`${componentName} component`);
      if (componentStart === -1) return;
      
      // 找到下一个组件的开始位置或文档结束位置
      let componentEnd = Infinity;
      for (const otherComponent of uniqueComponents) {
        if (otherComponent !== componentName) {
          const pos = normalized.indexOf(`${otherComponent} component`, componentStart);
          if (pos !== -1 && pos < componentEnd) {
            componentEnd = pos;
          }
        }
      }
      
      // 如果没有找到其他组件，则取到文档末尾
      if (componentEnd === Infinity) {
        componentEnd = normalized.length;
      }
      
      // 提取当前组件的内容
      const componentContent = normalized.substring(componentStart, componentEnd);
      
      // 解析组件的各个部分
      const apiData = {
        name: componentName,
        props: parseSection(componentContent, 'props', ['名称', '类型', '默认值', '说明']),
        events: parseSection(componentContent, 'events', ['名称', '类型', '说明']),
        methods: parseSection(componentContent, 'methods', ['名称', '类型', '说明']),
        slots: parseSection(componentContent, 'slots', ['名称', '说明'])
      };
      
      components.push(apiData);
    });
  }
  
  return { components };
}

/**
 * 解析特定部分（props/events/methods/slots）的内容
 * @param {string} content - 组件的完整内容
 * @param {string} section - 要解析的部分名称
 * @param {string[]} fields - 该部分包含的字段
 * @returns {Array} 解析后的数组
 */
function parseSection(content, section, fields) {
  const sectionStart = content.indexOf(section);
  if (sectionStart === -1) return [];

  // 确定当前部分的结束位置（同之前）
  const nextSections = ['props', 'events', 'methods', 'slots', 'component'];
  let sectionEnd = Infinity;
  nextSections.forEach(sec => {
    if (sec !== section) {
      const pos = content.indexOf(sec, sectionStart);
      if (pos !== -1 && pos < sectionEnd) sectionEnd = pos;
    }
  });
  if (sectionEnd === Infinity) sectionEnd = content.length;

  // 提取当前部分内容（保留原始换行，不全部替换为空格）
  let sectionContent = content.substring(sectionStart + section.length, sectionEnd)
    .replace(/\n+/g, '\n') // 多个空行合并为一个
    .trim();

  // 移除字段标题行（如“名称 类型 默认值 说明”）
  const fieldTitles = fields.join(/\s+/); // 允许标题间有多个空格
  const titleIndex = sectionContent.indexOf(fieldTitles);
  if (titleIndex !== -1) {
    sectionContent = sectionContent.substring(titleIndex + fieldTitles.length).trim();
  }

  // 按“第一个字段+换行”分割条目（利用条目通常分行的特点）
  const firstField = fields[0];
  const itemRegex = new RegExp(`(?:^|\\n)${firstField}\\s+`, 'g'); // 匹配“名称”开头的行
  const itemsRaw = sectionContent.split(itemRegex).filter(item => item.trim());

  // 解析每个条目
  return itemsRaw.map(itemRaw => {
    const item = {};
    let remaining = itemRaw.trim();
    fields.forEach((field, index) => {
      if (index === 0) {
        // 第一个字段已用于分割，直接取到下一个字段前的内容
        const nextField = fields[1];
        const nextIndex = remaining.indexOf(nextField);
        if (nextIndex !== -1) {
          item[field] = remaining.substring(0, nextIndex).trim();
          remaining = remaining.substring(nextIndex + nextField.length).trim();
        } else {
          item[field] = remaining.trim();
          remaining = '';
        }
      } else if (index === fields.length - 1) {
        // 最后一个字段取剩余所有内容
        item[field] = remaining.trim();
      } else {
        // 中间字段：取到下一个字段前的内容
        const nextField = fields[index + 1];
        const nextIndex = remaining.indexOf(nextField);
        if (nextIndex !== -1) {
          item[field] = remaining.substring(0, nextIndex).trim();
          remaining = remaining.substring(nextIndex + nextField.length).trim();
        } else {
          item[field] = '';
        }
      }
    });
    return item;
  });
}

// 使用示例
function extractApiInfo() {
  // const { getPageContent } = require('./your-puppeteer-script'); // 导入你的puppeteer函数
  // const content = await getPageContent(url);
  content = `
  指南
组件
生态产品
TinyEngine
低代码引擎
TinyCharts
图表组件库
TinyNG
Angular组件库
组件总览
基础 (9)
导航 (9)
表单 (28)
AutoComplete 自动完成
BaseSelect 基础选择器
Cascader 级联选择器
CascaderPanel 级联面板
Checkbox 多选框
ColorPicker 颜色选择器
ColorSelectPanel 颜色选择面板
DatePicker 日期选择器
DatePanel 日期选择面板
DropTimes 下拉时间
FileUpload 文件上传
FluentEditor 富文本
Form 表单
Input 输入框
IpAddress IP地址输入框
Numeric 数字输入框
PopEditor 弹出编辑
PopUpload 弹出上传
Radio 单选框
Rate 评分
Search 搜索
Select 选择器
Slider 滑块
Switch 开关
TimePicker 时间选择器
TimeSelect 时间选择
Transfer 穿梭框
TreeSelect 树形选择器
表格 (37)
数据展示 (22)
反馈 (11)
图表 (28)
其他 (12)
自定义指令 (2)
Form 表单
由按钮、输入框、选择器、单选框、多选框等控件组成，用以收集、校验、提交数据。
示例
API
form
component
props
	
名称
	
类型
	
默认值
	
说明


	
disabled
	
boolean
	
false
	
是否禁用该表单内的所有表单组件，若设置为 true，则表单内组件上的 disabled 属性不再生效


	
display-only
	
boolean
	
false
	
是否开启仅展示模式


	
hide-required-asterisk
	
boolean
	
false
	
是否隐藏必填字段的标签旁边的红色星号


	
inline
	
boolean
	
false
	
行内布局模式


	
inline-message
	
boolean
	
--
	
当 validate-type 设置为 text 时，是否以行内形式展示校验信息(推荐使用 message-type 设置)


	
label-align
	
boolean
	
false
	
当出现必填星号时，标签文本是否对齐，当 label-position 为 'right' 时有效


	
label-position
	
'right' | 'left' | 'top'
	
'right'
	
表单中标签的布局位置


	
label-suffix
	
string
	
--
	
表单中标签后缀


	
label-width
	
string
	
'84px'
	
表单中标签占位宽度


	
message-type
	
'inline' | 'block' | 'absolute'
	
'block'
	
当 validate-type 设置为 text 时，配置文本类型错误类型，可配置行内或者块级，其他值都为 absolute 定位


	
model
	
{ [prop: string]: any }
	
--
	
表单数据对象


	
overflow-title3.15.0
	
boolean
	
false
	
标签超长是否显示提示


	
popper-options
	
Popover.IPopperOption 
	
--
	
校验错误提示配置，透传至 Popover 组件


	
rules
	
{ [prop: string]: IFormRules | IFormRules[] }
	
--
	
表单验证规则


	
show-message
	
boolean
	
true
	
是否显示校验错误信息


	
size
	
'medium' | 'small' | 'mini'
	
--
	
表单内组件的尺寸，不设置则为默认尺寸


	
validate-on-rule-change
	
boolean | "deep"
	
true
	
是否在 rules 属性改变后立即触发一次验证（"deep"选项新增于3.21.0）


	
validate-position
	
IFormPosition
	
'right'
	
指定校验提示框显示的位置


	
validate-type
	
'tip' | 'text'
	
'tip'
	
校验类型
events
	
名称
	
类型
	
说明


	
validate
	
(prop: string, isValid: boolean, message: string) => void
	
任一表单项被校验后触发
methods
	
名称
	
类型
	
说明


	
clearValidate
	
(prop: string | string[]) => void
	
移除表单项的校验结果，可传入待移除的表单项的 prop ，或者 prop 组成的数组，如不传则移除整个表单的校验结果


	
resetFields
	
() => void
	
对整个表单进行重置，将所有字段值重置为初始值并移除校验结果


	
validate
	
IFormValidateMethod
	
对整个表单进行校验的方法，参数为一个回调函数（该回调函数会在校验结束后被调用，并传入两个参数：1、是否校验成功 2、未通过校验的字段）返回一个 promise


	
validateField
	
IFormValidateFieldMethod
	
对部分表单字段进行校验的方法, 第一个参数为单个 prop 或者 prop 数组，第二个参数是回调函数，每个表单项检验完后会依次调用该回调
slots
	
名称
	
说明


	
default
	
默认插槽，自定义表单内容
form-item
component
props
	
名称
	
类型
	
默认值
	
说明


	
error
	
string
	
--
	
表单项错误文本，设置该值会使表单验证状态变为 error


	
extra
	
string
	
--
	
表单项额外提示


	
inline-message
	
boolean
	
--
	
是否以行内形式展示校验信息(推荐使用 message-type 设置)


	
label
	
string
	
--
	
标签文本


	
label-width
	
string
	
'80px'
	
表单域标签的的宽度


	
message-type
	
'inline' | 'block'
	
--
	
配置文本类型错误类型，可配置行内或者块级，不配置则为 absolute 定位


	
prop
	
string
	
--
	
对应表单域 model 字段，如需使用表单校验，该属性是必填的


	
required
	
boolean
	
false
	
是否必填，如不设置，则会根据校验规则自动生成


	
rules
	
IFormRules
	
--
	
表单项验证规则


	
show-message
	
boolean
	
true
	
是否显示校验错误信息


	
size
	
'medium' | 'small' | 'mini'
	
--
	
用于控制该表单域下组件的尺寸，不设置则为默认尺寸


	
validate-debounce
	
boolean
	
false
	
是否开启校验防抖，在连续输入的情况下，会在最后一次输入结束时才开始校验


	
validate-icon
	
Component
	
--
	
校验提示框的图标，类型为组件


	
validate-position
	
IFormPosition
	
'top-end'
	
指定校验提示框显示的位置


	
validate-type
	
'text' | 'tip'
	
'tip'
	
校验提示显示类型
methods
	
名称
	
类型
	
说明


	
clearValidate
	
() => void
	
移除该表单项的校验结果


	
resetField
	
() => void
	
对该表单项进行重置，将其值重置为初始值并移除校验结果
slots
联系我们
扫码加入OpenTiny用户群
相关资源
Angular - 中文网
Vue - 中文网
ionicons 图标库
开发者社区
公众号 - OpenTiny
掘金 - OpenTiny 社区
知乎 - OpenTiny 社区
B 站 - OpenTiny 社区
相关连接
GitHub
更新日志
讨论区

Copyright © Huawei Technologies Co., Ltd. 2023. All rights reserved.

粤ICP备2022156931号-1

Search
K
  `
  const apiData = parseElementApi(content);
  return apiData;
}
console.log(JSON.stringify(extractApiInfo(), null, 2)); // 第二个参数为null，第三个参数控制缩进

// module.exports = { parseElementApi, extractApiInfo };
