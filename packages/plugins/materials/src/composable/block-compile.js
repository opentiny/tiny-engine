import { getMetaApi, META_SERVICE, useMaterial, useResource } from '@opentiny/tiny-engine-meta-register'
import { compile as blockCompiler } from '@opentiny/tiny-engine-block-compiler'

const blockBlobMap = new Map()

export const fetchBlockSchema = async (blockName) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${blockName}`)

// TODO: 需要支持配置，比如前缀加上租户 id，防止多租户的场景下同名同版本号的区块内容不一致却命中缓存的场景
const BLOCK_COMPILE_CACHE_PREFIX = 'block_compile_cache'

// 预构建 block
export const getBlockCompileRes = async (schema) => {
  const generateCodeService = getMetaApi('engine.service.generateCode')
  const blocks = await generateCodeService.getAllNestedBlocksSchema(schema, fetchBlockSchema)
  const componentsMap = useResource().resState.componentsMap
  const blockDepsVersion = blocks
    .map(({ fileName, version }) => ({ fileName, version }))
    .sort((a, b) => a.fileName - b.fileName)
  const versionDepsStr = JSON.stringify(blockDepsVersion)
  const schemaStr = JSON.stringify(schema)

  // 调用 api 得到页面出码结果
  let blocksSourceCode = null

  try {
    const cache = JSON.parse(localStorage.getItem(`${BLOCK_COMPILE_CACHE_PREFIX}_${schema.fileName}`))

    // 有缓存，返回缓存
    if (cache.versionDeps === versionDepsStr && cache.schema === schemaStr && cache.blocksSourceCode) {
      blocksSourceCode = cache.blocksSourceCode
    }
  } catch (error) {
    // cache miss
  }

  if (!blocksSourceCode) {
    blocksSourceCode = [schema, ...blocks].map((blockSchema) => {
      const sourceCode = generateCodeService.generatePageCode(blockSchema, componentsMap || [], {
        blockRelativePath: './'
      })

      return {
        fileName: blockSchema.fileName,
        sourceCode
      }
    })
  }

  // 将出码结果缓存到 localstorage
  localStorage.setItem(
    `${BLOCK_COMPILE_CACHE_PREFIX}_${schema.fileName}`,
    JSON.stringify({ versionDeps: versionDepsStr, schema: schemaStr, blocksSourceCode })
  )

  const compiledResult = blockCompiler(blocksSourceCode, {})

  return compiledResult
}

// 获取 blockBlob
export const getBlockByName = async (name) => {
  if (blockBlobMap.has(name)) {
    return blockBlobMap.get(name)
  }

  // 没有的时候，找到对应区块的 schema，调用 getBlockCompileRes 方法编译区块
  const block = await fetchBlockSchema(name)
  const blockItem = block?.[0]

  if (!blockItem) {
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

  useMaterial().addBlockResources(name, schemaContent)

  return getBlockCompileRes(schemaContent)
}
