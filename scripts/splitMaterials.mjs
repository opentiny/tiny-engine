import fs from 'fs-extra'
import path from 'node:path'

const bundlePath = path.join(process.cwd(), '/packages/design-core/public/mock/bundle.json')
const bundle = fs.readJSONSync(bundlePath)
const { components, snippets, blocks } = bundle.data.materials

const capitalize = (str) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`
const toPascalCase = (str) => str.split('-').map(capitalize).join('')

try {
  components.forEach((comp) => {
    snippets.some((child) => {
      const snippet = child.children.find((item) => {
        if (Array.isArray(comp.component)) {
          return toPascalCase(comp.component[0]) === toPascalCase(item.snippetName)
        }

        return toPascalCase(comp.component) === toPascalCase(item.snippetName)
      })

      if (snippet) {
        comp.snippet = { ...snippet }
        comp.category = child.group

        return true
      }

      return false
    })

    const fileName = Array.isArray(comp.component) ? comp.component[0] : comp.component
    const componentPath = path.join(process.cwd(), '/materials/components', `${fileName}.json`)

    fs.outputJsonSync(componentPath, comp, { spaces: 2 })
  })

  blocks.forEach((block) => {
    const blockPath = path.join(process.cwd(), '/materials/blocks', `${block.label}.json`)

    fs.outputJsonSync(blockPath, block, { spaces: 2 })
  })
} catch (error) {
  throw new Error(`拆分物料资产包失败, ${error}`)
}
