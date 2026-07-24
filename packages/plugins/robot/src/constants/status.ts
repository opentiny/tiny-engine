/**
 * 状态常量定义
 * 保持与 tiny-robot v0.3.x 兼容，用于状态管理
 */

/**
 * 消息状态枚举
 */
export enum STATUS {
  PENDING = 'pending',
  STREAMING = 'streaming',
  FINISHED = 'finished',
  ERROR = 'error',
  ABORTED = 'aborted'
}

/**
 * 生成中的状态列表
 */
export const GeneratingStatus: STATUS[] = [STATUS.PENDING, STATUS.STREAMING]

/**
 * 消息状态接口
 */
export interface MessageState {
  status: STATUS
  errorMsg?: unknown
}
