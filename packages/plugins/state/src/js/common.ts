/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

/**
 * 校验monaco编辑器必填与是否有语法错误
 * @param {Object} editor 编辑器实例
 * @param {String} name 编辑器对应的表单字段名
 * @param {Object} options: { required: boolean }  required是否必填
 * @return result.success:boolean true（通过）/false（不通过）, result.message:string
 */
export const validateMonacoEditorData = (editor, name, { required, language = 'json' } = {}) => {
  if (!editor || !editor.getEditor || !editor.getValue) {
    return { success: false, message: `系统异常，请刷新后重试。` }
  }

  const content = editor.getValue()
  if (required && !content) {
    return { success: false, message: `${name}未填写，请按照提示填写后重试。` }
  }

  const model = editor.getEditor().getModel()
  const uri = model.uri._formatted
  const markers = editor.editor
    .getMonaco()
    .editor.getModelMarkers({ owner: language })
    .filter(({ resource: { _formatted } }) => _formatted === uri)
  const messages = markers.map(
    ({ startLineNumber, startColumn, message }) => `错误: line: ${startLineNumber} column: ${startColumn} ${message}`
  )

  if (messages.length) {
    return {
      success: false,
      message: `${name}存在以下错误，请先点击右上角格式化按钮自动修复或手动修改后重试：${messages.join('\n')}`
    }
  }

  return { success: true }
}
