import { getMetaApi, META_SERVICE, useMaterial, useResource, useCanvas } from '@opentiny/tiny-engine-meta-register'
import { compile as blockCompiler } from '@opentiny/tiny-engine-block-compiler'

const blockCompileCache = new Map()

export const fetchBlockSchema = async (blockName) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${blockName}`)

// TODO: 待验证
export const updateBlockCompileCache = (name) => {
  if (blockCompileCache.has(name)) {
    blockCompileCache.delete(name)

    useCanvas().canvasApi.value?.removeBlockCompsCacheByName(name)
  }
}

// 预构建 block
export const getBlockCompileRes = async (schema) => {
  const name = schema.fileName

  if (blockCompileCache.has(name)) {
    return {
      [name]: blockCompileCache.get(name)
    }
  }

  const generateCodeService = getMetaApi('engine.service.generateCode')
  const blocks = await generateCodeService.getAllNestedBlocksSchema(schema, fetchBlockSchema)
  const componentsMap = useResource().resState.componentsMap

  // 调用 api 得到页面出码结果
  let blocksSourceCode = null
  const blocksWithoutCache = blocks.filter((blockItem) => !blockCompileCache.has(blockItem.fileName))

  // 需要出码的区块
  blocksSourceCode = [schema, ...blocksWithoutCache].map((blockSchema) => {
    const sourceCode = generateCodeService.generatePageCode(blockSchema, componentsMap || [], {
      blockRelativePath: './'
    })

    return {
      fileName: blockSchema.fileName,
      sourceCode
    }
  })

  const compiledResult = blockCompiler(blocksSourceCode, {
    compileCache: blockCompileCache
  })

  return compiledResult
}

// 获取 blockBlob
export const getBlockByName = async (name) => {
  // 找到对应区块的 schema
  const block = await fetchBlockSchema(name)
  const blockItem = block?.[0]

  if (!blockItem) {
    return
  }

  const historyId = blockItem?.current_history
  const historySchema = blockItem?.histories?.find?.((historyItem) => historyItem?.id === historyId)

  let schemaContent = null

  // 有指定的历史版本，优先选用历史版本
  if (historyId && historySchema?.content) {
    schemaContent = historySchema.content
  } else {
    schemaContent = blockItem?.content
  }

  if (!schemaContent) {
    return
  }

  // 用于选中区块的时候，拿到属性配置，显示在右侧属性面板
  useMaterial().addBlockResources(name, schemaContent)

  return getBlockCompileRes(schemaContent)
}
