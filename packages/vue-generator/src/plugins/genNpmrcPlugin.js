import { mergeOptions } from '../utils/mergeOptions'
import { parseImport } from '@/generator/vue/sfc/parseImport'

const defaultOption = {
  fileName: '.npmrc',
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
  const { utils = [], componentsMap = [], packages = [] } = schema
  const resNpmMirror = new Set()
  const componentsSet = getComponentsSet(schema)

  for (const { package: packageName, npmrc, componentName } of componentsMap) {
    if (packageName && !resNpmMirror.has(packageName) && componentsSet.has(componentName)) {
      resNpmMirror.add(npmrc)
    }
  }

  packages.forEach((item) => {
    const { package: packageName, npmrc } = item

    if (packageName && !resNpmMirror.has(packageName)) {
      resNpmMirror.add(npmrc)
    }
  })

  for (const {
    type,
    content: { package: packageName, npmrc }
  } of utils) {
    if (type !== 'npm' || resNpmMirror.has(packageName)) {
      continue
    }

    resNpmMirror.add(npmrc)
  }

  return resNpmMirror
}

function genNpmrcPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, fileName } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-npmrc',
    description: 'transform dependencies to npmrc',
    /**
     * 分析依赖，写入 npmrc
     * @param {import('@opentiny/tiny-engine-dsl-vue').IAppSchema} schema
     * @returns
     */
    run(schema) {
      const npmMirrorList = parseSchema(schema)
      this.addFile({ fileType: 'npmrc', fileName, path, fileContent: Array.from(npmMirrorList).join('\n') }, true)
    }
  }
}

export default genNpmrcPlugin
