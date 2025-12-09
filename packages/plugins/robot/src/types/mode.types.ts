/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

/**
 * 聊天模式枚举
 */
export enum ChatMode {
  Agent = 'agent',
  Chat = 'chat'
}

/**
 * 模式钩子接口
 * 定义所有聊天模式必须实现的配置方法和生命周期钩子
 */
export interface ModeHooks {
  // ========== 配置方法 ==========
  /** 获取 API URL */
  getApiUrl: () => string

  /** 获取内容类型 */
  getContentType: () => string

  /** 获取加载类型 */
  getLoadingType: () => string

  // ========== 生命周期钩子 ==========
  /** 会话开始 */
  onConversationStart: (conversationState: any, messages: any[], apis: any) => void

  /** 消息发送 */
  onMessageSent: () => void

  /** 请求前处理 */
  onBeforeRequest: (requestParams: any) => Promise<any>

  /** 流式开始 */
  onStreamStart: (messages: any[]) => void

  /** 流式数据处理 */
  onStreamData: (data: object, content: string | object, messages: any[]) => void

  /** 请求结束 */
  onRequestEnd: (finishReason: string, content: string, messages: any[]) => Promise<void>

  /** 工具调用流 */
  onStreamTools: (tools: Record<string, unknown>[], context: { currentMessage: any }) => void

  /** 调用工具前 */
  onBeforeCallTool: (tool: Record<string, unknown>, context: { currentMessage: any }) => void

  /** 调用工具后 */
  onPostCallTool: (
    tool: Record<string, unknown>,
    toolCallResult: object | string,
    toolCallStatus: string,
    context: { currentMessage: any }
  ) => void

  /** 所有工具调用后 */
  onPostCallTools: (toolsResult: Record<string, unknown>[], context: { currentMessage: any }) => void

  /** 消息处理完成 */
  onMessageProcessed: (
    finishReason: string,
    content: string,
    messages: any[],
    context: { abortControllerMap: Record<string, AbortController> }
  ) => Promise<void>

  /** 会话结束 */
  onConversationEnd: (conversationId: string) => void
}
