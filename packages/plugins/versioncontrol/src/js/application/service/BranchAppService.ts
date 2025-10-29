import { Branch } from '../../domain/models/Branch'
import type { BranchService } from '../../domain/services/BranchService'
import type { BranchRepository } from '../../infrastructure/repositories/BranchRepository'
import type { CommitRepository } from '../../infrastructure/repositories/CommitRepository'
import type {
  BranchOperationHistory,
  BranchOperationHistoryResponse,
  BranchProtectionRule,
  BranchStatusResponse,
  CommitHistoryRequest,
  CommitHistoryResponse,
  ConflictReport,
  ID,
  MergeStrategy,
  User
} from '../../shared/type'
import { Memoize } from '../../shared/utils'
import { Validator } from '../../shared/validation'
import type { CommitAppService } from './CommitAppService'

export interface BranchAppService {
  /**
   * 创建分支用例
   * @param name 分支名称
   * @param upstreamBranchId 上游分支ID
   * @param creator 创建者
   * @param commitId 可选，指定从哪个提交点创建分支
   * @param description 分支描述
   * @returns 新创建的分支对象
   */
  createBranch(name: string, upstreamBranchId: ID, creator: User, commitId?: ID, description?: string): Promise<Branch>

  /**
   * 销毁分支用例
   * @param branchId 要销毁的分支ID
   * @param force 是否强制销毁
   */
  destroyBranch(branchId: ID, force?: boolean): Promise<void>

  /**
   * 合并分支用例
   * @param sourceBranchId 源分支ID
   * @param targetBranchId 目标分支ID
   * @param strategy 合并策略
   * @param commitMessage 合并提交信息
   * @returns 合并结果，包含新提交ID和冲突报告
   */
  mergeBranch(
    sourceBranchId: ID,
    targetBranchId: ID,
    strategy?: MergeStrategy,
    commitMessage?: string
  ): Promise<{ newCommitId?: ID; conflictedReports?: ConflictReport[] }>

  /**
   * 更新分支用例 (从上游拉取最新更改)
   * @param branchId 子分支ID
   * @param upstreamBranchId 母分支ID
   * @returns 更新结果，包含新提交ID和冲突报告
   */
  updateBranch(branchId: ID, upstreamBranchId: ID): Promise<{ newCommitId?: ID; conflictedReports?: ConflictReport[] }>

  /**
   * 获取分支状态用例
   * @param branchId 分支ID
   * @returns 分支状态响应对象
   */
  getBranchStatus(branchId: ID): Promise<BranchStatusResponse>

  /**
   * 获取分支操作历史用例
   * @param branchId 分支ID
   * @returns 分支操作历史响应对象
   */
  getBranchOperationHistory(branchId: ID): Promise<BranchOperationHistoryResponse>

  /**
   * 获取分支提交历史用例
   * @param request 提交历史查询请求
   * @returns 提交历史响应对象
   */
  getBranchCommitHistory(request: CommitHistoryRequest): Promise<CommitHistoryResponse>

  /**
   * 获取单个分支详情用例
   * @param branchId 分支ID
   * @returns 分支对象或 null
   */
  getBranch(branchId: ID): Promise<Branch | null>

  /**
   * 获取所有分支用例
   * @returns 所有分支的数组
   */
  getAllBranches(): Promise<Branch[]>

  /**
   * 保护分支用例
   * @param branchId 分支ID
   * @param protectionRule 保护规则
   */
  protectBranch(branchId: ID, protectionRule: BranchProtectionRule): Promise<void>

  /**
   * 解除分支保护用例
   * @param branchId 分支ID
   */
  unprotectBranch(branchId: ID): Promise<void>

  /**
   * 归档分支用例
   * @param branchId 分支ID
   */
  archiveBranch(branchId: ID): Promise<void>

  /**
   * 解除归档分支用例
   * @param branchId 分支ID
   */
  unarchiveBranch(branchId: ID): Promise<void>

  /**
   * 恢复已删除分支用例
   * @param branchId 分支ID
   */
  restoreBranch(branchId: ID): Promise<void>

  /**
   * 重命名分支用例
   * @param branchId 分支ID
   * @param newName 新名称
   */
  renameBranch(branchId: ID, newName: string): Promise<void>
}

/**
 * BranchAppService 实现类
 * 负责协调 BranchService 和 CommitService，处理应用层逻辑。
 */
export class BranchAppServiceImpl implements BranchAppService {
  private readonly branchService: BranchService
  private readonly commitAppService: CommitAppService
  private readonly commitRepository: CommitRepository
  private readonly branchRepository: BranchRepository

  constructor(
    branchService: BranchService,
    commitAppService: CommitAppService,
    commitRepository: CommitRepository,
    branchRepository: BranchRepository
  ) {
    this.branchService = branchService
    this.commitAppService = commitAppService
    this.commitRepository = commitRepository
    this.branchRepository = branchRepository
  }

