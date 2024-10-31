import prettier from 'prettier'
import parserHtml from 'prettier/parser-html'
import parseCss from 'prettier/parser-postcss'
import parserBabel from 'prettier/parser-babel'
import { mergeOptions } from '../utils/mergeOptions'

function formatCode(options = {}) {
  const defaultOption = {
    singleQuote: true,
    printWidth: 120,
    semi: false,
    trailingComma: 'none'
  }

  const parserMap = {
    json: 'json-stringify',
    js: 'babel',
    jsx: 'babel',
    css: 'css',
    less: 'less',
    html: 'html',
    vue: 'vue'
  }

  const mergedOption = mergeOptions(defaultOption, options)

  return {
    name: 'tinyEngine-generateCode-plugin-format-code',
    description: 'transform block schema to code',
    /**
     * 格式化出码
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run(schema, context) {
      context.genResult.forEach((item) => {
        const { fileContent, fileName } = item
        const parser = parserMap[fileName.split('.').at(-1)]

        if (!parser) {
          return
        }

        const formattedCode = prettier.format(fileContent, {
          parser,
          plugins: [parserBabel, parseCss, parserHtml, ...(mergedOption.customPlugin || [])],
          ...mergedOption
        })

        this.replaceFile({ ...item, fileContent: formattedCode })
      })
    }
  }
}

export default formatCode
