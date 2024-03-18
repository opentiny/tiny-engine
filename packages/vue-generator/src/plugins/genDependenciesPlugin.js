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

  for (const { package: packageName, version } of componentsMap) {
    if (packageName && !resDeps[packageName]) {
      resDeps[packageName] = version || 'latest'
    }
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
