import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'package.json',
  path: '.'
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

  // TODO: 这里理论上应该传 物料数据，然后分析页面 schema 中用到的所有组件，将需要的组件的依赖注入到 package.json，没用到则不注入
  for (const { package: packageName, version } of componentsMap) {
    if (packageName && !resDeps[packageName]) {
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
     * @param {import('../generator/generateApp').AppSchema} schema
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
