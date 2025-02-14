import { compileScript, compileTemplate, compileStyle, parse, babelParse, MagicString } from '@vue/compiler-sfc'
import type { SFCParseResult, SFCDescriptor, BindingMetadata, CompilerOptions } from '@vue/compiler-sfc'
import { testIsJsx, transformVueJsx } from './transformJsx.ts'

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
  const isJsx = testIsJsx(descriptor)
  const expressionPlugins: CompilerOptions['expressionPlugins'] = []

  if (isJsx) {
    expressionPlugins.push('jsx')
  }

  const compileRes = compileTemplate({
    id,
    ast: descriptor.template?.ast,
    source: descriptor.template?.content!,
    filename: descriptor.filename,
    scoped: descriptor.styles.some((styleItem) => styleItem.scoped),
    slotted: descriptor.slotted,
    compilerOptions: {
      bindingMetadata,
      expressionPlugins
    }
  })

  const { errors } = compileRes
  let { code } = compileRes

  if (isJsx) {
    code = transformVueJsx(code) || ''
  }

  return { code, errors }
}

interface compiledItem {
  js: string
  style: string
  blobURL: string
}

export interface IResultMap {
  [key: string]: compiledItem
}

const resolveRelativeImport = (code: string, globalGetterName = 'loadBlockComponent') => {
  const magicStr = new MagicString(code)
  const ast = babelParse(code, { sourceType: 'module', plugins: ['jsx'] }).program.body

  let vueImportNode = null
  let hasDefineAsyncComponent = false

  for (const node of ast) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value
      if (source === 'vue' && !node.specifiers.find((spec) => spec.type === 'ImportNamespaceSpecifier')) {
        vueImportNode = node
      }
      // 标识相对路径引入的 .vue 文件为区块，使用异步组件替换
      if (source.startsWith('./') && node.source.value.endsWith('.vue')) {
        hasDefineAsyncComponent = true
        const fileName = node.source.value.replace(/^(\.\/+)/, '').slice(0, -4)
        // 默认导出名
        const defaultImportId = node.specifiers.find((spec) => spec.type === 'ImportDefaultSpecifier')?.local?.name

        // 不存在默认导出，跳过
        if (!defaultImportId) {
          continue
        }

        // 声明异步组件 const Block = defineAsyncComponent(() => import(getBlockUrl(Block)))
        magicStr.appendLeft(
          node.start!,
          `const ${defaultImportId} = defineAsyncComponent(() => window.${globalGetterName}('${fileName}'))`
        )

        // 移除 import Block from './Block.vue' 语句
        magicStr.remove(node.start!, node.end!)
      }
    }
  }

  // TODO: 拿到类型声明，拆分到另一个函数
  if (hasDefineAsyncComponent) {
    // 存在异步引入组件
    if (vueImportNode) {
      const asyncSpec = vueImportNode.specifiers.find(
        (spec) => spec.type === 'ImportSpecifier' && spec.local.name === 'defineAsyncComponent'
      )

      if (!asyncSpec) {
        const firstRelativeSpec = vueImportNode.specifiers.find((spec) => spec.type === 'ImportSpecifier')

        if (firstRelativeSpec) {
          magicStr.appendLeft(firstRelativeSpec.start!, 'defineAsyncComponent, ')
        } else {
          magicStr.appendRight(vueImportNode.specifiers[0].end!, ', { defineAsyncComponent }')
        }
      }
    } else {
      magicStr.appendLeft(ast[0].start!, "import { defineAsyncComponent } from 'vue'\n")
    }
  }

  return magicStr.toString()
}

const DEFAULT_COMPONENT_NAME = '__sfc__'

const compileBlockScript = (descriptor: SFCDescriptor, id: string): [string, BindingMetadata | undefined] => {
  const isJsx = testIsJsx(descriptor)
  const expressionPlugins: CompilerOptions['expressionPlugins'] = []

  if (isJsx) {
    expressionPlugins.push('jsx')
  }

  // TODO: try catch
  const compiledScript = compileScript(descriptor, {
    genDefaultAs: DEFAULT_COMPONENT_NAME,
    inlineTemplate: true,
    id,
    templateOptions: {
      compilerOptions: {
        expressionPlugins
      }
    }
  })

  let code = compiledScript.content

  if (isJsx) {
    code = transformVueJsx(code) || ''
  }

  return [code, compiledScript.bindings]
}

interface IParsedFileItem {
  fileName: string
  sourceCode: string
  compilerParseResult: SFCParseResult
  importedFiles: string[]
  fileNameWithRelativePath: string
}

// 依次构建 script、template、style，然后组装成 import
const compileFile = (file: IParsedFileItem): Omit<compiledItem, 'blobURL'> => {
  const descriptor = file.compilerParseResult.descriptor

  // 编译 script
  const [compiledScript, bindings] = compileBlockScript(descriptor, file.fileName)
  let componentCode = `${compiledScript}`

  // 编译 template
  if (!descriptor.scriptSetup && descriptor.template) {
    const { code: compiledTemplate } = compileBlockTemplate(descriptor, file.fileName, bindings)

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

  const ast = babelParse(scriptContent, { sourceFilename: descriptor.filename, sourceType: 'module', plugins: ['jsx'] })
    .program.body
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

const getJSBlobURL = (str: string) => {
  const blob = new Blob([str], { type: 'application/javascript' })

  return URL.createObjectURL(blob)
}

export interface IFileItem {
  fileName: string
  sourceCode: string
}

export type IFileList = IFileItem[]

export interface IConfig {
  compileCache?: Map<string, compiledItem>
  globalGetterName?: string
}

// TODO: 支持 importMap
export const compile = (fileList: IFileList, config: IConfig) => {
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

  const compileCache = config?.compileCache || new Map()

  for (const fileItem of parsedFileList) {
    const fileName = fileItem.fileName
    const cache = compileCache.get(fileName)
    let js = ''
    let style = ''

    // 优先使用缓存
    if (cache?.js && cache?.style) {
      js = cache.js
      style = cache.style
    } else {
      const compileRes = compileFile(fileItem)

      js = compileRes.js
      style = compileRes.style
    }

    const resolvedImportJs = resolveRelativeImport(js, config?.globalGetterName)

    resultMap[fileName] = {
      js: resolvedImportJs,
      style,
      blobURL: getJSBlobURL(resolvedImportJs)
    }

    compileCache.set(fileName, resultMap[fileName])

    compiledFilesSet.add(fileItem.fileNameWithRelativePath)
  }

  return resultMap
}
