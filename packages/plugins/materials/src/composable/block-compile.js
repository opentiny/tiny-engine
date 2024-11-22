import { getMetaApi, META_SERVICE, useResource } from '@opentiny/tiny-engine'
// TODO: 封装成元服务
import { compile as blockCompiler } from '@opentiny/tiny-engine-block-compiler'


const blockBlobMap = new Map()

export const fetchBlockSchema = async (blockName) => getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${blockName}`)

// 预构建 block
export const preBuildBlock = async (schema) => {
  const generateCodeService = getMetaApi('engine.service.generateCode')

  const blocks = await generateCodeService.getAllNestedBlocksSchema(schema, fetchBlockSchema)

  // const hasCircularDeps = 
  // if () {
  // }

  const componentsMap = useResource().resState.componentsMap

  // const mainSourceCode = generateCodeService.generatePageCode(blockSchema, componentsMap || [], { blockRelativePath: './' })

  // 调用 api 得到页面出码结果
  const blocksSourceCode = [schema, ...blocks].map((blockSchema) => {
    // TODO: 计算 hash map，避免重复出码&重复编译
    const sourceCode = generateCodeService.generatePageCode(blockSchema, componentsMap || [], { blockRelativePath: './' })

    return {
      fileName: blockSchema.fileName,
      sourceCode,
    }
  })

  const compiledResult = blockCompiler(blocksSourceCode, {})

  // TODO: 将编译结果存入到 blockBlobMap
  blockBlobMap.set(schema.fileName, compiledResult)

  return compiledResult
}

// 获取 blockBlob
export const getBlockByName = async (name) => {
  if (blockBlobMap.has(name)) {
    return blockBlobMap.get(name)
  }

  // TODO: 没有的时候，找到对应区块的 schema，带农业 preBuildBlock 方法编译区块
}