  /**
   * 创建分支
   */
  async createBranch(
    name: string,
    upstreamBranchId: ID,
    creator: User,
    commitId?: ID,
    description?: string
  ): Promise<Branch> {
    // 参数是否为空校验
    Validator.batchRequired([
      [name, 'Branch Name'],
      [upstreamBranchId, 'Upstream branch ID'],
      [creator, 'Creator information'],
      [creator?.id, 'Creator ID']
    ])

    if (await this.branchRepository.findByName(name)) {
      throw new Error(`Branch with name ${name} already exists.`)
    }

    const upstreamBranch = await this.branchRepository.findById(upstreamBranchId)
    if (!upstreamBranch) {
      throw new Error(`Upstream branch with id ${upstreamBranchId} not found.`)
    }

    const baseCommit = commitId
      ? await this.commitAppService.getCommit(commitId)
      : await this.commitAppService.getCommit(upstreamBranch.headCommitId)

    // 事务开始
    const newBranch = this.branchService.createBranch(name, upstreamBranchId, creator, baseCommit!.id, description)

    await this.branchRepository.save(newBranch)

    const updateBranchInstance = Branch.formData(upstreamBranch)
    updateBranchInstance!.addDownstreamBranch(newBranch.id)
    await this.branchRepository.update(updateBranchInstance)

    // 记录分支操作历史
    // this.recordBranchOperation(newBranch.id, creator, 'create', { name, upstreamBranchId, commitId });

    return newBranch
  }

  /**
   * 销毁分支
   */
  async destroyBranch(branchId: ID, force?: boolean): Promise<void> {
    // 参数是否为空的判断
    Validator.check(branchId, 'Branch ID').required().run()

    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    // 移除上游分支的下游引用
    if (branch.upstreamBranchId) {
      const upstreamBranch = await this.branchRepository.findById(branch.upstreamBranchId)
      if (upstreamBranch) {
        upstreamBranch.removeDownstreamBranch(branch.id)
        await this.branchRepository.update(upstreamBranch)
      }
    }

    // 调用 BranchServiceImpl 的方法
    this.branchService.destroyBranch(branch, force)

    // 更新状态
    await this.branchRepository.update(branch)
  }

  /**
   * 合并分支
   */
  async mergeBranch(
    sourceBranchId: ID,
    targetBranchId: ID,
    strategy?: MergeStrategy,
    commitMessage?: string
  ): Promise<{ newCommitId?: ID; conflictedReports?: ConflictReport[] }> {
    // 参数是否为空校验，为空则抛出错误
    Validator.batchRequired([
      [sourceBranchId, 'Source Branch ID'],
      [targetBranchId, 'Target Branch ID']
    ])

    // 获取源分支和目标分支
    const sourceBranch = await this.branchRepository.findById(sourceBranchId)
    const targetBranch = await this.branchRepository.findById(targetBranchId)

    if (!sourceBranch || !targetBranch) {
      throw new Error('Source or target branch not found.')
    }

    // 获取源分支和目标分支的最新 Commit
    const sourceHeadCommit = await this.commitAppService.getCommit(sourceBranch.headCommitId)
    const targetHeadCommit = await this.commitAppService.getCommit(targetBranch.headCommitId)

    if (!sourceHeadCommit || !targetHeadCommit) {
      throw new Error('Source or target branch head commit not found.')
    }

    const result = this.branchService.mergeBranch(
      sourceBranch,
      sourceHeadCommit,
      sourceBranchId,
      targetBranch,
      targetHeadCommit,
      targetBranchId,
      strategy,
      commitMessage
    )

    if (!result?.isConflicted) {
      // 创建新的合并提交
      const newCommit = await this.commitAppService.createCommit(
        targetBranch.id,
        commitMessage || `Merge branch '${sourceBranch.name}' into '${targetBranch.name}'`,
        sourceBranch.creator, // 合并操作的作者
        result.mergedSchema!, // 使用合并后的 Schema
        'feature'
      )

      targetBranch.setHeadCommitId(newCommit.id) // 更新头提交
      return { newCommitId: newCommit.id }
    }

    await this.branchRepository.update(targetBranch)
    return result
  }

  /**
   * 更新分支（从母分支拉取最新更改到子分支）
   */
  async updateBranch(
    branchId: ID,
    upstreamBranchId: ID
  ): Promise<{ newCommitId?: ID; conflictedReports?: ConflictReport[] }> {
    // 参数是否为空校验，为空则抛出错误
    Validator.batchRequired([
      [branchId, 'Branch ID'],
      [upstreamBranchId, 'Upstream Branch ID']
    ])

    const branch = await this.branchRepository.findById(branchId)
    const upstreamBranch = await this.branchRepository.findById(upstreamBranchId)

    if (!branch || !upstreamBranch) {
      throw new Error('Branch or upstream branch not found.')
    }

    // 实际上是执行一次从 upstreamBranch 到 branch 的合并
    const result = await this.mergeBranch(
      upstreamBranchId,
      branchId,
      'three-way',
      `Merge ${upstreamBranch.name} into ${branch.name} (pull)`
    )

    return result
  }

