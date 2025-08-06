import * as jsonDiffPatch from 'jsondiffpatch'
// ==================== 基础类型定义 ====================

/**
 * 通用ID类型
 */
export type ID = string

/**
 * 时间戳类型
 */
export type Timestamp = number

/**
 * 用户信息接口
 */
export interface User {
  readonly id: ID
  readonly username: string
  readonly email: string
  readonly displayName: string
  readonly avatar?: string
  readonly createdAt: Timestamp
  readonly lastActiveAt: Timestamp
}

/**
 * 文件变更类型
 */
type FileChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'moved'

/**
 * 文件变更详情
 */
export interface FileChange {
  readonly path: string
  readonly previousPath?: string // 用于重命名或移动操作
  readonly type: FileChangeType
  readonly additions: number
  readonly deletions: number
  readonly content?: string // 文件内容可选
  readonly diff?: string // 差异内容
}

/**
 * 差异内容
 */
export interface DiffResult {
  // 这里可以定义更细粒度的 Schema 差异，例如：
  // addedNodes: Node[];
  // modifiedNodes: Node[];
  // deletedNodes: Node[];
  // changedProps: { nodeId: string; oldProps: Record<string, any>; newProps: Record<string, any> }[];
  // simplified for now, could be a diff object representing schema changes
  diff: jsonDiffPatch.Delta // 差异对象，如果无差异则为 undefined
}

/**
 * Commit提交状态
 */
export interface CommitStats {
  readonly totalAdditions: number
  readonly totalDeletions: number
  readonly changedFiles: number
}

/**
 * Commit信息接口
 */
export interface Commit {
  readonly id: ID
  readonly message: string
  readonly author: User
  readonly committer: User
  readonly timestamp: Timestamp
  readonly parentCommits: readonly ID[] // 父提交ID列表，支持多个父提交（合并提交）
  readonly branchId: ID
  readonly schema: PageSchema // 页面Schema，代表低代码页面
  readonly tags: readonly string[]
  readonly verified: boolean // 签名验证状态
  readonly stats: CommitStats
}

/**
 * 映射类型：创建一个只包含指定键的 Commit 类型
 */
type CommitSummary = Pick<Commit, 'id' | 'message' | 'author' | 'timestamp'>

/**
 * 分支类型
 */
export type BranchType = 'root' | 'normal'

/**
 * 分支状态
 */
export type BranchStatus =
  | 'active' // 活跃状态
  | 'merged' // 已合并
  | 'pending_changes' // 有待提交变更
  | 'merging' // 合并中
  | 'conflicted' // 存在冲突
  | 'stale' // 过期分支
  | 'archived' // 已归档
  | 'deleted' // 已删除

/**
 * Branch 接口
 */
export interface Branch {
  readonly id: ID
  readonly name: string
  readonly type: BranchType
  readonly status: BranchStatus
  readonly description?: string
  readonly upstreamBranchId?: ID // 上游分支ID（主分支为 undefined）
  readonly downstreamBranchIds?: readonly ID[] // 下游分支ID列表
  readonly headCommitId: ID // 当前分支最新提交
  readonly baseCommitId: ID // 分支创建时的基础提交
  readonly creator: User
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly lastCommitAt?: Timestamp
  readonly commitsCount: number
  readonly commitsAhead: number // 领先上游分支的提交数
  readonly commitsBehind: number //落后上游的分支的提交数
  readonly metadata: Record<string, unknown> // 扩展元数据
  // readonly protection?: // 分支保护手段
}

export type BranchHistory = Record<string, Branch>

export type CommitHistory = Record<string, Commit>

// ==================== 分支操作和状态管理类型 ====================

/**
 * 分支保护规则
 */
export interface BranchProtectionRule {
  allowForcePushes?: boolean
  allowDeletions?: boolean
  requiredApprovingReviewCount?: number
  requiredStatusChecks?: string[] // e.g. ['lint', 'test']
  enforceAdmins?: boolean
}

