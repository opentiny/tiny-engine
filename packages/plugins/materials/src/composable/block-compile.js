import { getMetaApi, META_SERVICE, useMaterial, useResource } from '@opentiny/tiny-engine-meta-register'
import { compile as blockCompiler } from '@opentiny/tiny-engine-block-compiler'

const blockBlobMap = new Map()

export const fetchBlockSchema = async (blockName) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${blockName}`)

// 预构建 block
export const getBlockCompileRes = async (schema) => {
  const generateCodeService = getMetaApi('engine.service.generateCode')

  // TODO: 如何得到子区块的 版本？
  const blocks = await generateCodeService.getAllNestedBlocksSchema(schema, fetchBlockSchema)
  const componentsMap = useResource().resState.componentsMap

  // 调用 api 得到页面出码结果
  const blocksSourceCode = [schema, ...blocks].map((blockSchema) => {
    const sourceCode = generateCodeService.generatePageCode(blockSchema, componentsMap || [], {
      blockRelativePath: './'
    })

    return {
      fileName: blockSchema.fileName,
      sourceCode
    }
  })

  /**
   * TODO: 编译缓存
   * 1. 区块锁定版本情况下，以主区块版本号确定是否需要重新编译
   * 2. 区块版本为latest 情况下，以 schema 是否变化来确定是否重新编译
   */
  const compiledResult = blockCompiler(blocksSourceCode, {})

  // 将编译结果存入到 blockBlobMap
  blockBlobMap.set(schema.fileName, compiledResult)

  return compiledResult
}

// 获取 blockBlob
export const getBlockByName = async (name) => {
  if (blockBlobMap.has(name)) {
    return blockBlobMap.get(name)
  }

  // 没有的时候，找到对应区块的 schema，调用 getBlockCompileRes 方法编译区块
  const block = await fetchBlockSchema(name)

  if (!block?.[0]?.content) {
    return
  }

  useMaterial().addBlockResources(name, block[0].content)

  return getBlockCompileRes(block[0].content)
}
