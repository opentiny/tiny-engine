export const NEW_METHOD_TYPE = 'newMethod'
export const INVALID_VARNAME_CHAR_RE = /[^0-9a-zA-Z_$]/
export const VALID_VARNAME_RE = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/

export const METHOD_TIPS_MAP = {
  default: '选择已有方法或者添加新方法(点击 确定 之后将在JS面板中创建一个该名称的新方法)',
  exist: '方法名称已存在',
  ruleInvalid: '请输入有效的方法名，可以由字母、数字、下划线、$ 符号组成，不能以数字开头',
  empty: '方法名称不能为空'
}
