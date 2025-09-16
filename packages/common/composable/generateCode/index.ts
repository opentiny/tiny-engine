import { generateApp, type IAppSchema } from '@opentiny/tiny-engine-dsl-vue'
import * as dslVue from '@opentiny/tiny-engine-dsl-vue'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import defaultPrettierConfig from '../../js/config-files/prettierrc'

// 应用出码默认配置
const defaultOptions = {
  pluginConfig: {
    template: {},
    block: {},
    page: {},
    dataSource: {},
    dependencies: {},
    globalState: {},
    i18n: {},
    router: {},
    utils: {},
    formatCode: {
      // 默认格式化配置
      ...defaultPrettierConfig
    },
    parseSchema: {}
  }
}

// 应用出码
const generateAppCode = async (appSchema: IAppSchema, options = {}) => {
  const enableTailwindCSS = getMergeMeta('engine.config')?.enableTailwindCSS
  const instance = generateApp({
    ...defaultOptions,
    pluginConfig: {
      ...defaultOptions.pluginConfig,
      template: { ...defaultOptions.pluginConfig.template, enableTailwindCSS }
    },
    ...options
  })

  return instance.generate(appSchema)
}

// 页面出码
const { parseRequiredBlocks, genSFCWithDefaultPlugin } = dslVue as any

const generatePageCode = (...args: any[]) => {
  return genSFCWithDefaultPlugin(...args)
}

/**
 * 获取所有嵌套的区块 schema
 * @param {*} pageSchema 页面 schema
 * @param {*} fetchBlockSchemaApi 获取 blockSchema 的 api
 * @param {*} blockSet 已经获取的区块 set，默认不需要传
 * @returns
 */
const getAllNestedBlocksSchema = async (pageSchema: any, fetchBlockSchemaApi: any, blockSet = new Set<string>()) => {
  const res: any[] = []

  const blockNames = parseRequiredBlocks(pageSchema)
  const promiseList = blockNames
    .filter((name: string) => {
      if (blockSet.has(name)) {
        return false
      }

      blockSet.add(name)

      return true
    })
    .map((name: any) => fetchBlockSchemaApi(name))
  const schemaList = await Promise.allSettled(promiseList)
  const extraList: any[] = []

  schemaList.forEach((item) => {
    if (item.status !== 'fulfilled') {
      return
    }

    const blockItem = (item.value as any[])?.[0]

    if (!blockItem) {
      return
    }

    const historyId = blockItem?.current_history
    const historySchema = blockItem?.histories?.find?.((historyItem: any) => historyItem?.id === historyId)

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
