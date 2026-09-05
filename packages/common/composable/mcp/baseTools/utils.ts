import type { IState, ResourceItem, ResourceTemplateItem } from '../type'
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'

interface IResult {
  ok: boolean
  resources: Omit<ResourceItem, 'readCallback'>[]
  resourceTemplates: Omit<ResourceTemplateItem, 'readTemplateCallback'>[]
}

// 尝试从远端 mcpClient 拉取资源与模板列表
// 返回 { ok, resources, resourceTemplates }，调用方可在 ok=false 时做本地兜底
export const tryFetchRemoteLists = async (state: IState): Promise<IResult> => {
  const client = state?.mcpClient
  const result: IResult = { ok: false, resources: [], resourceTemplates: [] }

  if (!client) {
    return result
  }

  try {
    const [resourcesList, resourceTemplatesList] = await Promise.all([
      client.listResources().catch(() => null),
      client.listResourceTemplates().catch(() => null)
    ])

    const remoteResources = resourcesList?.resources || []
    const remoteTemplates = resourceTemplatesList?.resourceTemplates || []

    if (Array.isArray(remoteResources)) {
      result.resources = remoteResources
    }

    if (Array.isArray(remoteTemplates)) {
      result.resourceTemplates = remoteTemplates
    }

    result.ok = true
  } catch {
    result.ok = false
  }

  return result
}

// ========== 字节处理工具函数 ==========

/**
 * 计算字符串的字节长度
 * @param text 要计算长度的字符串
 * @returns 字节长度
 */
export const calculateByteLength = (text: string): number => {
  return new TextEncoder().encode(text).length
}

/**
 * 将文本截断到指定的字节数限制
 * @param text 要截断的文本
 * @param limit 字节数限制
 * @returns 截断后的文本
 */
export const truncateTextToBytes = (text: string, limit: number): string => {
  const enc = new TextEncoder().encode(text)
  const sliced = enc.slice(0, limit)
  return new TextDecoder('utf-8').decode(sliced)
}

// ========== 内容验证工具函数 ==========

/**
 * 验证内容是否为文本类型
 * @param contents 资源内容数组
 * @returns 验证结果
 */
export const validateTextualContent = (contents: ReadResourceResult['contents']) => {
  if (!Array.isArray(contents)) {
    return { ok: false as const, error: 'read_resources_failed' }
  }
  for (const c of contents) {
    // 仅允许 text 字段存在（不处理二进制）
    if (typeof c?.text !== 'string') {
      return { ok: false as const, error: 'unsupported_content_type' }
    }
  }
  return { ok: true as const }
}

// ========== 资源读取工具函数 ==========

/**
 * 远端优先的资源读取，失败时回退到本地
 * @param state 状态对象
 * @param uri 资源URI
 * @returns 读取结果
 */
export const readResourceWithFallback = async (
  state: IState,
  uri: string
): Promise<{ ok: boolean; result?: ReadResourceResult; error?: string }> => {
  const client = state?.mcpClient
  let res: ReadResourceResult | null = null

  // 远端优先读取
  try {
    if (client && typeof client.readResource === 'function') {
      res = await client.readResource({ uri }).catch(() => null)
    }
  } catch {
    // ignore
  }

  // 不做本地回退
  if (!res) {
    return { ok: false, error: 'read_resources_failed' }
  }

  return { ok: true, result: res }
}

// ========== 内容截断处理工具函数 ==========

/**
 * 应用内容截断策略
 * @param contents 资源内容数组
 * @param maxBytes 最大字节数
 * @param allowTruncate 是否允许截断
 * @returns 截断处理结果
 */
export const applyContentTruncation = (
  contents: ReadResourceResult['contents'],
  maxBytes: number,
  allowTruncate: boolean
) => {
  let truncated = false
  const next = contents.map((c) => {
    if (typeof c.text === 'string' && calculateByteLength(c.text) > maxBytes) {
      if (!allowTruncate) {
        return { __tooLarge: true }
      }
      truncated = true
      return { ...c, text: truncateTextToBytes(c.text, maxBytes) }
    }
    return c
  })
  // 检查是否有未允许的超限项
  const tooLarge = next.some((c) => c?.__tooLarge)
  if (tooLarge) {
    return { ok: false as const, error: 'content_too_large' }
  }
  return { ok: true as const, next, truncated }
}

// ========== 统一资源读取协调器 ==========

/**
 * 统一的资源读取入口
 * @param state 状态对象
 * @param uri 资源URI
 * @param options 读取选项
 * @returns 读取结果
 */
export const readResourceContent = async (
  state: IState,
  uri: string,
  options: { maxBytes?: number; allowTruncate?: boolean } = {}
) => {
  const { maxBytes = 200_000, allowTruncate = true } = options

  // 读取资源
  const readResult = await readResourceWithFallback(state, uri)
  if (!readResult.ok) {
    return { ok: false, error: readResult.error }
  }

  const contents = readResult.result?.contents || []

  // 验证内容类型
  const validationResult = validateTextualContent(contents)
  if (!validationResult.ok) {
    return { ok: false, error: validationResult.error }
  }

  // 应用截断策略
  const truncationResult = applyContentTruncation(contents, maxBytes, allowTruncate)
  if (!truncationResult.ok) {
    return { ok: false, error: truncationResult.error }
  }

  return {
    ok: true,
    contents: truncationResult.next,
    truncated: truncationResult.truncated || undefined
  }
}

export default { tryFetchRemoteLists }
