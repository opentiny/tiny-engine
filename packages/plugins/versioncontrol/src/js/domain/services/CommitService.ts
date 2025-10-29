import type {
  CommitHistoryRequest,
  CommitHistoryResponse,
  CommitStats,
  DiffResult,
  ID,
  PageSchema,
  Snapshot,
  Timestamp,
  User
} from '../../shared/type'
import { sha1 } from '../../shared/utils'
import type { Branch } from '../models/Branch'
import { Commit } from '../models/Commit'
import { SchemaDiffResolver } from '../strategies/SchemaDiffResolver'

/**
 * CommitService 接口定义
 * 专注于 Commit 相关的操作
 */
export interface CommitService {
  /**
   * 创建一个新的提交
   * @param branchId 提交所属的分支id
   * @param parentCommits 父提交id
   * @param message 提交信息
   * @param author 提交作者
   * @param schema 本次提交的 PageSchema
   * @param stats 提交状态
   * @returns 新创建的Commit对象
   */
  createCommit(
    branchId: ID,
    parentCommits: ID[],
    message: string,
    author: User,
    schema: PageSchema,
    stats: CommitStats,
    type: string
  ): Promise<Commit>

  /**
   * 获取两个提交之间的差异
   * @param commitA 第一个提交
   * @param commitB 第二个提交
   * @returns 差异结果
   */
  getCommitDiff(commitA: Commit, commitB: Commit): DiffResult

  /**
   * 根据提交生成快照 (即获取该提交的 PageSchema)
   * @param commit 提交
   * @param commitId 提交ID
   * @returns 快照对象，包含 PageSchema
   */
  generateSnapshot(commit: Commit, commitId: ID): Snapshot

  /**
   * 验证提交的签名
   * @param commit 提交
   * @returns 是否验证成功
   */
  verifyCommit(commit: Commit): boolean

  /**
   * 将分支回滚到指定提交
   * @param branch 分支
   * @param branchId 分支ID
   * @param targetCommitId 目标提交ID
   * @param targetCommit 目标提交
   */
  rollbackBranchToCommit(branch: Branch, branchId: ID, targetCommitId: ID, targetCommit: Commit): void

  /**
   * 获取提交历史，支持更复杂的查询条件
   * @param request 提交历史查询请求过滤数据
   * @param commits 历史查询对象
   * @returns 提交历史响应对象
   */
  getCommitHistory(request: CommitHistoryRequest, commits: Commit[]): CommitHistoryResponse
}

/**
 * CommitService 实现类
 */
export class CommitServiceImpl implements CommitService {
  private readonly schemaDiffResolver: SchemaDiffResolver
  private readonly idGenerator: () => ID
  private readonly signatureVerifier: (commit: Commit) => boolean

  constructor(
    idGenerator: () => ID = () => `commit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    signatureVerifier: (commit: Commit) => boolean = () => true
  ) {
    this.schemaDiffResolver = SchemaDiffResolver.getInstance()
    this.idGenerator = idGenerator
    this.signatureVerifier = signatureVerifier
  }

  /**
   * 创建提交
   */
  async createCommit(
    branchId: ID,
    parentCommits: ID[],
    message: string,
    author: User,
    schema: PageSchema,
    stats: CommitStats,
    type: string
  ): Promise<Commit> {
    // 创建提交对象
    const commit = new Commit(
      this.idGenerator(), // id
      await sha1(Date.now()), // hash
      message, // message
      author, // author
      author, // committer（默认同作者）
      Date.now(), // timestamp
      parentCommits, // parentCommits
      branchId, // branchId
      schema, // schema
      [], // tags
      false, // verified
      stats, // stats
      type // type
    )

    return commit
  }

  /**
   * 获取提交差异
   * @param commitIdA
   * @param commitIdB
   * @returns
   */
  getCommitDiff(commitA: Commit, commitB: Commit): DiffResult {
    const delta = this.schemaDiffResolver.calculateDiff(commitA.schema, commitB.schema)

    return { diff: delta }
  }

  /**
   * 生成快照 (即获取该提交的 PageSchema)
   * @param commitId
   * @returns
   */
  generateSnapshot(commit: Commit, commitId: ID): Snapshot {
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
  verifyCommit(commit: Commit): boolean {
    const isVerified = this.signatureVerifier(commit)
    commit.setVerified(isVerified)

    return isVerified
  }

  /**
   * 回滚分支到指定提交
   * @param branch
   * @param branchId
   * @param targetCommitId
   * @param targetCommit
   */
  rollbackBranchToCommit(branch: Branch, branchId: ID, targetCommitId: ID, targetCommit: Commit): void {
    // 验证目标提交属于该分支
    if (targetCommit.branchId !== branchId) {
      throw new Error(`Commit ${targetCommitId} does not belong to branch ${branchId}`)
    }

    // 执行回滚
    branch.setHeadCommitId(targetCommitId)
    branch.setStatus('active')
  }

  /**
   * 获取提交历史
   */
  getCommitHistory(request: CommitHistoryRequest, commits: Commit[]): CommitHistoryResponse {
    try {
      const { page = 1, pageSize = 20, authorId, since, until, searchKeyword } = request

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
