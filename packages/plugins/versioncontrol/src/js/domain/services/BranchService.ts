import type {
  Branch,
  BranchOperationHistoryResponse,
  BranchStatusResponse,
  CommitHistoryRequest,
  CommitHistoryResponse,
  ConflictReport,
  ID,
  MergeStrategy,
  User
} from '../../shared/type'

/**
 * BranchService 接口定义
 * 专注于 Branch 相关的领域操作
 */
export interface BranchService {
  /**
   * 创建一个新的分支
   * @param name 分支名字
   * @param upstreamBranchId 上游分支ID
   * @param creator 创建者
   * @param commitId 可选 指定从哪个提交点创建分支
   * @param description 分支描述
   * @returns 新创建的Branch对象
   */
  createBranch(name: string, upstreamBranchId: ID, creator: User, commitId?: ID, description?: string): Branch

  /**
   * 销毁一个分支
   * @param branchId 要销毁的分支ID
   * @param force 是否强制销毁，不检查是否已合并
   */
  destroyBranch(branchId: ID, force?: boolean): void

  /**
   * 合并源分支到目标分支
   * @param sourceBranchId 源分支ID
   * @param targetBranchId 目标分支ID
   * @param strategy 合并策略
   * @param commitMessage 合并提交信息
   * @returns 合并后生成的新提交ID，如果存在冲突则返回冲突文件列表
   */
  mergeBranch(
    sourceBranchId: ID,
    targetBranchId: ID,
    strategy?: MergeStrategy,
    commitMessage?: string
  ): { newCommitId?: ID; conflictedFiles?: ConflictReport[] }

  /**
   * 从母分支拉取最新更改到子分支
   * @param branchId 子分支ID
   * @param upstreamBranchId 母分支ID
   * @returns 更新后生成的新提交ID，如果存在冲突则返回冲突文件列表
   */
  updateBranch(branchId: ID, upstreamBranchId: ID): { newCommitId?: ID; conflictedFiles?: ConflictReport[] }

  /**
   * 获取分支状态
   * @param branchId 分支ID
   * @returns 分支状态响应对象
   */
  getBranchStatus(branchId: ID): BranchStatusResponse

  /**
   * 获取分支操作历史
   * @param branchId 分支ID
   * @returns 分支操作历史响应对象
   */
  getBranchOperationHistory(branchId: ID): BranchOperationHistoryResponse

  /**
   * 获取分支的提交历史
   * @param branchId 分支ID
   * @param request 提交历史查询请求对象
   * @returns 提交历史响应对象
   */
  getBranchCommitHistory(branchId: ID, request: CommitHistoryRequest): CommitHistoryResponse

  /**
   * 根据ID获取分支详情
   * @param branchId 分支ID
   * @returns Branch 对象或 null
   */
  getBranch(branchId: ID): Branch | null

  /**
   * 获取所有分支
   * @returns Branch 数组
   */
  getAllBranches(): Branch[]

  /**
   * 保护分支
   * @param branchId 分支ID
   * @param protectionRule 保护规则
   */
  protectBranch(branchId: ID, protectionRule: any): void

  /**
   * 解除分支保护
   * @param branchId 分支ID
   */
  unprotectBranch(branchId: ID): void

  /**
   * 归档分支
   * @param branchId 分支ID
   */
  archiveBranch(branchId: ID): void

  /**
   * 解除归档分支
   * @param branchId 分支ID
   */
  unarchiveBranch(branchId: ID): void

  /**
   * 恢复已删除的分支
   * @param branchId 分支ID
   */
  restoreBranch(branchId: ID): void

  /**
   * 重命名分支
   * @param branchId 分支ID
   * @param newName 新名称
   */
  renameBranch(branchId: ID, newName: string): void
}
