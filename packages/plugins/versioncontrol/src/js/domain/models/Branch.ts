import type { BranchProtectionRule, BranchStatus, BranchType, ID, Timestamp, User } from '../../shared/type'

/**
 * Branch 领域模型
 * 代表版本控制系统中的一个分支
 */
export class Branch {
  readonly id: ID
  private _name: string
  readonly type: BranchType
  private _status: BranchStatus
  private _description?: string
  private _upstreamBranchId?: ID // 上游分支ID（主分支为 undefined）
  private _downstreamBranchIds: ID[] // 下游分支ID列表
  private _headCommitId: ID // 当前分支的最新提交
  readonly baseCommitId: ID // 分支创建时的基础提交
  readonly creator: User
  readonly createdAt: Timestamp //形如 1753761048052
  private _updatedAt: Timestamp //形如 1753761048052
  private _lastCommitAt?: Timestamp
  private _commitsCount: number
  private _commitsAhead: number // 领先上游分支的提交数
  private _commitsBehind: number // 落后上游分支的提交数
  private _protection?: BranchProtectionRule
  private _metadata: Record<string, unknown> // 扩展元数据

  constructor(
    id: ID,
    name: string,
    type: BranchType,
    status: BranchStatus,
    headCommitId: ID,
    baseCommitId: ID,
    creator: User,
    createdAt: Timestamp,
    updatedAt: Timestamp,
    options?: {
      description?: string
      upstreamBranchId?: ID
      downstreamBranchIds?: ID[]
      lastCommitAt?: Timestamp
      commitsCount?: number
      commitsAhead?: number
      commitsBehind?: number
      protection?: BranchProtectionRule
      metadata?: Record<string, unknown>
    }
  ) {
    this.id = id
    this._name = name
    this.type = type
    this._status = status
    this._headCommitId = headCommitId
    this.baseCommitId = baseCommitId
    this.creator = creator
    this.createdAt = createdAt
    this._updatedAt = updatedAt

    this._description = options?.description
    this._upstreamBranchId = options?.upstreamBranchId
    this._downstreamBranchIds = options?.downstreamBranchIds ?? []
    this._lastCommitAt = options?.lastCommitAt
    this._commitsCount = options?.commitsCount ?? 0
    this._commitsAhead = options?.commitsAhead ?? 0
    this._commitsBehind = options?.commitsBehind ?? 0
    this._metadata = options?.metadata ?? {}
    this._protection = options?.protection
  }

  // Getters
  get name(): string {
    return this._name
  }

  get status(): BranchStatus {
    return this._status
  }

  get description(): string | undefined {
    return this._description
  }

  get upstreamBranchId(): ID | undefined {
    return this._upstreamBranchId
  }

  get downstreamBranchIds(): ID[] {
    return this._downstreamBranchIds
  }

  get headCommitId(): ID {
    return this._headCommitId
  }

  get updatedAt(): Timestamp {
    return this._updatedAt
  }

  get lastCommitAt(): Timestamp | undefined {
    return this._lastCommitAt
  }

  get commitsCount(): number {
    return this._commitsCount
  }

  get commitsAhead(): number {
    return this._commitsAhead
  }

  get commitsBehind(): number {
    return this._commitsBehind
  }

  get protection(): BranchProtectionRule | undefined {
    return this._protection
  }

  get metadata(): Record<string, unknown> {
    return this._metadata
  }

  // Setters
  setName(name: string): this {
    this._name = name
    this._updatedAt = Date.now()
    // 支持方法链的调用
    return this
  }

  setStatus(status: BranchStatus): this {
    this._status = status
    this._updatedAt = Date.now()
    return this
  }

  setDescription(description: string): this {
    this._description = description
    this._updatedAt = Date.now()
    return this
  }

  setUpstreamBranchId(upstreamBranchId: ID): this {
    this._upstreamBranchId = upstreamBranchId
    this._updatedAt = Date.now()
    return this
  }

  addDownstreamBranch(branchId: ID): this {
    if (!this._downstreamBranchIds.includes(branchId)) {
      this._downstreamBranchIds.push(branchId)
      this._updatedAt = Date.now()
    }
    return this
  }

