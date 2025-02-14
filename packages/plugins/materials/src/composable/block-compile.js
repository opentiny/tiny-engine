import { getMetaApi, META_SERVICE, useMaterial, useResource, useCanvas } from '@opentiny/tiny-engine-meta-register'
import { compile as blockCompiler } from '@opentiny/tiny-engine-block-compiler'

const blockVersionMap = new Map()
const blockCompileCache = new Map()

// 获取所有区块分组下的所有区块
const getAllGroupBlocks = async () => {
  const { fetchGroups, fetchGroupBlocksByIds } = getMetaApi('engine.plugins.materials.block')
  const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

  const groups = await fetchGroups(appId)

  const groupIds = groups.map((groupItem) => groupItem.id)

  const blocks = await fetchGroupBlocksByIds({ groupIds })

  for (const blockItem of blocks) {
    if (blockItem?.content?.fileName && blockItem?.current_version) {
      blockVersionMap.set(blockItem.content.fileName, blockItem.current_version)
    }
  }
}

export const fetchBlockSchema = async (blockName) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${blockName}`)

// TODO: 待验证
export const updateBlockCompileCache = () => {
  blockVersionMap.clear()
  useCanvas().canvasApi.value?.removeBlockCompsCache()
  blockCompileCache.clear()
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
  const componentsMap = useResource().appSchemaState.componentsMap

  // 需要出码的区块
  const sourceCode = generateCodeService.generatePageCode(schema, componentsMap || [], {
    blockRelativePath: './'
  })

  const blocksSourceCode = {
    fileName: schema.fileName,
    sourceCode
  }

  const compiledResult = blockCompiler([blocksSourceCode], {
    compileCache: blockCompileCache
  })

  return compiledResult
}

// 获取 blockBlob
export const getBlockByName = async (name) => {
  // version map 为空，获取所有区块的版本记录
  if (blockVersionMap.size === 0) {
    await getAllGroupBlocks()
  }

  // 找到对应区块的 schema
  const block = await fetchBlockSchema(name)
  const blockItem = block?.[0]

  if (!blockItem) {
    return
  }

  const historyVersion = blockVersionMap.get(name)
  const historySchema = blockItem?.histories?.find?.((historyItem) => historyItem?.version === historyVersion)

  let schemaContent = null

  // 有指定的历史版本，优先选用历史版本
  if (historyVersion && historySchema?.content) {
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
