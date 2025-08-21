import { Branch } from '../../domain/models/Branch'
import { Commit } from '../../domain/models/Commit'
import type { CommitService } from '../../domain/services/CommitService'
import { SchemaStatsCalculator } from '../../domain/strategies/SchemaStatsCalculator'
import type { BranchRepository } from '../../infrastructure/repositories/BranchRepository'
import type { CommitRepository } from '../../infrastructure/repositories/CommitRepository'
import type {
  CommitHistoryRequest,
  CommitHistoryResponse,
  DiffResult,
  ID,
  PageSchema,
  Snapshot,
  User
} from '../../shared/type'
import { Memoize } from '../../shared/utils'
import { Validator } from '../../shared/validation'

/**
 * CommitAppService 接口定义
 * 专注于业务用例流程，协调领域服务调用，并处理参数校验、事务控制和异常处理等应用层职责。
 */
export interface CommitAppService {
  /**
   * 创建提交用例
   * @param branchId 所在分支ID
   * @param message 提交信息
   * @param author 提交者
   * @param schema 提交的 Schema 内容
   * @param type 提交类型
   * @returns 新创建的提交对象
   */
  createCommit(branchId: ID, message: string, author: User, schema: PageSchema, type: string): Promise<Commit>

  /**
   * 获取提交详情用例
   * @param commitId 提交ID
   * @returns 提交对象或 null
   */
  getCommit(commitId: ID): Promise<Commit | null>

  /**
   * 获取分支提交列表用例
   * @param branchId 分支ID
   * @param options 查询选项
   * @returns 提交列表
   */
  getCommitsByBranch(branchId: ID, options?: { limit?: number; offset?: number }): Promise<Commit[]>

  /**
   * 获取两个提交之间的差异用例
   * @param commitIdA 提交A的ID
   * @param commitIdB 提交B的ID
   * @returns 差异结果
   */
  getCommitDiff(commitIdA: ID, commitIdB: ID): Promise<DiffResult>

  /**
   * 生成快照用例
   * @param commitId 提交ID
   * @returns 快照对象
   */
  generateSnapshot(commitId: ID): Promise<Snapshot> // 快照直接返回 PageSchema

  /**
   * 验证提交用例
   * @param commitId 提交ID
   * @returns 是否验证成功
   */
  verifyCommit(commitId: ID): Promise<boolean>

  /**
   * 回滚分支到指定提交用例
   * @param branchId 分支ID
   * @param commitId 目标提交ID
   */
  rollbackBranchToCommit(branchId: ID, commitId: ID): Promise<void>

  /**
   * 为提交添加标签用例
   * @param commitId 提交ID
   * @param tag 标签名称
   */
  addTagToCommit(commitId: ID, tag: string): Promise<void>

  /**
   * 根据标签获取提交用例
   * @param tag 标签名称
   * @returns 提交列表
   */
  getCommitsByTag(tag: string): Promise<Commit[]>

  /**
   * 获取提交历史用例
   * @param request 提交历史查询请求
   * @returns 提交历史响应对象
   */
  getCommitHistory(request: CommitHistoryRequest): Promise<CommitHistoryResponse>
}

/**
 * CommitAppServiceImpl 实现类
 * 负责协调 CommitService，处理应用层逻辑。
 */
export class CommitAppServiceImpl implements CommitAppService {
  private readonly commitService: CommitService
  private readonly branchRepository: BranchRepository
  private readonly commitRepository: CommitRepository
  private readonly schemaStatsCalc: SchemaStatsCalculator

  constructor(commitService: CommitService, branchRepository: BranchRepository, commitRepository: CommitRepository) {
    this.commitService = commitService
    this.branchRepository = branchRepository
    this.commitRepository = commitRepository
    this.schemaStatsCalc = new SchemaStatsCalculator()
  }

