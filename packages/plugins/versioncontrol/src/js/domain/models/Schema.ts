import type { ID, PageSchema, PageState, Timestamp, User } from '../../shared/type'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

/**
 * Schema 领域模型类
 * 定义了页面或组件的节点结构、根节点结构等
 */
export class Schema {
  readonly id: ID
  private _pageSchema: PageSchema
  private _creator: User
  private _createdAt: Timestamp
  private _updatedAt: Timestamp
  private _version: string
  private _metadata: Record<string, unknown>

  constructor(
    id: ID,
    pageSchema: PageSchema,
    creator: User,
    createdAt: Timestamp,
    updatedAt: Timestamp,
    options: {
      version?: string
      metadata?: Record<string, unknown>
    }
  ) {
    this.id = id
    this._pageSchema = pageSchema
    this._creator = creator
    this._createdAt = createdAt
    this._updatedAt = updatedAt
    this._version = options?.version || '1.0.0'
    this._metadata = options?.metadata || {}
  }

  // Getters
  get pageSchema(): PageSchema {
    return this._pageSchema
  }

  get creator(): User {
    return this._creator
  }

  get createdAt(): Timestamp {
    return this._createdAt
  }

  get updatedAt(): Timestamp {
    return this._updatedAt
  }

  get version(): string {
    return this._version
  }

  get metadata(): Record<string, unknown> {
    return this._metadata
  }

  // Schema 操作方法

  /**
   * 导入 Schema
   */
  importSchema(data: PageSchema): void {
    useCanvas().importSchema(data)
    this._pageSchema = data
    this._updatedAt = Date.now()
  }

  /**
   * 导出 Schema
   */
  exportSchema() {
    return useCanvas().exportSchema()
  }

  /**
   * 将Schema对象转换为纯粹的数据接口，用于数据传输或持久化
   */
  toData(): {
    id: ID
    pageSchema: PageSchema
    creator: User
    createdAt: Timestamp
    updatedAt: Timestamp
    version: string
    metadata: Record<string, unknown>
  } {
    return {
      id: this.id,
      pageSchema: this._pageSchema,
      creator: this._creator,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this._version,
      metadata: this._metadata
    }
  }

  /**
   * 从纯粹的数据接口创建Schema实例
   */
  static fromData(data: {
    id: ID
    pageSchema: PageSchema
    pageState: PageState
    creator: User
    createdAt: Timestamp
    updatedAt: Timestamp
    version: string
    metadata: Record<string, unknown>
  }): Schema {
    return new Schema(data.id, data.pageSchema, data.creator, data.createdAt, data.updatedAt, {
      version: data.version,
      metadata: data.metadata
    })
  }
}