/**
 * 创建分支请求参数
 */
export interface CreateBranchRequest {
  readonly name: string
  readonly upstreamBranchId: ID // 父分支ID
  readonly commitId?: ID // 可选，指定从哪个提交点创建分支
  readonly description?: string
  readonly type?: BranchType
}

/**
 * 创建分支响应
 */
export interface CreateBranchResponse {
  readonly success: boolean
  readonly branch: Branch
  readonly message?: string
}

/**
 * 销毁分支请求参数
 */
export interface DestroyBranchRequest {
  readonly branchId: ID
  readonly force?: boolean // 是否强制销毁，不检查是否已合并
}

/**
 * 销毁分支响应
 */
export interface DestroyBranchResponse {
  readonly success: boolean
  readonly message?: string
}

/**
 * 合并策略
 */
export type MergeStrategy = 'fast-forward' | 'three-way' | 'rebase'

/**
 * 合并分支请求参数
 */
export interface MergeBranchRequest {
  readonly sourceBranchId: ID
  readonly targetBranchId: ID
  readonly strategy?: MergeStrategy // 合并策略，默认为 three-way
  readonly commitMessage?: string // 合并提交信息
}

/**
 * 合并分支响应
 */
export interface MergeBranchResponse {
  readonly success: boolean
  readonly newCommitId?: ID // 合并后生成的新提交ID
  readonly conflictedFiles?: ConflictReport[] // 冲突文件列表
  readonly message?: string
}

/**
 * 更新分支请求参数 (Pull)
 */
export interface UpdateBranchRequest {
  readonly branchId: ID // 子分支ID
  readonly upstreamBranchId: ID // 母分支ID
}

/**
 * 更新分支响应 (Pull)
 */
export interface UpdateBranchResponse {
  readonly success: boolean
  readonly newCommitId?: ID // 更新后生成的新提交ID
  readonly conflictedFiles?: ConflictReport[] // 冲突文件列表
  readonly message?: string
}

/**
 * 分支状态查询响应
 */
export interface BranchStatusResponse {
  readonly branchId: ID
  readonly status: BranchStatus
  readonly hasPendingChanges: boolean // 是否有待提交变更
  readonly isMerged: boolean // 是否已合并到主分支或其他目标分支
  readonly mergingStatus?: {
    readonly inProgress: boolean // 是否正在合并中
    readonly conflicted: boolean // 是否存在冲突
    readonly conflictCount?: number // 冲突数量
  }
  readonly lastCommit?: CommitSummary // 最新提交的概要信息
  readonly commitsAhead?: number // 领先上游分支的提交数
  readonly commitsBehind?: number // 落后上游分支的提交数
  readonly message?: string
}

/**
 * 分支操作历史记录
 */
export interface BranchOperationHistory {
  readonly operationId: ID
  readonly branchId: ID
  readonly operator: User
  readonly operationType:
    | 'create'
    | 'destroy'
    | 'merge'
    | 'update'
    | 'protect'
    | 'unprotect'
    | 'archive'
    | 'unarchive'
    | 'restore'
    | 'rename'
  readonly timestamp: Timestamp
  readonly details: Record<string, unknown> // 操作详情，例如合并源分支ID、目标分支ID等
}

/**
 * 分支操作历史查询响应
 */
export interface BranchOperationHistoryResponse {
  readonly success: boolean
  readonly history: BranchOperationHistory[]
  readonly totalCount: number
  readonly message?: string
}

// ==================== 冲突解决和历史记录类型 ====================

/**
 * 冲突类型
 */
type ConflictType =
  | 'content'
  | 'file_added_by_both'
  | 'file_deleted_by_one'
  | 'file_renamed_by_both'
  | 'property_conflict'

/**
 * 冲突报告接口
 */
