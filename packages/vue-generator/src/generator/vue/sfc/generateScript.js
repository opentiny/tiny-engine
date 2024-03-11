import { genCompImport } from './parseImport'

const generateImports = (schema, config = {}) => {
  const { defaultImports = [], componentsMap = [] } = config
  // 组件 import
  const compImportStr = genCompImport(schema, componentsMap)

  return `${[...defaultImports, ...compImportStr].join('\n')}`
}

export const generateSetupScript = (schema, config) => {
  // generate import statement
  // props 声明
  // emits 声明
  // resource 工具类绑定
  // reactive State 页面变量绑定声明
  // js 方法声明绑定
  // 生命周期绑定

  const lang = ''
  const scriptStart = `<script setup ${lang}>`
  const endScript = '</script>'
  const defaultImports = [
    'import * as vue from "vue"',
    'import { defineProps, defineEmits } from "vue"',
    'import { I18nInjectionKey } from "vue-i18n"'
  ]
  const compImportStr = generateImports(schema)
  const importStr = `${defaultImports.join('\n')}\n${compImportStr}`

  


}
