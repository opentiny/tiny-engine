import { getMetaApi, META_SERVICE, useMaterial, useResource, useCanvas } from '@opentiny/tiny-engine-meta-register'
import { compile as blockCompiler } from '@opentiny/tiny-engine-block-compiler'

const blockCachesMap = new Map()
const blockCompileCache = new Map()

export const fetchBlockSchema = async (blockName) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${blockName}`)

const getBlockDepsIsEq = (curDeps, cacheDeps) => {
  const curDepsKeys = Object.keys(curDeps).sort()
  const cacheDepsKeys = Object.keys(cacheDeps).sort()

  // 依赖有减少或者增加
  if (curDepsKeys.length !== cacheDepsKeys.length) {
    return false
  }

  for (let i = 0; i++; i < curDepsKeys.length) {
    // 依赖换了
    if (curDepsKeys[i] !== cacheDepsKeys[i]) {
      return false
    }
    // 换版本号了
    if (curDeps[curDepsKeys[i]] !== cacheDeps[cacheDepsKeys[i]]) {
      return false
    }
  }

  return true
}

// TODO: 待验证
export const updateBlockCompileCache = (name) => {
  for (const [key, value] of blockCompileCache) {
    // 依赖了变更的区块，删除缓存
    if (value.subBlockDeps.includes(name) || key === name) {
      blockCompileCache.delete(key)
      // 删除画布内的缓存
      useCanvas().canvasApi.value?.removeBlockCompsCacheByName(key)
    }
  }
}

// 预构建 block
export const getBlockCompileRes = async (schema) => {
  const generateCodeService = getMetaApi('engine.service.generateCode')
  const blocks = await generateCodeService.getAllNestedBlocksSchema(schema, fetchBlockSchema)
  const componentsMap = useResource().resState.componentsMap
  const blockDepsVersion = Object.fromEntries(blocks.map(({ fileName, version }) => [fileName, version]))
  const schemaStr = JSON.stringify(schema)

  // 调用 api 得到页面出码结果
  let blocksSourceCode = null

  try {
    const cache = blockCachesMap.get(schema.fileName)
    const isSchemaEq = cache.schema === schemaStr
    const isDepsEq = getBlockDepsIsEq(blockDepsVersion, cache.blockDepsVersion)

    // 有缓存，且依赖、schema 都没变，直接使用缓存，不再重新出码
    if (isSchemaEq && isDepsEq && cache.blocksSourceCode) {
      blocksSourceCode = cache.blocksSourceCode
    }
  } catch (error) {
    // cache miss
  }

  // 缓存匹配失败，重新出码
  if (!blocksSourceCode) {
    blocksSourceCode = [schema, ...blocks].map((blockSchema) => {
      const sourceCode = generateCodeService.generatePageCode(blockSchema, componentsMap || [], {
        blockRelativePath: './'
      })

      return {
        fileName: blockSchema.fileName,
        sourceCode,
        subBlockDeps: blockSchema.subBlockDeps
      }
    })
  }

  // 将出码结果缓存到 blockCachesMap
  blockCachesMap.set(schema.fileName, {
    blockDepsVersion,
    schema: schemaStr,
    blocksSourceCode
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
