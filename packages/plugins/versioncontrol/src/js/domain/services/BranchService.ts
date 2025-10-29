import type {
  BranchOperationHistory,
  BranchStatusResponse,
  ConflictReport,
  ID,
  MergeStrategy,
  PageSchema,
  User
} from '../../shared/type'
import { Branch } from '../models/Branch'
import type { Commit } from '../models/Commit'
import { ConflictResloverImpl, type ConflictResolver } from '../strategies/ConflictResolver'
import { MergeResloverImpl, type MergeResolver } from '../strategies/MergeResolver'

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
  destroyBranch(branch: Branch, force?: boolean): void

  /**
   * 合并分支
   * @param sourceBranch 源分支
   * @param sourceHeadCommit 源分支最新Commit
   * @param sourceBranchId 源分支ID
   * @param targetBranch 目标分支
   * @param targetHeadCommit 目标分支最新Commit
   * @param targetBranchId 目标分支ID
   * @param strategy 策略
   * @param commitMessage 提交信息
   * @returns
   */
  mergeBranch(
    sourceBranch: Branch,
    sourceHeadCommit: Commit,
    sourceBranchId: ID,
    targetBranch: Branch,
    targetHeadCommit: Commit,
    targetBranchId: ID,
    strategy?: MergeStrategy,
    commitMessage?: string
  ): { newCommitId?: ID; conflictedFiles?: ConflictReport[]; isConflicted?: boolean; mergedSchema?: PageSchema }

  /**
   * 获取分支状态
   * @param branchId 分支ID
   * @param lastCommit 最新提交
   * @param commitsAhead
   * @param commitsBehind
   * @returns 分支状态响应对象
   */
  getBranchStatus(branch: Branch, lastCommit: Commit, commitsAhead: number, commitsBehind: number): BranchStatusResponse

  /**
   * 保护分支
   * @param branch 分支
   * @param protectionRule 保护规则
   */
  protectBranch(branch: Branch, protectionRule: any): void

  /**
   * 解除分支保护
   * @param branch 分支
   */
  unprotectBranch(branch: Branch): void

  /**
   * 归档分支
   * @param branch 分支
   */
  archiveBranch(branch: Branch): void

  /**
   * 解除归档分支
   * @param branch 分支
   */
  unarchiveBranch(branch: Branch): void

  /**
   * 恢复已删除的分支
   * @param branch 分支
   */
  restoreBranch(branch: Branch): void

  /**
   * 重命名分支
   * @param branch 分支
   * @param newName 新名称
   */
  renameBranch(branch: Branch, newName: string): void
}

/**
 * BranchService 实现类
 */
export class BranchServiceImpl implements BranchService {
  private readonly mergeService: MergeResolver
  private readonly conflictResolver: ConflictResolver
  private readonly idGenerator: () => ID

