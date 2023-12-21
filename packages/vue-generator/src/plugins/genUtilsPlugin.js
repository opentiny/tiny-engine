import { mergeOptions } from '../utils/mergeOptions'
import { generateImportStatement } from '../utils/generateImportStatement'

const defaultOption = {
  fileName: 'utils.js',
  path: './src'
}

function genUtilsPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, fileName } = realOptions

  const handleNpmUtils = (utilsConfig) => {
    const { content } = utilsConfig
    const { package: packageName, exportName, destructuring, subName } = content

    const statement = generateImportStatement({ moduleName: packageName, exportName, alias: subName, destructuring })
    let realExportName = exportName

    if (subName) {
      realExportName = subName
    }

    return {
      res: statement,
      exportName: realExportName
    }
  }

  const handleFunctionUtils = (utilsConfig) => {
    const { content, name } = utilsConfig

    return {
      res: `const ${name} = ${content.value}`,
      exportName: name
    }
  }

  return {
    name: 'tinyengine-plugin-generatecode-utils',
    description: 'transform utils schema to utils code',
    parseSchema(schema) {
      const { utils } = schema

      return {
        id: 'utils',
        result: utils || []
      }
    },
    transform(transformedSchema) {
      const { utils } = transformedSchema

      if (!Array.isArray(utils)) {
        return
      }

      const importStatements = []
      const variableStatements = []
      const exportVariables = []

      const utilsHandlerMap = {
        npm: handleNpmUtils,
        function: handleFunctionUtils
      }

      for (const utilItem of utils) {
        const { res, exportName } = utilsHandlerMap[utilItem.type](utilItem)

        if (utilItem.type === 'function') {
          variableStatements.push(res)
        } else {
          importStatements.push(res)
        }

        exportVariables.push(exportName)
      }

      const fileContent = `
      ${importStatements.join('\n')}\n
      ${variableStatements.join('\n')}\n
      export { ${exportVariables.join(',')} }
      `

      return {
        fileName,
        path,
        fileContent
      }
    }
  }
}

export default genUtilsPlugin
