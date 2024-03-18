// TODO: 支持4种 import 的形式
export function generateImportStatement(config) {
  const { moduleName, exportName, alias, destructuring } = config

  let statementName = `${exportName}`

  if (alias && alias !== exportName) {
    statementName = `${exportName} as ${alias}`
  }

  if (destructuring) {
    statementName = `{ ${statementName} }`
  }

  return `import ${statementName} from '${moduleName}'`
}

export function generateImportByPkgName(config) {
  const { pkgName, imports } = config

  const importStatements = imports
    .filter(({ destructuring }) => destructuring)
    .map(({ componentName, exportName }) => {
      if (componentName === exportName) {
        return componentName
      }

      return `${exportName} as ${componentName}`
    })

  // 默认导出如果存在，应该只有一个
  let defaultImports = imports.find(({ destructuring }) => !destructuring)
  let defaultImportStatement = ''

  if (defaultImports) {
    const { componentName, exportName } = defaultImports

    if (exportName && exportName !== componentName) {
      defaultImportStatement = `${exportName} as ${componentName}`
    } else {
      defaultImportStatement = `${exportName || componentName || ''}`
    }

    defaultImportStatement = `import ${defaultImportStatement} from "${pkgName}"\n`
  }

  if (!importStatements.length && defaultImportStatement) {
    return defaultImportStatement
  }

  return `${defaultImportStatement}import { ${importStatements.join(',')} } from "${pkgName}"`
}