  constructor(
    mergeService: MergeResolver = new MergeResloverImpl(),
    conflictResolver: ConflictResolver = new ConflictResloverImpl(),
    idGenerator: () => ID = () => `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  ) {
    this.mergeService = mergeService
    this.conflictResolver = conflictResolver
    this.idGenerator = idGenerator
  }

  /**
   * 创建一个新的分支
   * @param name 名字
   * @param upstreamBranchId 上游分支
   * @param creator 创建者
   * @param commitId 提交ID
   * @param description 描述
   * @returns
   */
  createBranch(name: string, upstreamBranchId: ID, creator: User, commitId: ID, description?: string): Branch {
    const newBranch = new Branch(
      this.idGenerator(),
      name,
      'normal', // 默认为normal，可根据需求调整
      'active',
      commitId,
      commitId,
      creator,
      Date.now(),
      Date.now(),
      { description, upstreamBranchId }
    )

    this.recordBranchOperation(newBranch.id, creator, 'create', { name, upstreamBranchId, commitId })

    return newBranch
  }

  /**
   * 销毁一个分支
   * @param branch 分支
   * @param force 是否强制
   */
  destroyBranch(branch: Branch, force?: boolean): void {
    if (!force && branch.status !== 'merged' && branch.status !== 'deleted') {
      throw new Error(`Branch ${branch.name} is not merged or already deleted. Use force to destroy.`)
    }

    // 标记为删除状态,而不是直接从数据库删除，以便于审计和恢复
    branch.setStatus('deleted')

    this.recordBranchOperation(branch.id, branch.creator, 'destroy', { force })
  }

  /**
   * 合并分支
   * @param sourceBranch 源分支
   * @param sourceHeadCommit 源分支最新Commit
   * @param sourceBranchId 源分支ID
   * @param targetBranch 目标分支
   * @param targetHeadCommit 目标分支最新Commit
   * @param targetBranchId 目标分支ID
   * @param strategy 策略
   * @param commitMessage 提交信息
   * @returns
   */
  mergeBranch(
    sourceBranch: Branch,
    sourceHeadCommit: Commit,
    sourceBranchId: ID,
    targetBranch: Branch,
    targetHeadCommit: Commit,
    targetBranchId: ID,
    strategy?: MergeStrategy,
    commitMessage?: string
  ): { newCommitId?: ID; conflictedFiles?: ConflictReport[]; isConflicted?: boolean; mergedSchema?: PageSchema } {
    // 标记目标分支为合并中状态
    targetBranch.setStatus('merging')

    try {
      const result = this.mergeService.performMerge(
        sourceBranch,
        targetBranch,
        sourceHeadCommit.schema,
        targetHeadCommit.schema,
        strategy!,
        commitMessage
      )

      if (result.conflictedReports && result.conflictedReports.length > 0) {
        targetBranch.markAsConflicted()
        this.recordBranchOperation(targetBranch.id, sourceBranch.creator, 'merge', {
          sourceBranchId,
          targetBranchId,
          strategy,
          status: 'conflicted'
        })
        return { conflictedFiles: result?.conflictedReports }
      } else {
        targetBranch.markAsActive() // 合并成功后设置为活跃状态
        this.recordBranchOperation(targetBranch.id, sourceBranch.creator, 'merge', {
          sourceBranchId,
          targetBranchId,
          strategy,
          status: 'success'
          // newCommitId: newCommit.id
        })
        return { isConflicted: false, mergedSchema: result.mergedSchema }
      }
    } catch (error) {
      targetBranch.markAsActive() // 恢复活跃状态
      this.recordBranchOperation(targetBranch.id, sourceBranch.creator, 'merge', {
        sourceBranchId,
        targetBranchId,
        strategy,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * 获取分支状态
   * @param branch 分支
   * @param lastCommit 最新提交
   * @returns
   */
  getBranchStatus(
    branch: Branch,
    lastCommit: Commit,
    commitsAhead: number,
    commitsBehind: number
  ): BranchStatusResponse {
    // 判断是否有待提交变更和是否已合并
    const hasPendingChanges = branch.hasPendingChanges()
    const isMerged = branch.status === 'merged'

    const lastCommitSummary = lastCommit
      ? {
          id: lastCommit.id,
          message: lastCommit.message,
          author: lastCommit.author,
          timestamp: lastCommit.timestamp
        }
      : undefined

    return {
      branchId: branch.id,
      status: branch.status,
      hasPendingChanges,
      isMerged,
      mergingStatus: {
        inProgress: branch.status === 'merged',
        conflicted: branch.status === 'conflicted'
        // conflictCount: ... // 实际冲突数量需要从 ConflictResolver 获取
      },
      lastCommit: lastCommitSummary,
      commitsAhead,
      commitsBehind
    }
  }

  /**
   * 保护分支
   * @param branch 分支
   * @param protectionRule 保护规则
   */
  protectBranch(branch: Branch, protectionRule: any): void {
    branch.setProtection(protectionRule)
    this.recordBranchOperation(branch.id, branch.creator, 'protect', { protectionRule })
  }

  /**
   * 解除分支保护
   * @param branch 分支
   */
  unprotectBranch(branch: Branch): void {
    branch.removeProtection()
    this.recordBranchOperation(branch.id, branch.creator, 'unprotect', {})
  }

  /**
   * 归档分支
   * @param branch 分支
   */
  archiveBranch(branch: Branch): void {
    branch.setStatus('archived')
    this.recordBranchOperation(branch.id, branch.creator, 'archive', {})
  }

  /**
   * 解除归档分支
   * @param branch 分支
   */
  unarchiveBranch(branch: Branch): void {
    branch.setStatus('active') // 恢复为活跃状态
    this.recordBranchOperation(branch.id, branch.creator, 'unarchive', {})
  }

  /**
   * 恢复已删除的分支
   * @param branchId 分支ID
   */
  restoreBranch(branch: Branch): void {
    if (branch.status !== 'deleted') {
      throw new Error(`Branch ${branch.name} is not in deleted status.`)
    }
    branch.setStatus('active')
    this.recordBranchOperation(branch.id, branch.creator, 'restore', {})
  }
  /**
   * 重命名分支
   * @param branch 分支
   * @param newName 新名字
   */

  renameBranch(branch: Branch, newName: string): void {
    branch.setName(newName)
    this.recordBranchOperation(branch.id, branch.creator, 'rename', { oldName: branch.name, newName })
  }

  // 私有辅助方法

  /**
   * 记录分支操作历史
   * @param branchId 分支ID
   * @param operator 操作者
   * @param operationType 操作类型
   * @param details 细节选项
   */
  private recordBranchOperation(
    branchId: ID,
    operator: User,
    operationType: BranchOperationHistory['operationType'],
    details: Record<string, unknown>
  ): void {
    // 待开发，这里会将操作记录持久化到数据库或日志系统
    const _operation: BranchOperationHistory = {
      operationId: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      branchId,
      operator,
      operationType,
      timestamp: Date.now(),
      details
    }
    // console.log('Branch Operation Recorded:', operation)
    // this.operationRepository.save(operation); // 假设存在一个 operationRepository
  }
}