  /**
   * 创建提交
   */
  async createCommit(branchId: ID, message: string, author: User, schema: PageSchema, type: string): Promise<Commit> {
    // 参数校验
    Validator.batchRequired([
      [branchId, 'Branch Id'],
      [message, 'Message', 'Commit message cannot be empty.'],
      [author.id, 'Athor Id'],
      [author, 'Author', 'Author information is incomplete'],
      [schema, 'Schema', 'Schema content is required.']
    ])

    // 获取分支信息
    const branch = await this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found`)
    }

    const branchInstance = Branch.formData(branch)
    const baseCommitId = branchInstance.baseCommitId

    // 获取该分支基准commit的schema，用于计算stats计算统计信息
    let stats
    if (baseCommitId) {
      const baseCommit = await this.commitRepository.findById(baseCommitId)
      const oldSchema = Commit.fromData(baseCommit).schema
      const newSchema = JSON.parse(JSON.stringify(schema))

      stats = this.schemaStatsCalc.calculateStats(oldSchema, newSchema)
    } else {
      stats = { totalAdditions: 1, totalDeletions: 0, changedFiles: [] }
    }

    // 获取父提交
    const parentCommits = branchInstance.headCommitId ? [branchInstance.headCommitId] : []

    const newCommit = await this.commitService.createCommit(
      branchId,
      parentCommits,
      message,
      author,
      schema,
      stats,
      type
    )

    // 保存提交
    this.commitRepository.save(newCommit)

    // 更新头指针
    branchInstance.setHeadCommitId(newCommit.id)
    this.branchRepository.update(branchInstance)

    return newCommit
  }

  /**
   * 获取特定提交
   */
  @Memoize({ ttl: 60000, maxSize: 20 })
  async getCommit(commitId: ID): Promise<any | null> {
    //参数校验
    Validator.check(commitId, 'Commit ID').required().run()

    return this.commitRepository.findById(commitId)
  }

  /**
   * 通过分支获取全部提交
   */
  @Memoize({ ttl: 60000, maxSize: 20 })
  async getCommitsByBranch(branchId: ID, options?: { limit?: number; offset?: number }): Promise<Commit[]> {
    // 参数校验
    Validator.check(branchId, 'Branch ID').required().run()

    const { limit = 50, offset = 0 } = options || {}
    return this.commitRepository.findByBranchId(branchId, limit, offset)
  }

  /**
   * 获取两个提交之间的差异
   */
  async getCommitDiff(commitIdA: ID, commitIdB: ID): Promise<DiffResult> {
    // 参数校验
    Validator.batchRequired([
      [commitIdA, 'Commit A', 'Commit A are required for diff.'],
      [commitIdB, 'Commit B', 'Commit B are required for diff.']
    ])

    const commitA = await this.getCommit(commitIdA)
    const commitB = await this.getCommit(commitIdB)

    if (!commitA || !commitB) {
      throw new Error('One or both commits not found')
    }

    const result = this.commitService.getCommitDiff(commitA, commitB)
    return result
  }

  /**
   * 生成快照
   */
  async generateSnapshot(commitId: ID): Promise<Snapshot> {
    //参数校验
    Validator.check(commitId, 'Commit ID').required().run()

    const commit = await this.getCommit(commitId)
    if (!commit) {
      throw new Error(`Commit with id ${commitId} not found`)
    }

    const result = this.commitService.generateSnapshot(commit, commitId)
    return result
  }

  /**
   * 验证提交签名
   */
  async verifyCommit(commitId: ID): Promise<boolean> {
    //参数校验
    Validator.check(commitId, 'Commit ID').required().run()

    const commit = await this.getCommit(commitId)
    if (!commit) {
      throw new Error(`Commit with id ${commitId} not found`)
    }

    const isVerified = this.commitService.verifyCommit(commit)
    await this.commitRepository.update(commit)

    return isVerified
  }

  /**
   * 回滚分支到指定提交
   */
  async rollbackBranchToCommit(branchId: ID, commitId: ID): Promise<void> {
    // 参数校验
    Validator.batchRequired([
      [branchId, 'Branch ID', 'Branch ID are required for rollback.'],
      [commitId, 'Commit ID', 'Commit ID are required for rollback.']
    ])

    const branch = await this.branchRepository.findById(branchId)
    const targetCommit = await this.getCommit(commitId)

    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found`)
    }

    if (!targetCommit) {
      throw new Error(`Commit with id ${commitId} not found`)
    }

    this.commitService.rollbackBranchToCommit(branch, branchId, commitId, targetCommit)
    await this.branchRepository.update(branch)
  }

  /**
   * 为提交添加标签
   */
  async addTagToCommit(commitId: ID, tag: string): Promise<void> {
    // 参数校验
    Validator.batchRequired([
      [tag, 'Tag', 'Tag are required for adding tag.'],
      [commitId, 'Commit ID', 'Commit ID are required for adding tag.']
    ])

    const commit = await this.getCommit(commitId)
    if (!commit) {
      throw new Error(`Commit with id ${commitId} not found`)
    }

    const commitInstance = Commit.fromData(commit)
    commitInstance.addTag(tag)
    await this.commitRepository.update(commitInstance)
  }

  /**
   * 根据标签获取提交用例实现
   */
  async getCommitsByTag(tag: string): Promise<Commit[]> {
    // 参数校验
    Validator.check(tag, 'Tag').required().run()

    return await this.commitRepository.findByTag(tag)
  }

  async getCommitHistory(request: CommitHistoryRequest): Promise<CommitHistoryResponse> {
    // 参数校验
    Validator.check(request.branchId, 'Branch ID').required('Branch ID is required for commit history.').run()

    const { branchId } = request
    const commits = await this.getCommitsByBranch(branchId)

    return this.commitService.getCommitHistory(request, commits)
  }
}
