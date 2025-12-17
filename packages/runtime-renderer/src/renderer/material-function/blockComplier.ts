import { compile as blockCompiler } from '@opentiny/tiny-engine-block-compiler'
import { genSFCWithDefaultPlugin } from '@opentiny/tiny-engine-dsl-vue'
import { useAppSchema } from '../../composables/useAppSchema'
const blockCompileCache = new Map()
export const getBlockCompileResult = async (name: any) => {
  if (blockCompileCache.has(name)) {
    return {
      [name]: blockCompileCache.get(name)
    }
  }

  const list: any = await useAppSchema().fetchBlockByName(name)

  const block = list?.histories?.find((item: any) => item.version === list?.version)

  const realSchema = block.content || list?.content
  if (!realSchema) {
    return
  }
  const componentsMap = useAppSchema().appSchema.value?.componentsMap || []

  // 需要出码的区块
  const sourceCode = genSFCWithDefaultPlugin(realSchema, componentsMap || [], { blockRelativePath: './' })

  const blocksSourceCode = {
    fileName: realSchema.fileName,
    sourceCode
  }

  const compiledResult = blockCompiler([blocksSourceCode], { compileCache: blockCompileCache })

  return compiledResult
}
