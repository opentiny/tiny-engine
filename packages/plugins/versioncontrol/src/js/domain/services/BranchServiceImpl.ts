import type {
  BranchOperationHistory,
  BranchOperationHistoryResponse,
  BranchStatusResponse,
  CommitHistoryRequest,
  CommitHistoryResponse,
  ConflictReport,
  ID,
  MergeStrategy,
  User
} from '../../shared/type'
import { Memoize } from '../../shared/utils'
import { Branch } from '../models/Branch'
import type { BranchService } from './BranchService'
import type { CommitService } from './CommitService'
import type { CommitRepository } from './CommitServiceImpl'

/**
 * Repository 接口定义 - 用于数据持久化
 */
export interface BranchRepository {
  save(branch: Branch): void
  findById(id: ID): Branch | null
  findByName(name: string): Branch | null
  findAll(): Branch[]
  update(branch: Branch): void
  delete(id: ID): void
}

// 假设的 MergeService 和 ConflictResolver 接口
interface MergeService {
  performMerge(
    sourceBranch: Branch,
    targetBranch: Branch,
    strategy: MergeStrategy,
    commitMessage?: string
  ): { newCommitId?: ID; conflictedFiles?: ConflictReport[] }
}

interface ConflictResolver {
  generateConflictReport(sourceChanges: any[], targetChanges: any[]): ConflictReport[]
  resolveConflict(branchId: ID, filePath: string, strategy: string, resolvedContent?: string): boolean
}

/**
 * BranchService 实现类
 */
export class BranchServiceImpl implements BranchService {
  private readonly branchRepository: BranchRepository
  private readonly commitRepository: CommitRepository
  private readonly commitService: CommitService
  private readonly mergeService: MergeService
  private readonly conflictResolver: ConflictResolver
  private readonly idGenerator: () => ID