export interface ConflictReport {
  readonly filePath: string
  readonly conflictType: ConflictType
  readonly lineNumber?: number // 冲突起始行号
  readonly conflictContent?: string // 冲突内容片段
  readonly baseContent?: string // 基础版本内容
  readonly currentContent?: string // 当前分支内容
  readonly incomingContent?: string // 传入分支内容
  readonly suggestedResolution?: ConflictResolutionStrategy // 建议的解决方案
  readonly message?: string
}

/**
 * 冲突解决策略
 */
type ConflictResolutionStrategy =
  | 'accept_current' // 接受当前分支的更改
  | 'accept_incoming' // 接受传入分支的更改
  | 'manual' // 手动解决
  | 'auto_merge' // 自动合并（系统尝试解决）

/**
 * 冲突解决请求参数
 */
export interface ResolveConflictRequest {
  readonly branchId: ID
  readonly filePath: string
  readonly strategy: ConflictResolutionStrategy
  readonly resolvedContent?: string // 如果是手动解决，提供解决后的内容
}

/**
 * 冲突解决响应
 */
export interface ResolveConflictResponse {
  readonly success: boolean
  readonly message?: string
  readonly remainingConflicts?: ConflictReport[] // 剩余未解决的冲突
}

/**
 * 提交历史查询参数
 */
export interface CommitHistoryRequest {
  readonly branchId: ID
  readonly page?: number
  readonly pageSize?: number
  readonly authorId?: ID
  readonly since?: Timestamp
  readonly until?: Timestamp
  readonly searchKeyword?: string // 搜索提交信息或文件变更
}

/**
 * 提交历史响应
 */
export interface CommitHistoryResponse {
  readonly success: boolean
  readonly commits: Commit[]
  readonly totalCount: number
  readonly page: number
  readonly pageSize: number
  readonly message?: string
}

/**
 * 文件历史查询参数
 */
export interface FileHistoryRequest {
  readonly branchId: ID
  readonly filePath: string
  readonly page?: number
  readonly pageSize?: number
}

/**
 * 文件历史响应
 */
export interface FileHistoryResponse {
  readonly success: boolean
  readonly fileCommits: CommitSummary[] // 包含该文件变更的提交列表
  readonly totalCount: number
  readonly page: number
  readonly pageSize: number
  readonly message?: string
}

// ==================== 页面架构（快照）和页面状态 ====================

/**
 * 页面或组件的基本节点结构
 */
export interface Node {
  id: string
  componentName: string
  props: Record<string, any> & { columns?: { slots?: Record<string, any> }[] }
  children?: Node[]
  componentType?: 'Block' | 'PageStart' | 'PageSection'
  slots?: string | Record<string, any>
  params?: string[]
  loop?: Record<string, any>
  loopArgs?: string[]
  conditions?: boolean | Record<string, any>
}

/**
 * 根节点结构，代表完整的页面
 */
export type RootNode = Omit<Node, 'id'> & {
  id?: string
  css?: string
  fileName?: string
  methods?: Record<string, any>
  state?: Record<string, any>
  lifeCycles?: Record<string, any>
  dataSource?: any
  bridge?: any
  inputs?: any[]
  outputs?: any[]
  schema?: any // 递归引用自身或其他Schema类型
}

/**
 * 页面Schema，等同于 RootNode，用于明确语义
 */
export type PageSchema = RootNode

/**
 * 页面快照类型
 */
export interface Snapshot {
  id: ID
  commitId: ID
  schema: PageSchema // 快照直接是 PageSchema
}

/**
 * 页面状态接口，用于管理页面在运行时或设计时的各种状态
 */
export interface PageState {
  currentVm?: unknown
  currentSchema?: { [x: string]: any; id: string }
  currentType?: unknown
  currentPage?: { [x: string]: any; id: string; name: string } | null
  currentPageId?: string
  currentPageName?: string
  hoverVm?: unknown
  pageSchema: RootNode | null
  properties?: unknown
  dataSource?: unknown
  dataSourceMap?: unknown
  isSaved: boolean
  isLock: boolean
  isBlock: boolean
  nodesStatus: Record<string, any>
  loading: boolean
}
