import { parse } from '@vue/compiler-sfc'
import fs from 'fs/promises'

export function parseSFC(vueCode: string): any {
  const { descriptor, errors } = parse(vueCode)
  if (errors && (errors as any[]).length > 0) {
    // eslint-disable-next-line no-console
    console.warn('SFC parsing warnings:', errors)
  }

  const result: any = {}
  if (descriptor.template) {
    result.template = descriptor.template.content
    result.templateLang = descriptor.template.lang || 'html'
  }
  if (descriptor.scriptSetup) {
    result.scriptSetup = descriptor.scriptSetup.content
    result.scriptSetupLang = descriptor.scriptSetup.lang || 'js'
  }
  if (descriptor.script) {
    result.script = descriptor.script.content
    result.scriptLang = descriptor.script.lang || 'js'
  }
  if (descriptor.styles && descriptor.styles.length > 0) {
    result.style = descriptor.styles.map((style) => style.content).join('\n\n')
    result.styleBlocks = descriptor.styles.map((style) => ({
      content: style.content,
      lang: style.lang || 'css',
      scoped: style.scoped || false,
      module: style.module || false
    }))
  }
  if (descriptor.customBlocks && descriptor.customBlocks.length > 0) {
    result.customBlocks = descriptor.customBlocks.map((block) => ({
      type: block.type,
      content: (block as any).content,
      attrs: (block as any).attrs
    }))
  }
  return result
}

export async function parseVueFile(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf-8')
  return parseSFC(content)
}

export function validateSFC(sfcResult: any): boolean {
  return !!(sfcResult.template || sfcResult.script || sfcResult.scriptSetup)
}

export function getSFCMeta(sfcResult: any) {
  return {
    hasTemplate: !!sfcResult.template,
    hasScript: !!sfcResult.script,
    hasScriptSetup: !!sfcResult.scriptSetup,
    hasStyle: !!sfcResult.style,
    templateLang: sfcResult.templateLang,
    scriptLang: sfcResult.scriptLang || sfcResult.scriptSetupLang,
    styleBlocks: sfcResult.styleBlocks || [],
    customBlocks: sfcResult.customBlocks || []
  }
}
