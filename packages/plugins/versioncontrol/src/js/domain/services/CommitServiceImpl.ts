import type {
  CommitHistoryRequest,
  CommitHistoryResponse,
  DiffResult,
  ID,
  PageSchema,
  Snapshot,
  Timestamp,
  User
} from '../../shared/type'
import { Memoize } from '../../shared/utils'
import { Commit } from '../models/Commit'
import type { BranchRepository } from './BranchServiceImpl'
import type { CommitService } from './CommitService'

/**
 * Repository 接口定义 - 用于数据持久化
 */
export interface CommitRepository {
  save(commit: Commit): void
  findById(id: ID): Commit | null
  findByBranchId(branchId: ID, limit?: number, offset?: number): Commit[]
  findByTag(tag: string): Commit[]
  update(commit: Commit): void
  delete(id: ID): void
}

/**
 * CommitService 实现类
 */
export class CommitServiceImpl implements CommitService {
  private readonly commitRepository: CommitRepository
  private readonly branchRepository: BranchRepository
  private readonly idGenerator: () => ID
  private readonly signatureVerifier: (commit: Commit) => boolean

  constructor(
    commitRepository: CommitRepository,
    branchRepository: BranchRepository,
    idGenerator: () => ID = () => `commit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    signatureVerifier: (commit: Commit) => boolean = () => true
  ) {
    this.commitRepository = commitRepository
    this.branchRepository = branchRepository
    this.idGenerator = idGenerator
    this.signatureVerifier = signatureVerifier
  }

  /**
   * 创建提交
   */
  createCommit(branchId: ID, message: string, author: User, schema: PageSchema): Commit {
    // 验证输入参数
    this.validateCreateCommitInput(branchId, message, author, schema)

    // 获取分支信息
    const branch = this.branchRepository.findById(branchId)
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found`)
    }

    // 计算统计信息 (简化处理，实际可能需要深度比较 Schema)
    const stats = { totalAdditions: 1, totalDeletions: 0, changedFiles: 1 } // 假设每次 Schema 提交都算作一次变更

    // 获取父提交
    const parentCommits = branch.headCommitId ? [branch.headCommitId] : []

    // 创建提交对象
    const commit = new Commit(
      this.idGenerator(),
      message,
      author,
      author, // 默认提交者与作者相同
      Date.now(),
      parentCommits,
      branchId,
      schema, // 传入 PageSchema
      [], // 初始无标签
      false, // 初始未验证
      stats
    )

    // 保存提交
    this.commitRepository.save(commit)

    // 更新头指针
    branch.setHeadCommitId(commit.id)
    this.branchRepository.update(branch)

    return commit
  }

  /**
   * 获取提交
   * @param commitId
   * @returns
   */
  @Memoize({ ttl: 60000, maxSize: 20 })
  getCommit(commitId: ID): Commit | null {
    return this.commitRepository.findById(commitId)
  }

  /**
   * 获取提交
   * @param branchId
   * @param options
   * @returns
   */
  @Memoize({ ttl: 60000, maxSize: 20 })
  getCommitsByBranch(
    branchId: ID,
    options?: {
      limit?: number
      offset?: number
    }
  ): Commit[] {
    const { limit = 50, offset = 0 } = options || {}
    return this.commitRepository.findByBranchId(branchId, limit, offset)
  }

  /**
   * 获取提交差异
   * @param commitIdA
   * @param commitIdB
   * @returns
   */
  getCommitDiff(commitIdA: ID, commitIdB: ID): DiffResult {
    const commitA = this.getCommit(commitIdA)
    const commitB = this.getCommit(commitIdB)

    if (!commitA || !commitB) {
      throw new Error('One or both commits not found')
    }

    // 实际的 Schema 差异计算会非常复杂，这里仅作简化表示
    // 可以使用第三方库如 `deep-diff` 或自定义算法来比较两个 PageSchema 的差异
    const diff = {
      // 示例：这里可以放具体的差异内容，例如新增/修改/删除的节点、属性变更等
      // For a real implementation, you'd compare commitA.schema and commitB.schema
      message: `Diff between ${commitIdA} and ${commitIdB}`,
      schemaA: commitA.schema,
      schemaB: commitB.schema
    }

    return { diff }
  }

  /**
   * 生成快照 (即获取该提交的 PageSchema)
   * @param commitId
   * @returns
   */
  generateSnapshot(commitId: ID): Snapshot {
    const commit = this.getCommit(commitId)
    if (!commit) {
      throw new Error(`Commit with id ${commitId} not found`)
    }

    return {
      id: `snapshot_${commitId}_${Date.now()}`,
      commitId,
      schema: commit.schema
    }
  }

  /**
   * 验证提交签名
   * @param commitId
   * @returns
   */
  verifyCommit(commitId: ID): boolean {
    const commit = this.getCommit(commitId)
    if (!commit) {
      throw new Error(`Commit with id ${commitId} not found`)
    }

    const isVerified = this.signatureVerifier(commit)

    // 更新验证状态
    // 更新验证状态
    // 注意：Commit 对象通常是不可变的，这里为了演示 setter，实际可能通过 Repository 更新
    commit.setVerified(isVerified)
    this.commitRepository.update(commit)

    return isVerified
  }

  /**
   * 回滚分支到指定提交
   * @param branchId
   * @param commitId
   */
  rollbackBranchToCommit(branchId: ID, commitId: ID): void {
    const branch = this.branchRepository.findById(branchId)
    const targetCommit = this.getCommit(commitId)

    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found`)
    }

    if (!targetCommit) {
      throw new Error(`Commit with id ${commitId} not found`)
    }

    // 验证目标提交属于该分支
    // 验证目标提交属于该分支
    // 注意：在低代码场景下，一个 commit 可能不严格属于某个分支，而是通过分支引用
    // 这里简化为直接检查 branchId，实际可能需要更复杂的历史追溯
    if (targetCommit.branchId !== branchId) {
      throw new Error(`Commit ${commitId} does not belong to branch ${branchId}`)
    }

    // 执行回滚
    branch.setHeadCommitId(commitId)
    branch.setStatus('active')
    this.branchRepository.update(branch)
  }

  /**
   * 为提交添加标签
   * @param commitId
   * @param tag
   */
  addTagToCommit(commitId: ID, tag: string): void {
    const commit = this.getCommit(commitId)
    if (!commit) {
      throw new Error(`Commit with id ${commitId} not found`)
    }

    commit.addTag(tag)
    this.commitRepository.update(commit)
  }

  /**
   * 根据标签获取提交
   * @param tag
   * @returns
   */
  getCommitByTag(tag: string): Commit[] {
    return this.commitRepository.findByTag(tag)
  }

  /**
   * 获取提交历史
   * @param request
   * @returns
   */
  getCommitHistory(request: CommitHistoryRequest): CommitHistoryResponse {
    try {
      const { branchId, page = 1, pageSize = 20, authorId, since, until, searchKeyword } = request

      // 获取基础提交列表
      let commits = this.getCommitsByBranch(branchId)

      // 应用过滤器
      commits = this.applyFilters(commits, { authorId, since, until, searchKeyword })

      // 分页处理
      const totalCount = commits.length
      const startIndex = (page - 1) * pageSize
      const paginatedCommits = commits.slice(startIndex, startIndex + pageSize)

      return {
        success: true,
        commits: paginatedCommits,
        totalCount,
        page,
        pageSize
      }
    } catch (error) {
      return {
        success: false,
        commits: [],
        totalCount: 0,
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // 私有辅助方法

  /**
   * 验证创建提交的输入参数
   */
  private validateCreateCommitInput(branchId: ID, message: string, author: User, schema: PageSchema): void {
    if (!branchId) throw new Error('Branch ID is required')
    if (!message || message.trim().length === 0) throw new Error('Message is required')
    if (!author) throw new Error('Author is required')
    if (!schema) throw new Error('Changes is required')
  }

  /**
   * 应用过滤器
   */
  private applyFilters(
    commits: Commit[],
    filters: {
      authorId?: ID
      since?: Timestamp
      until?: Timestamp
      searchKeyword?: string
    }
  ): Commit[] {
    return commits.filter((commit) => {
      // 作者过滤
      if (filters.authorId && filters.authorId !== commit.author.id) {
        return false
      }

      // 时间范围过滤
      if (filters.since && commit.timestamp < filters.since) {
        return false
      }
      if (filters.until && commit.timestamp > filters.until) {
        return false
      }

      // 关键词搜索
      if (filters.searchKeyword) {
        const keyword = filters.searchKeyword.toLowerCase()
        const messageMatch = commit.message.toLowerCase().includes(keyword)
        // const schemaMatch = JSON.stringify(commit.schema).toLowerCase().includes(keyword); // 如果需要搜索 Schema 内容
        if (!messageMatch /* && !schemaMatch */) {
          return false
        }
      }

      return true
    })
  }
}
