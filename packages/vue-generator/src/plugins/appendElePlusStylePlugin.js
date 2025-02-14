import prettier from 'prettier'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import parserBabel from 'prettier/parser-babel'
import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'package.json',
  path: '.',
  prettierOption: {
    singleQuote: true,
    printWidth: 120,
    semi: false,
    trailingComma: 'none'
  }
}

function genElementPlusStyleDeps(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { prettierOption, fileName, path } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-element-plus-style',
    description: 'import element-plus style',
    /**
     * 注入 element-plus 全局样式依赖
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run() {
      const originPackageItem = this.getFile(path, fileName)

      if (!originPackageItem) {
        return
      }

      let originPackageJSON = JSON.parse(originPackageItem.fileContent)
      const hasElementPlusDeps = Object.keys(originPackageJSON.dependencies).includes('element-plus')

      if (!hasElementPlusDeps) {
        return
      }

      const mainJsFile = this.getFile('./src', 'main.js') || {}

      if (!mainJsFile.fileContent) {
        return
      }

      const ast = parse(mainJsFile.fileContent, { sourceType: 'module' })
      let lastImport = null
      let hasElementPlusStyleImport = false

      traverse(ast, {
        ImportDeclaration(path) {
          lastImport = path

          if (path.node.source.value === 'element-plus/dist/index.css') {
            hasElementPlusStyleImport = true
          }
        }
      })

      // 已经存在 element-plus 的 import，不再插入
      if (hasElementPlusStyleImport) {
        return
      }

      // 引入 element-plus 样式依赖
      if (lastImport) {
        lastImport.insertAfter(parse("import 'element-plus/dist/index.css'", { sourceType: 'module' }).program.body[0])
      }

      const newFileContent = generate(ast).code

      const formattedContent = prettier.format(newFileContent, {
        parser: 'babel',
        plugins: [parserBabel],
        ...prettierOption
      })

      this.replaceFile({ ...mainJsFile, fileContent: formattedContent })
    }
  }
}

export default genElementPlusStyleDeps
