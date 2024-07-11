import { generateApp, parseRequiredBlocks, genSFCWithDefaultPlugin } from '@opentiny/tiny-engine-dsl-vue'
import defaultPrettierConfig from '../../js/config-files/prettierrc'

// 应用出码默认配置
const defaultOptions = {
  pluginConfig: {
    formatCode: {
      // 默认格式化配置
      ...defaultPrettierConfig
    }
  }
}

// 应用出码
const generateAppCode = async (appSchema, options = {}) => {
  const instance = generateApp({ ...defaultOptions, ...options })

  return instance.generate(appSchema)
}

// 页面出码
const generatePageCode = (...args) => {
  return genSFCWithDefaultPlugin(...args)
}

/**
 * 获取所有嵌套的区块 schema
 * @param {*} pageSchema 页面 schema
 * @param {*} fetchBlockSchemaApi 获取 blockSchema 的 api
 * @param {*} blockSet 已经获取的区块 set，默认不需要传
 * @returns
 */
const getAllNestedBlocksSchema = async (pageSchema, fetchBlockSchemaApi, blockSet = new Set()) => {
  let res = []

  const blockNames = parseRequiredBlocks(pageSchema)
  const promiseList = blockNames
    .filter((name) => {
      if (blockSet.has(name)) {
        return false
      }

      blockSet.add(name)

      return true
    })
    .map((name) => fetchBlockSchemaApi(name))
  const schemaList = await Promise.allSettled(promiseList)
  const extraList = []

  schemaList.forEach((item) => {
    if (item.status === 'fulfilled' && item.value?.[0]?.content) {
      res.push(item.value[0].content)
      extraList.push(getAllNestedBlocksSchema(item.value[0].content, fetchBlockSchemaApi, blockSet))
    }
  })
  ;(await Promise.allSettled(extraList)).forEach((item) => {
    if (item.status === 'fulfilled' && item.value) {
      res.push(...item.value)
    }
  })

  return res
}

export const GenerateCodeService = {
  id: 'engine.service.generateCode',
  type: 'MetaService',
  options: {},
  apis: {
    parseRequiredBlocks,
    getAllNestedBlocksSchema,
    generatePageCode,
    generateAppCode
  }
}
