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
    const blockItem = item.value?.[0]

    if (item.status !== 'fulfilled' || !blockItem) {
      return
    }

    const historyId = blockItem?.current_history
    const historySchema = blockItem?.histories?.find?.((historyItem) => historyItem?.id === historyId)

    let schemaContent = null

    if (historyId && historySchema?.content) {
      schemaContent = historySchema.content
    } else {
      schemaContent = blockItem?.content
    }

    if (!schemaContent) {
      return
    }

    // 区块 schema 中加上当前版本号，让后续数据支持缓存或更丰富的操作
    schemaContent.version = historyId || ''
    // 区块子依赖
    schemaContent.subBlockDeps = blockNames

    res.push(schemaContent)

    extraList.push(getAllNestedBlocksSchema(schemaContent, fetchBlockSchemaApi, blockSet))
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