  constructor(
    branchRepository: BranchRepository,
    commitRepository: CommitRepository,
    commitService: CommitService,
    mergeService: MergeService,
    conflictResolver: ConflictResolver,
    idGenerator: () => ID = () => `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  ) {
    this.branchRepository = branchRepository
    this.commitRepository = commitRepository
    this.commitService = commitService
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
  createBranch(name: string, upstreamBranchId: ID, creator: User, commitId?: ID, description?: string): Branch {
    if (this.branchRepository.findByName(name)) {
      throw new Error(`Branch with name ${name} already exists.`)
    }

    const upstreamBranch = this.branchRepository.findById(upstreamBranchId)
    if (!upstreamBranch) {
      throw new Error(`Upstream branch with id ${upstreamBranchId} not found.`)
    }

    const baseCommit = commitId
      ? this.commitService.getCommit(commitId)
      : this.commitService.getCommit(upstreamBranch.headCommitId)
    if (!baseCommit) {
      throw new Error(`Base commit not found for branch creation.`)
    }

    const newBranch = new Branch(
      this.idGenerator(),
      name,
      'normal', // 默认为normal，可根据需求调整
      'active',
      baseCommit.id,
      baseCommit.id,
      creator,
      Date.now(),
      Date.now(),
      { description, upstreamBranchId }
    )

    this.branchRepository.save(newBranch)
    upstreamBranch.addDownstreamBranch(newBranch.id)
    this.branchRepository.update(upstreamBranch)

    this.recordBranchOperation(newBranch.id, creator, 'create', { name, upstreamBranchId, commitId })

    return newBranch
  }

  /**
   * 销毁一个分支
   * @param branchId 分支ID
   * @param force 是否强制
   */
  destroyBranch(branchId: ID, force?: boolean): void {
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    if (!force && branch.status !== 'merged' && branch.status !== 'deleted') {
      throw new Error(`Branch ${branch.name} is not merged or already deleted. Use force to destroy.`)
    }

    // 移除上游分支的下游引用
    if (branch.upstreamBranchId) {
      const updateBranch = this.branchRepository.findById(branch.upstreamBranchId)
      if (updateBranch) {
        updateBranch.removeDownstreamBranch(branch.id)
        this.branchRepository.update(updateBranch)
      }
    }

    // 标记为删除状态,而不是直接从数据库删除，以便于审计和恢复
    branch.setStatus('deleted')
    this.branchRepository.update(branch)

    this.recordBranchOperation(branch.id, branch.creator, 'destroy', { force })
  }

  /**
   * 合并源分支到目标分支
   * @param sourceBranchId 源分支ID
   * @param targetBranchId 目标分支ID
   * @param strategy 策略
   * @param commitMessage 提交信息
   * @returns
   */
  mergeBranch(
    sourceBranchId: ID,
    targetBranchId: ID,
    strategy?: MergeStrategy,
    commitMessage?: string
  ): { newCommitId?: ID; conflictedFiles?: ConflictReport[] } {
    const sourceBranch = this.branchRepository.findById(sourceBranchId)
    const targetBranch = this.branchRepository.findById(targetBranchId)

    if (!sourceBranch || !targetBranch) {
      throw new Error('Source or target branch not found.')
    }

    if (targetBranch.isProtected()) {
      // 实际应检查保护规则，例如是否允许直接合并，是否需要PR等
      // console.warn(`Branch ${targetBranch.name} is protected. Merge might require pull request.`)
    }

    // 标记目标分支为合并中状态
    targetBranch.setStatus('merging')
    this.branchRepository.update(targetBranch)

    try {
      const result = this.mergeService.performMerge(sourceBranch, targetBranch, strategy!, commitMessage)

      if (result.conflictedFiles && result.conflictedFiles.length > 0) {
        targetBranch.markAsConflicted()
        this.branchRepository.update(targetBranch)
        this.recordBranchOperation(targetBranch.id, sourceBranch.creator, 'merge', {
          sourceBranchId,
          targetBranchId,
          strategy,
          status: 'conflicted'
        })
        return result
      } else {
        targetBranch.setHeadCommitId(result.newCommitId!)
        targetBranch.markAsMerged() // 标记为已合并
        this.branchRepository.update(targetBranch)
        this.recordBranchOperation(targetBranch.id, sourceBranch.creator, 'merge', {
          sourceBranchId,
          targetBranchId,
          strategy,
          status: 'success',
          newCommitId: result.newCommitId
        })
        return result
      }
    } catch (error) {
      targetBranch.markAsActive() //标记为活跃状态
      this.branchRepository.update(targetBranch)
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
   * 从母分支拉取最新更改到子分支
   * @param branchId 分支ID
   * @param upstreamBranchId 上游分支
   * @returns
   */
  updateBranch(branchId: ID, upstreamBranchId: ID): { newCommitId?: ID; conflictedFiles?: ConflictReport[] } {
    const branch = this.branchRepository.findById(branchId)
    const upstreamBranch = this.branchRepository.findById(upstreamBranchId)

    if (!branch || !upstreamBranch) {
      throw new Error('Branch or upstream branch not found.')
    }

    // 实际上是执行一次从 upstreamBranch 到 branch 的合并
    return this.mergeBranch(
      upstreamBranchId,
      branchId,
      'three-way',
      `Merge ${upstreamBranch.name} into ${branch.name} (pull)`
    )
  }

  /**
   * 获取分支状态
   * @param branchId 分支ID
   * @returns
   */
  getBranchStatus(branchId: ID): BranchStatusResponse {
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    // 假设的逻辑来判断是否有待提交变更和是否已合并
    const hasPendingChanges = branch.hasPendingChanges()
    const isMerged = branch.status === 'merged'

    let commitsAhead = 0
    let commitsBehind = 0

    if (branch.upstreamBranchId) {
      const upstreamBranch = this.branchRepository.findById(branch.upstreamBranchId)
      if (upstreamBranch) {
        // 实际计算需要遍历提交历史，这里简化处理
        // commitsAhead = this.calculateCommitsAhead(branch.headCommitId, upstreamBranch.headCommitId);
        // commitsBehind = this.calculateCommitsBehind(branch.headCommitId, upstreamBranch.headCommitId);
        commitsAhead = branch.commitsAhead // 假设 Branch 实例已维护此数据
        commitsBehind = branch.commitsBehind // 假设 Branch 实例已维护此数据
      }
    }

    const lastCommit = this.commitService.getCommit(branch.headCommitId)
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
   * 获取分支操作历史
   * @param branchId
   * @returns
   */
  @Memoize({ ttl: 60000 })
  getBranchOperationHistory(branchId: ID): BranchOperationHistoryResponse {
    // 实际应从持久化层获取操作历史
    const history: BranchOperationHistory[] = [] // 假设从数据库获取
    // 示例数据
    history.push({
      operationId: 'op1',
      branchId,
      operator: {
        id: 'u1',
        username: 'test',
        email: 't@t.com',
        displayName: 'Test User',
        createdAt: 0,
        lastActiveAt: 0
      },
      operationType: 'create',
      timestamp: Date.now(),
      details: {}
    })

    return {
      success: true,
      history,
      totalCount: history.length
    }
  }

  /**
   * 获取分支的提交历史
   * @param branchId 分支ID
   * @param request 请求参数
   * @returns
   */
  @Memoize({ ttl: 60000 })
  getBranchCommitHistory(branchId: ID, request: CommitHistoryRequest): CommitHistoryResponse {
    // 直接委托给 CommitService
    return this.commitService.getCommitHistory({ ...request, branchId })
  }

  /**
   * 根据ID获取分支详情
   * @param branchId 分支ID
   * @returns
   */
  @Memoize({ ttl: 60000 })
  getBranch(branchId: ID): Branch | null {
    return this.branchRepository.findById(branchId)
  }

  /**
   * 获取所有分支
   * @returns
   */
  @Memoize({ ttl: 60000 })
  getAllBranches(): Branch[] {
    return this.branchRepository.findAll()
  }

  /**
   * 保护分支
   * @param branchId 分支ID
   * @param protectionRule 保护规则
   */
  protectBranch(branchId: ID, protectionRule: any): void {
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }
    branch.setProtection(protectionRule)
    this.branchRepository.update(branch)
    this.recordBranchOperation(branch.id, branch.creator, 'protect', { protectionRule })
  }

  /**
   * 解除分支保护
   * @param branchId 分支ID
   */
  unprotectBranch(branchId: ID): void {
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }
    branch.removeProtection()
    this.branchRepository.update(branch)
    this.recordBranchOperation(branch.id, branch.creator, 'unprotect', {})
  }

  /**
   * 归档分支
   * @param branchId 分支ID
   */
  archiveBranch(branchId: ID): void {
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }
    branch.setStatus('archived')
    this.branchRepository.update(branch)
    this.recordBranchOperation(branch.id, branch.creator, 'archive', {})
  }

  /**
   * 解除归档分支
   * @param branchId 分支ID
   */
  unarchiveBranch(branchId: ID): void {
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }
    branch.setStatus('active') // 恢复为活跃状态
    this.branchRepository.update(branch)
    this.recordBranchOperation(branch.id, branch.creator, 'unarchive', {})
  }

  /**
   * 恢复已删除的分支
   * @param branchId 分支ID
   */
  restoreBranch(branchId: ID): void {
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }
    if (branch.status !== 'deleted') {
      throw new Error(`Branch ${branch.name} is not in deleted status.`)
    }
    branch.setStatus('active')
    this.branchRepository.update(branch)
    this.recordBranchOperation(branch.id, branch.creator, 'restore', {})
  }
  /**
   * 重命名分支
   * @param branchId 分支ID
   * @param newName 新名字
   */

  renameBranch(branchId: ID, newName: string): void {
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }
    if (this.branchRepository.findByName(newName)) {
      throw new Error(`Branch with name ${newName} already exists.`)
    }
    branch.setName(newName)
    this.branchRepository.update(branch)
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
