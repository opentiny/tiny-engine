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

  return `import ${statementName} from ${moduleName}`
}