  async getBranchStatus(branchId: ID): Promise<BranchStatusResponse> {
    // 参数是否为空校验，为空则抛出错误
    Validator.check(branchId, 'Branch ID').required().run()

    let commitsAhead = 0
    let commitsBehind = 0

    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    if (branch.upstreamBranchId) {
      const upstreamBranch = await this.branchRepository.findById(branch.upstreamBranchId)
      if (upstreamBranch) {
        // 实际计算需要遍历提交历史，这里简化处理
        // commitsAhead = this.calculateCommitsAhead(branch.headCommitId, upstreamBranch.headCommitId);
        // commitsBehind = this.calculateCommitsBehind(branch.headCommitId, upstreamBranch.headCommitId);
        commitsAhead = branch.commitsAhead // 假设 Branch 实例已维护此数据
        commitsBehind = branch.commitsBehind // 假设 Branch 实例已维护此数据
      }
    }

    // 获取最新（最后）提交
    const lastCommit = await this.commitRepository.findById(branch.headCommitId)
    if (!lastCommit) {
      throw new Error(`Commit with id ${lastCommit} not found.`)
    }

    return this.branchService.getBranchStatus(branch, lastCommit, commitsAhead, commitsBehind)
  }

  /**
   * 获取分支操作历史 （待完善）
   */
  @Memoize({ ttl: 60000 })
  async getBranchOperationHistory(branchId: ID): Promise<BranchOperationHistoryResponse> {
    // 实际应从持久化层获取操作历史
    const history: BranchOperationHistory[] = [] // 假设从数据库获取
    // 示例数据
    history.push({
      operationId: 'op1',
      branchId,
      operator: {
        id: 'u1',
        username: 'test',
        email: 't@t.com'
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
   * 获取分支提交历史
   */
  @Memoize({ ttl: 60000 })
  async getBranchCommitHistory(request: CommitHistoryRequest): Promise<CommitHistoryResponse> {
    return await this.commitAppService.getCommitHistory(request)
  }

  /**
   * 获取单个分支详情
   */
  @Memoize({ ttl: 60000 })
  async getBranch(branchId: ID): Promise<Branch | null> {
    return this.branchRepository.findById(branchId)
  }

  /**
   * 获取所有分支
   */
  @Memoize({ ttl: 60000 })
  async getAllBranches(): Promise<Branch[]> {
    return this.branchRepository.findAll()
  }

  /**
   * 保护分支
   */
  async protectBranch(branchId: ID, protectionRule: BranchProtectionRule): Promise<void> {
    // 参数是否为空校验，为空则抛出错误
    Validator.batchRequired([
      [branchId, 'Branch ID'],
      [protectionRule, 'Protection Rule']
    ])

    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    this.branchService.protectBranch(branch, protectionRule)
    await this.branchRepository.update(branch)
  }

  /**
   * 解除分支保护
   */
  async unprotectBranch(branchId: ID): Promise<void> {
    // 参数是否为空校验，为空则抛出错误
    Validator.check(branchId, 'Branch ID').required().run()

    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    await this.branchService.unprotectBranch(branch)
    await this.branchRepository.update(branch)
  }

  /**
   * 归档分支
   */
  async archiveBranch(branchId: ID): Promise<void> {
    // 参数是否为空校验，为空则抛出错误
    Validator.check(branchId, 'Branch ID').required().run()

    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    await this.branchService.archiveBranch(branch)
    await this.branchRepository.update(branch)
  }

  /**
   * 解除归档分支
   */
  async unarchiveBranch(branchId: ID): Promise<void> {
    // 参数是否为空校验，为空则抛出错误
    Validator.check(branchId, 'Branch ID').required().run()

    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    await this.branchService.unarchiveBranch(branch)
    await this.branchRepository.update(branch)
  }

  /**
   * 恢复已删除的分支
   */
  async restoreBranch(branchId: ID): Promise<void> {
    // 参数是否为空校验，为空则抛出错误
    Validator.check(branchId, 'Branch ID').required().run()

    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    this.branchService.restoreBranch(branch)
    await this.branchRepository.update(branch)
  }

  /**
   * 重命名分支
   */
  async renameBranch(branchId: ID, newName: string): Promise<void> {
    // 参数是否为空校验，为空则抛出错误
    Validator.batchRequired([
      [branchId, 'Branch ID'],
      [newName, 'New Name']
    ])

    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found.`)
    }

    if (await this.branchRepository.findByName(newName)) {
      throw new Error(`Branch with name ${newName} already exists.`)
    }

    this.branchService.renameBranch(branch, newName)
    await this.branchRepository.update(branch)
  }
}
