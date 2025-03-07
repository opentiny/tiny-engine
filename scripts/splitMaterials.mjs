/*
 * @Description: 
 * @Date: 2025-03-07 14:29:56
 * @LastEditors: xiaopang
 * @LastEditTime: 2025-03-07 14:35:20
 */
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

const capitalize = (str) => str ? `${str.charAt(0).toUpperCase()}${str.slice(1)}` : ''
const toPascalCase = (str) => str ? str.split('-').map(capitalize).join('') : ''

/**
 * 将物料资产包拆分为单个组件
 */
const splitMaterials = () => {
  try {
    components.forEach((comp) => {
      const matchedSnippets = [];
      let category = null;
      
      snippets.forEach((child) => {
        // 修改这里：检查 children 中的 schema.componentName || snippetName
        const matched = child.children.filter((item) => {
          const snippetComponentName = item?.schema?.componentName || item.snippetName;
          if (!snippetComponentName) return false;
          
          if (Array.isArray(comp.component)) {
            return toPascalCase(comp.component[0]) === toPascalCase(snippetComponentName);
          }
          return toPascalCase(comp.component) === toPascalCase(snippetComponentName);
        });

        if (matched.length > 0) {
          // 为每个 snippet 添加 category
          const enrichedSnippets = matched.map(snippet => ({
            ...snippet,
            category: child.group,
          }));
          
          matchedSnippets.push(...enrichedSnippets);
          // 使用第一个匹配的分组作为组件级别的类别
          if (!category) {
            category = child.group;
          }
        }
      });

      if (matchedSnippets.length > 0) {
        comp.snippets = matchedSnippets;
        comp.category = category;
      }

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
