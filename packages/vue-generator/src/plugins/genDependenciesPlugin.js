import { mergeOptions } from '../utils/mergeOptions'
import { parseImport } from '@/generator/vue/sfc/parseImport'

const defaultOption = {
  fileName: 'package.json',
  path: '.'
}

const getComponentsSet = (schema) => {
  const { pageSchema = [], blockSchema = [] } = schema
  let allComponents = []

  pageSchema.forEach((pageItem) => {
    allComponents = allComponents.concat(parseImport(pageItem.children || [])?.components || [])
  })

  blockSchema.forEach((blockItem) => {
    allComponents = allComponents.concat(parseImport(blockItem.children || [])?.components || [])
  })

  return new Set(allComponents)
}

const parseSchema = (schema) => {
  const { utils = [], componentsMap = [] } = schema

  const resDeps = {}

  for (const {
    type,
    content: { package: packageName, version }
  } of utils) {
    if (type !== 'npm' || resDeps[packageName]) {
      continue
    }

    resDeps[packageName] = version || 'latest'
  }

  const componentsSet = getComponentsSet(schema)

  for (const { package: packageName, version, componentName } of componentsMap) {
    if (packageName && !resDeps[packageName] && componentsSet.has(componentName)) {
      resDeps[packageName] = version || 'latest'
    }
  }

  // 处理内置 Icon，如果使用了 tinyvue 组件，则默认添加 @opentiny/vue-icon 依赖，且依赖与 @opentiny/vue 依赖版本一致
  if (resDeps['@opentiny/vue']) {
    resDeps['@opentiny/vue-icon'] = resDeps['@opentiny/vue']
  }

  return resDeps
}

function genDependenciesPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, fileName } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-dependencies',
    description: 'transform dependencies to package.json',
    /**
     * 分析依赖，写入 package.json
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const dependencies = parseSchema(schema)
      const originPackageItem = this.getFile(path, fileName)

      if (!originPackageItem) {
        return {
          fileName,
          path,
          fileContent: JSON.stringify({ dependencies })
        }
      }

      let originPackageJSON = JSON.parse(originPackageItem.fileContent)

      originPackageJSON.dependencies = {
        ...originPackageJSON.dependencies,
        ...dependencies
      }

      this.addFile({ fileType: 'json', fileName, path, fileContent: JSON.stringify(originPackageJSON) }, true)
    }
  }
}

export default genDependenciesPlugin
