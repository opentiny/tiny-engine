import { BUILTIN_COMPONENT_NAME } from '@/constant'
import { generateImportByPkgName } from '@/utils/generateImportStatement'

export const parseImport = (children) => {
  let components = []
  let blocks = []

  for (const item of children || []) {
    if (item?.componentType === BUILTIN_COMPONENT_NAME.BLOCK) {
      blocks.push(item?.componentName)
    } else {
      components.push(item?.componentName)
    }

    if (Array.isArray(item?.children) && item.children.length > 0) {
      const { components: childComp, blocks: childBlocks } = parseImport(item.children)

      components = components.concat(childComp)
      blocks = blocks.concat(childBlocks)
    }
  }

  return {
    components: [...new Set(components)],
    blocks: [...new Set(blocks)]
  }
}

export const getImportMap = (schema, componentsMap, config) => {
  const { components, blocks } = parseImport(schema.children)
  const pkgMap = {}
  const importComps = componentsMap.filter(({ componentName }) => components.includes(componentName))

  importComps.forEach((item) => {
    const key = item.package || item.main
    if (!key) {
      return
    }

    pkgMap[key] = pkgMap[key] || []

    pkgMap[key].push(item)
  })

  const { blockRelativePath = '../components', blockSuffix = '.vue' } = config
  const blockPkgMap = {}
  const relativePath = blockRelativePath.endsWith('/') ? blockRelativePath.slice(0, -1) : blockRelativePath

  blocks.map((name) => {
    const source = `${relativePath}/${name}${blockSuffix}`

    blockPkgMap[source] = blockPkgMap[source] || []
    blockPkgMap[source].push({
      componentName: name,
      exportName: name,
      destructuring: false,
      package: source
    })
  })

  return {
    pkgMap,
    blockPkgMap
  }
}

export const genCompImport = (schema, componentsMap, config = {}) => {
  const { components, blocks } = parseImport(schema.children)
  const pkgMap = {}
  const { blockRelativePath = '../components/', blockSuffix = '.vue' } = config

  const importComps = componentsMap.filter(({ componentName }) => components.includes(componentName))

  importComps.forEach((item) => {
    pkgMap[item.package] = pkgMap[item.package] || []

    pkgMap[item.package].push(item)
  })

  const batchImportStatements = Object.entries(pkgMap).map(([key, value]) => {
    return generateImportByPkgName({ pkgName: key, imports: value })
  })

  const blockImportStatement = blocks.map((name) => {
    return `import ${name} from ${blockRelativePath}/${name}${blockSuffix}`
  })

  return `${batchImportStatements.join('\n')}\n${blockImportStatement.join('\n')}`
}
