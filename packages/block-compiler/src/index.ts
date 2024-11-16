import { parse, babelParse } from 'vue/compiler-sfc'
import type { SFCDescriptor } from 'vue/compiler-sfc'


const compileStyle = () => {

}

const compileTemplate = () => {

}

const compileScript = () => {
  
}

// 依次构建 script、template、style，然后组装成 import
const compileFile = () => {

}

// 解析依赖的文件
const parseImportedFiles = (descriptor: SFCDescriptor): string[] => {
  let scriptContent = ''

  if (descriptor.script) {
    scriptContent = descriptor.script.content
  } else if (descriptor.scriptSetup) {
    scriptContent = descriptor.scriptSetup.content
    // ast = babelParse()
  }
  
  if (!scriptContent) {
    return []
  }

  const ast = babelParse(scriptContent, { sourceFilename: descriptor.filename, sourceType: 'module' }).program.body
  const res: string[] = []

  for(const node of ast) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value

      // 相对路径依赖，区块嵌套的场景
      if (source.startsWith('./')) {
        console.log('node', node)
        // res.push()
      }

    }
  }

  return res
}

interface IFileItem {
  fileName: string;
  sourceCode: string;
}

type IFileList = IFileItem[]

export const compile = (fileList: IFileList, config) => {
  console.log('compile entry')
  const parsedFileList = fileList.map((fileItem) => {
    const { fileName, sourceCode } = fileItem
    const { descriptor, errors } = parse(sourceCode, { filename: fileName })

    if (errors) {
      // TODO: 抛出错误
    }

    // TODO: 解析依赖的文件
    const importedFiles = parseImportedFiles(descriptor)


    return {
      fileName,
      sourceCode,
      compilerParseResult: {
        descriptor,
        errors
      }
    }
  })

  console.log('parsedFileList', parsedFileList)

  const context = {}

  const result = []

  // TODO:根据依赖顺序编译文件。优先编译 0 依赖的文件。



  return result
}
