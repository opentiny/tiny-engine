import type {
  Commit,
  CommitHistoryRequest,
  CommitHistoryResponse,
  DiffResult,
  ID,
  PageSchema,
  Snapshot,
  User
} from '../../shared/type'

/**
 * CommitService 接口定义
 * 专注于 Commit 相关的操作
 */
export interface CommitService {
  /**
   * 创建一个新的提交
   * @param branchId 提交所属的分支ID
   * @param message 提交信息
   * @param author 提交作者
   * @param schema 本次提交的 PageSchema
   * @returns 新创建的Commit对象
   */
  createCommit(branchId: ID, message: string, author: User, schema: PageSchema): Commit

  /**
   * 根据提交ID获取提交详情
   * @param commitId 提交ID
   * @returns Commit 对象或者null
   */
  getCommit(commitId: ID): Commit | null

  /**
   * 获取某个分支的提交历史
   * @param branchId
   * @param options 查询选项 如分页或作者过滤等
   * @returns 提交列表
   */
  getCommitsByBranch(branchId: ID, options?: { limits?: number; offset?: number }): Commit[]

  /**
   * 获取两个提交之间的差异
   * @param commitIdA 第一个提交ID
   * @param commitIdB 第二个提交ID
   * @returns 差异结果
   */
  getCommitDiff(commitIdA: ID, commitIdB: ID): DiffResult

  /**
   * 根据提交生成快照 (即获取该提交的 PageSchema)
   * @param commitId 提交ID
   * @returns 快照对象，包含 PageSchema
   */
  generateSnapshot(commitId: ID): Snapshot

  /**
   * 验证提交的签名
   * @param commitId 提交ID
   * @returns 是否验证成功
   */
  verifyCommit(commitId: ID): boolean

  /**
   * 将分支回滚到指定提交
   * @param branchId 分支ID
   * @param commitId 目标提交ID
   */
  rollbackBranchToCommit(branchId: ID, commitId: ID): void

  /**
   * 为指定提交添加标签
   * @param commitId 提交ID
   * @param tag 标签名称
   */
  addTagToCommit(commitId: ID, tag: string): void

  /**
   * 根据标签获取所有相关提交
   * @param tag 标签名称
   * @returns 提交列表
   */
  getCommitByTag(tag: string): Commit[]

  /**
   * 获取提交历史，支持更复杂的查询条件
   * @param request 提交历史查询请求对象
   * @returns 提交历史响应对象
   */
  getCommitHistory(request: CommitHistoryRequest): CommitHistoryResponse
}
