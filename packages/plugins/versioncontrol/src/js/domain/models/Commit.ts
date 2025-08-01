import type { Commit as CommitType, CommitStats, ID, PageSchema, Timestamp, User } from '../../shared/type'

/**
 * Commit 领域模型
 * 代表版本控制系统中的一次提交，其核心内容为 PageSchema
 */
export class Commit {
  readonly id: ID
  private _message: string
  readonly author: User
  readonly committer: User
  readonly timestamp: Timestamp
  readonly parentCommits: readonly ID[] // 父提交ID列表，支持多个父提交（合并提交）
  readonly branchId: ID
  private _schema: PageSchema // 提交所承载的 Schema 页面结构
  private _tags: readonly string[]
  private _verified: boolean
  private _stats: CommitStats

  constructor(
    id: ID,
    message: string,
    author: User,
    committer: User,
    timestamp: Timestamp,
    parentCommits: readonly ID[],
    branchId: ID,
    schema: PageSchema,
    tags: readonly string[],
    verified: boolean,
    stats: CommitStats
  ) {
    this.id = id
    this._message = message
    this.author = author
    this.committer = committer
    this.timestamp = timestamp
    this.parentCommits = parentCommits
    this.branchId = branchId
    this._schema = schema
    this._tags = tags
    this._verified = verified
    this._stats = stats
  }

  // Getters
  get message(): string {
    return this._message
  }

  get schema(): PageSchema {
    return this._schema
  }

  get tags(): readonly string[] {
    return this._tags
  }

  get verified(): boolean {
    return this._verified
  }

  get stats(): CommitStats {
    return this._stats
  }

  // Setters
  setMessage(message: string): this {
    this._message = message
    return this
  }

  addTag(tag: string): this {
    if (!this._tags.includes(tag)) {
      this._tags = [...this._tags, tag]
    }
    return this
  }

  removeTag(tag: string): this {
    this._tags = this._tags.filter((t) => t !== tag)
    return this
  }

  setVerified(verified: boolean): this {
    this._verified = verified
    return this
  }

  /**
   * 检查提交是否是合并提交
   */
  isMergeCommit(): boolean {
    return this.parentCommits.length > 1
  }

  /**
   * 获取提交简短的Id
   */
  getShortId(): string {
    return this.id.substring(0, 7)
  }

  /**
   * 将 Commit 对象转换为纯粹的数据接口，用于数据传输或持久化
   */
  toData(): {
    id: ID
    message: string
    author: User
    committer: User
    timestamp: Timestamp
    parentCommits: readonly ID[]
    branchId: ID
    schema: PageSchema
    tags: readonly string[]
    verified: boolean
    stats: CommitStats
  } {
    return {
      id: this.id,
      message: this._message,
      author: this.author,
      committer: this.committer,
      timestamp: this.timestamp,
      parentCommits: this.parentCommits,
      branchId: this.branchId,
      schema: this._schema,
      tags: this._tags,
      verified: this._verified,
      stats: this._stats
    }
  }

  /**
   * 从纯粹的数据接口创建 Commit 实例
   */
  static fromData(data: {
    id: ID
    message: string
    author: User
    committer: User
    timestamp: Timestamp
    parentCommits: readonly ID[]
    branchId: ID
    schema: PageSchema
    tags: readonly string[]
    verified: boolean
    stats: CommitStats
  }): CommitType {
    return new Commit(
      data.id,
      data.message,
      data.author,
      data.committer,
      data.timestamp,
      data.parentCommits,
      data.branchId,
      data.schema,
      data.tags,
      data.verified,
      data.stats
    )
  }
}