  removeDownstreamBranch(branchId: ID): this {
    const index = this._downstreamBranchIds.indexOf(branchId)
    if (index > -1) {
      this._downstreamBranchIds.splice(index, 1)
      this._updatedAt = Date.now()
    }
    return this
  }

  setHeadCommitId(commitId: ID): this {
    this._headCommitId = commitId
    this._lastCommitAt = Date.now()
    this._commitsCount++
    this._updatedAt = Date.now()
    return this
  }

  updatedCommitStatus(ahead: number, behind: number): this {
    this._commitsAhead = ahead
    this._commitsBehind = behind
    this._updatedAt = Date.now()
    return this
  }

  setProtection(protection: BranchProtectionRule): void {
    this._protection = protection
    this._updatedAt = Date.now()
  }

  removeProtection(): void {
    this._protection = undefined
    this._updatedAt = Date.now()
  }

  updateMetadata(key: string, value: unknown): this {
    this._metadata[key] = value
    this._updatedAt = Date.now()
    return this
  }

  // 分支操作

  /**
   * 标志分支为已合并
   */
  markAsMerged(): void {
    this.setStatus('merged')
  }

  /**
   * 标记分支为冲突状态
   */
  markAsConflicted(): void {
    this.setStatus('conflicted')
  }

  /**
   * 标记为活跃状态
   */
  markAsActive(): void {
    this.setStatus('active')
  }

  /**
   * 检查分支是否受保护
   */
  isProtected(): boolean {
    return !!this._protection
  }

  /**
   * 检查分支是否有待提交变更
   */
  hasPendingChanges(): boolean {
    return this._status === 'pending_changes'
  }

  /**
   * 将分支转换为纯粹的数据接口，用于前后端的数据传输
   */
  toData(): {
    id: ID
    name: string
    type: BranchType
    status: BranchStatus
    description?: string
    upstreamBranchId?: ID
    downstreamBranchIds: ID[]
    headCommitId: ID
    baseCommitId: ID
    creator: User
    createdAt: Timestamp
    updatedAt: Timestamp
    lastCommitAt?: Timestamp
    commitsCount: number
    commitsAhead: number
    commitsBehind: number
    // protection?: BranchProtectionRule;
    metadata: Record<string, unknown>
  } {
    return {
      id: this.id,
      name: this._name,
      type: this.type,
      status: this._status,
      description: this._description,
      upstreamBranchId: this._upstreamBranchId,
      downstreamBranchIds: this._downstreamBranchIds,
      headCommitId: this._headCommitId,
      baseCommitId: this.baseCommitId,
      creator: this.creator,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      lastCommitAt: this._lastCommitAt,
      commitsCount: this._commitsCount,
      commitsAhead: this._commitsAhead,
      commitsBehind: this._commitsBehind,
      // protection: this._protection,
      metadata: this._metadata
    }
  }

  /**
   * 从纯粹的数据接口，创建Branch实例
   */
  static formData(data: {
    id: ID
    name: string
    type: BranchType
    status: BranchStatus
    description?: string
    upstreamBranchId?: ID
    downstreamBranchIds: ID[]
    headCommitId: ID
    baseCommitId: ID
    creator: User
    createdAt: Timestamp
    updatedAt: Timestamp
    lastCommitAt?: Timestamp
    commitsCount: number
    commitsAhead: number
    commitsBehind: number
    // protection?: BranchProtectionRule;
    metadata: Record<string, unknown>
  }): Branch {
    return new Branch(
      data.id,
      data.name,
      data.type,
      data.status,
      data.headCommitId,
      data.baseCommitId,
      data.creator,
      data.createdAt,
      data.updatedAt,
      {
        description: data.description,
        upstreamBranchId: data.upstreamBranchId,
        downstreamBranchIds: data.downstreamBranchIds,
        lastCommitAt: data.lastCommitAt,
        commitsCount: data.commitsCount,
        commitsAhead: data.commitsAhead,
        commitsBehind: data.commitsBehind,
        // protection: data.protection,
        metadata: data.metadata
      }
    )
  }
}
