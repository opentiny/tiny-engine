import fs from 'node:fs'
import path from 'node:path'
import replace from '@rollup/plugin-replace'
import { parse } from '@babel/parser'

export function treeShakingPlugin(registryPath) {
  if (!registryPath) {
    return null
  }

  const envReplace = {}
  const filePath = path.resolve(process.cwd(), registryPath)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const ast = parse(fileContent, { sourceType: 'module' })
    const commentPattern = /#__TINY_ENGINE_TREE_SHAKING__:\s*(?<value>true|false)/

    ast.program.body.forEach((item) => {
      // 过滤默认导出 且导出类型为 object
      if (item.type === 'ExportDefaultDeclaration' && item.declaration?.type === 'ObjectExpression') {
        item.declaration.properties.forEach((propertyItem) => {
          // 是属性 且 key 为 string
          if (propertyItem.type === 'ObjectProperty' && propertyItem.key?.type === 'StringLiteral') {
            const key = propertyItem.key.value
            // 有 comment，解析 comment。
            // 通过 comment 指定 treeshaking，优先以 comment 为标准
            if (propertyItem.leadingComments?.length) {
              for (const commentItem of propertyItem.leadingComments) {
                const match = commentItem.value.match(commentPattern)

                if (!match) {
                  continue
                }

                if (match.groups.value === 'true') {
                  envReplace[`__TINY_ENGINE_REMOVED_REGISTRY["${key}"]`] = false
                }

                return
              }
            }

            // 注册表注释了插件，默认 tree-shaking，
            if (propertyItem.value.type === 'BooleanLiteral' && propertyItem.value.value === false) {
              envReplace[`__TINY_ENGINE_REMOVED_REGISTRY["${key}"]`] = false
            }
          }
        })
      }
    })

    return replace({
      values: {
        ...envReplace
      },
      delimiters: ['', '']
    })
  } catch (error) {
    const logger = console
    logger.warn('[TinyEngine] tree-shaking plugin error', error)
  }

  return null
}
