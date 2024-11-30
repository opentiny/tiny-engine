import { compileScript, compileTemplate, compileStyle, parse, babelParse, MagicString } from 'vue/compiler-sfc'
import type { SFCParseResult, SFCDescriptor, BindingMetadata } from 'vue/compiler-sfc'

const compileBlockStyle = (descriptor: SFCDescriptor, id: string) => {
  const cssResArr = descriptor.styles.map((style) => {
    const result = compileStyle({
      id,
      filename: descriptor.filename,
      source: style.content,
      scoped: style.scoped
    })

    return result.code || ''
  })

  return cssResArr.join('\n')
}

const compileBlockTemplate = (descriptor: SFCDescriptor, id: string, bindingMetadata: BindingMetadata | undefined) => {
  const { code, errors } = compileTemplate({
    id,
    ast: descriptor.template?.ast,
    source: descriptor.template?.content!,
    filename: descriptor.filename,
    scoped: descriptor.styles.some((styleItem) => styleItem.scoped),
    slotted: descriptor.slotted,
    compilerOptions: {
      bindingMetadata
    }
  })

  return { code, errors }
}

const resolveRelativeImport = (code: string, resultMap: IResultMap) => {
  const magicStr = new MagicString(code)
  const ast = babelParse(code, { sourceType: 'module' }).program.body

  for (const node of ast) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value

      if (source.startsWith('./')) {
        const fileName = node.source.value.replace(/^(\.\/+)/, '').slice(0, -4)

        if (resultMap[fileName]) {
          magicStr.overwrite(node.source.start!, node.source.end!, `'${resultMap[fileName].blobURL}'`)
        }
      }
    }
  }

  return magicStr.toString()
}

const DEFAULT_COMPONENT_NAME = '__sfc__'

// @ts-ignore
const compileBlockScript = (
  descriptor: SFCDescriptor,
  id: string,
  resultMap: IResultMap
): [string, BindingMetadata | undefined] => {
  // TODO: try catch
  const compiledScript = compileScript(descriptor, {
    genDefaultAs: DEFAULT_COMPONENT_NAME,
    inlineTemplate: true,
    id
  })

  let code = compiledScript.content

  // if (compiledScript.bindings) {
  //   code = `/* Analyzed bindings: ${JSON.stringify(compiledScript.bindings, null, 2)} */\n${code}`
  // }

  return [code, compiledScript.bindings]
}

interface IParsedFileItem {
  fileName: string
  sourceCode: string
  compilerParseResult: SFCParseResult
  importedFiles: string[]
  fileNameWithRelativePath: string
}

interface IResultMap {
  [key: string]: compiledItem
}

interface compiledItem {
  js: string
  style: string
  blobURL: string
}

// 依次构建 script、template、style，然后组装成 import
const compileFile = (file: IParsedFileItem, resultMap: IResultMap): Omit<compiledItem, 'blobURL'> => {
  const descriptor = file.compilerParseResult.descriptor

  // 编译 script
  const [compiledScript, bindings] = compileBlockScript(descriptor, file.fileName, resultMap)
  let componentCode = `${compiledScript}`

  // 编译 template
  if (!descriptor.scriptSetup && descriptor.template) {
    // @ts-ignore
    const { code: compiledTemplate, errors } = compileBlockTemplate(descriptor, file.fileName, bindings)

    componentCode += `\n ${compiledTemplate} \n ${DEFAULT_COMPONENT_NAME}.render = render`
  }

  const hasScoped = descriptor.styles.some((styleItem) => styleItem.scoped)

  if (hasScoped) {
    componentCode += `\n${DEFAULT_COMPONENT_NAME}.__scopeId='data-v-${file.fileName}'`
  }

  // 编译 style
  const styleString = compileBlockStyle(descriptor, file.fileName)

  return {
    js: `${componentCode}\nexport default ${DEFAULT_COMPONENT_NAME}`,
    style: styleString
  }
}

// 解析依赖的文件
const parseImportedFiles = (descriptor: SFCDescriptor): string[] => {
  let scriptContent = ''

  if (descriptor.script) {
    scriptContent = descriptor.script.content
  } else if (descriptor.scriptSetup) {
    scriptContent = descriptor.scriptSetup.content
  }

  if (!scriptContent) {
    return []
  }

  const ast = babelParse(scriptContent, { sourceFilename: descriptor.filename, sourceType: 'module' }).program.body
  const res: string[] = []

  for (const node of ast) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value

      // 相对路径依赖，区块嵌套的场景
      if (source.startsWith('./')) {
        res.push(node.source.value)
      }
    }
  }

  return res
}

const filterNextCompileFiles = (files: IParsedFileItem[], compiledFilesSet: Set<string>) => {
  return files.filter((fileItem) => {
    // 未被编译
    return (
      !compiledFilesSet.has(fileItem.fileNameWithRelativePath) &&
      // 且子依赖已经被编译
      !fileItem.importedFiles.some((item) => !compiledFilesSet.has(item))
    )
  })
}

const getJSBlobURL = (str: string) => {
  const blob = new Blob([str], { type: 'application/javascript' })

  return URL.createObjectURL(blob)
}

export interface IFileItem {
  fileName: string
  sourceCode: string
}

export type IFileList = IFileItem[]

// TODO: 支持 importMap
// @ts-ignore
export const compile = (fileList: IFileList, config) => {
  const parsedFileList = fileList.map((fileItem) => {
    const { fileName, sourceCode } = fileItem
    // FIXME:这里解析的结果不能重复使用，因为可能会涉及修改引入的依赖
    const { descriptor, errors } = parse(sourceCode, { filename: fileName })

    if (errors) {
      // TODO: 抛出错误
    }

    // TODO: 1. 当前仅支持 vue 文件编译，检查文件后缀，如果不是 .vue 结尾的，抛出错误
    // TODO: 2. 检查 style lang，仅支持 css
    // TODO: 3. 检查 template lang，当前不支持任何 template lang
    // TODO: 4. 检查 script lang，当前仅支持 js， jsx 晚点支持

    // 解析依赖的文件
    const importedFiles = parseImportedFiles(descriptor)

    return {
      fileName,
      sourceCode,
      compilerParseResult: {
        descriptor,
        errors
      },
      importedFiles,
      fileNameWithRelativePath: `./${fileName}.vue`
    }
  })

  const compiledFilesSet: Set<string> = new Set()
  const resultMap: IResultMap = {}

  // 根据依赖顺序编译文件。优先编译 0 依赖的文件。
  let nextCompileFile = filterNextCompileFiles(parsedFileList, compiledFilesSet)

  while (nextCompileFile.length) {
    for (const fileItem of nextCompileFile) {
      const { js, style } = compileFile(fileItem, resultMap)
      const resolvedImportJs = resolveRelativeImport(js, resultMap)

      resultMap[fileItem.fileName] = {
        js: resolvedImportJs,
        style,
        blobURL: getJSBlobURL(resolvedImportJs)
      }

      compiledFilesSet.add(fileItem.fileNameWithRelativePath)
    }

    nextCompileFile = filterNextCompileFiles(parsedFileList, compiledFilesSet)
  }

  return resultMap
}
