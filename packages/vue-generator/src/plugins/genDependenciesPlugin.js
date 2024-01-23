import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'package.json',
  path: '.'
}

function genDependenciesPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, fileName } = realOptions

  return {
    name: 'tinyengine-plugin-generatecode-dependencies',
    description: 'transform dependencies to package.json',
    parseSchema(schema) {
      const { utils } = schema

      const utilsDependencies = {}

      for (const {
        type,
        content: { package: packageName, version }
      } of utils) {
        if (type !== 'npm') {
          continue
        }

        utilsDependencies[packageName] = version || 'latest'
      }

      // TODO, 这里缺组件依赖分析
      return utilsDependencies
    },
    transform(schema) {
      const { dependencies } = this.parseSchema(schema)
      const originPackageItem = this.genResult.find((item) => item.fileName === fileName && item.path === path)

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

      this.replaceGenResult({ fileType: 'json', fileName, path, fileContent: JSON.stringify(originPackageJSON) })
    }
  }
}

export default genDependenciesPlugin
