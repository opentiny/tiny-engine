import fs from 'fs-extra'
import path from 'node:path'
import Logger from './logger.mjs'

const logger = new Logger('splitMaterials')

// 物料资产包mock数据路径
const bundlePath = path.join(process.cwd(), '/designer-demo/public/mock/bundle.json')
// 物料文件存放文件夹名称
const materialsDir = 'materials'
const bundle = fs.readJSONSync(bundlePath)
const { components, snippets, blocks } = bundle.data.materials

const capitalize = (str) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`
const toPascalCase = (str) => str.split('-').map(capitalize).join('')

/**
 * 将物料资产包拆分为单个组件
 */
const splitMaterials = () => {
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
          comp.snippets = [snippet]
          comp.category = child.group

          return true
        }

        return false
      })

      const fileName = Array.isArray(comp.component) ? comp.component[0] : comp.component
      const componentPath = path.join(process.cwd(), materialsDir, 'components', `${toPascalCase(fileName)}.json`)

      fs.outputJsonSync(componentPath, comp, { spaces: 2 })
    })

    blocks.forEach((block) => {
      const blockPath = path.join(process.cwd(), materialsDir, 'blocks', `${block.label}.json`)

      fs.outputJsonSync(blockPath, block, { spaces: 2 })
    })

    logger.success('materials splitted.')
  } catch (error) {
    logger.error(`failed to split materials: ${error}.`)
  }
}

splitMaterials()
