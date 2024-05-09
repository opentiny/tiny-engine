import { mergeOptions } from '../utils/mergeOptions'
import { generateImportStatement } from '../utils/generateImportStatement'

const defaultOption = {
  localeFileName: 'locale.js',
  entryFileName: 'index.js',
  path: './src/i18n'
}

function genI18nPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, localeFileName, entryFileName } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-i18n',
    description: 'transform i18n schema to i18n code plugin',
    /**
     * 将国际化 schema 转换成 i18n 高代码
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const i18n = schema?.i18n || []

      const res = []

      // 生成国际化词条文件
      for (const [key, value] of Object.entries(i18n)) {
        res.push({
          fileType: 'json',
          fileName: `${key}.json`,
          path,
          fileContent: JSON.stringify(value, null, 2)
        })
      }

      const langs = Object.keys(i18n)
      const importStatements = langs.map((lang) =>
        generateImportStatement({ moduleName: `./${lang}.json`, exportName: lang })
      )

      // 生成 locale.js
      res.push({
        fileType: 'json',
        fileName: localeFileName,
        path,
        fileContent: `
${importStatements.join('\n')}

export default { ${langs.join(',')} }`
      })

      // 生成 index.js 入口文件
      res.push({
        fileName: entryFileName,
        path,
        fileContent: `
import i18n from '@opentiny/tiny-engine-i18n-host'
import lowcode from '../lowcodeConfig/lowcode'
import locale from './${localeFileName}'

i18n.lowcode = lowcode
${langs.map((langItem) => `i18n.global.mergeLocaleMessage('${langItem}', locale.${langItem})`).join('\n')}

export default i18n`
      })

      return res
    }
  }
}

export default genI18nPlugin
