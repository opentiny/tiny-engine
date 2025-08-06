import * as jsonDiffPatch from 'jsondiffpatch'
import DiffMatchPatch from 'diff-match-patch'
import type { PageSchema } from '../../shared/type'

/**
 * SchemaDiffResolver 类
 * 封装了使用 jsondiffpatch 进行 Schema 差异计算和应用的功能
 */
export class SchemaDiffResolver {
  private static instance: SchemaDiffResolver
  private differ: jsonDiffPatch.DiffPatcher

  private constructor() {
    this.differ = jsonDiffPatch.create({
      objectHash: function (obj: { fileName?: string; id?: string }, index) {
        // 优先使用 id 作为唯一标识，如果不存在则尝试 fileName，最后使用索引
        return obj.id || obj.fileName || `$$index:${index}`
      },
      arrays: {
        detectMove: true,
        includeValueOnMove: false
      },
      textDiff: {
        diffMatchPatch: DiffMatchPatch,
        minLength: 60
      },
      propertyFilter: function (name) {
        // 过滤掉以 '$' 开头的属性，这些通常是内部或临时属性
        return name.slice(0, 1) !== '$'
      },
      cloneDiffValues: false // 避免深拷贝，提高性能
    })
  }

  /**
   * 获取 SchemaDiffResolver 的单例实例
   */
  public static getInstance(): SchemaDiffResolver {
    if (!SchemaDiffResolver.instance) {
      SchemaDiffResolver.instance = new SchemaDiffResolver()
    }
    return SchemaDiffResolver.instance
  }

  /**
   * 计算两个 PageSchema 之间的差异
   * @param oldSchema 旧的 PageSchema
   * @param newSchema 新的 PageSchema
   * @returns 差异对象 (delta)，如果无差异则返回 undefined
   */
  public calculateDiff(oldSchema: PageSchema, newSchema: PageSchema): jsonDiffPatch.Delta | undefined {
    return this.differ.diff(oldSchema, newSchema)
  }

  /**
   * 将差异应用到 PageSchema 上
   * @param schema 原始 PageSchema
   * @param delta delta 差异对象
   * @returns 应用差异后的新 PageSchema
   */
  public applyPatch(schema: PageSchema, delta: jsonDiffPatch.Delta): PageSchema {
    // jsondiffpatch 的 patch 方法会修改原始对象，因此我们先克隆一份
    const cloneSchema = JSON.parse(JSON.stringify(schema))
    return this.differ.patch(cloneSchema, delta) as PageSchema
  }

  /**
   * 还原 PageSchema 到之前的状态 (撤销 patch)
   * @param schema 当前 PageSchema
   * @param delta 差异对象
   * @returns 还原后的 PageSchema
   */
  public unapplyPatch(schema: PageSchema, delta: jsonDiffPatch.Delta): PageSchema {
    const clonedSchema = JSON.parse(JSON.stringify(schema))
    return this.differ.unpatch(clonedSchema, delta) as PageSchema
  }
}
