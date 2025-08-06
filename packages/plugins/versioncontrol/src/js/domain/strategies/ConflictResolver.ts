import type { ConflictReport, PageSchema } from '../../shared/type'
import { SchemaDiffResolver } from './SchemaDiffResolver'

/**
 * ConflictResolver 接口定义
 * 专注于 Schema 冲突的检测、报告和解决
 */
export interface ConflictResolver {
  /**
   * 生成冲突报告
   * @param baseSchema 共同祖先 Schema
   * @param sourceSchema 源分支 Schema
   * @param targetSchema 目标分支 Schema
   * @returns 冲突报告列表
   */
  generateConflictReport(baseSchema: PageSchema, sourceSchema: PageSchema, targetSchema: PageSchema): ConflictReport[]

  /**
   * 解决单个冲突
   * @param conflictReport 冲突报告
   * @param resolutionStrategy 解决策略 (e.g., 'use_source', 'use_target', 'manual')
   * @param manualResolutionData 手动解决时提供的数据
   * @returns 解决冲突后的 Schema 片段或整个 Schema
   */
  resolveConflict(
    conflictReport: ConflictReport,
    resolutionStrategy: 'use_source' | 'use_target' | 'manual',
    manualResolutionData?: any
  ): any
}

/**
 * ConflictReslover 实现类
 * 负责检测和解决 PageSchema 之间的冲突。
 */
export class ConflictResloverImpl implements ConflictResolver {
  private readonly schemaDiffResolver: SchemaDiffResolver

  constructor() {
    this.schemaDiffResolver = SchemaDiffResolver.getInstance()
  }

  /**
   * 生成冲突报告
   * 这是一个简化的实现，实际的 Schema 冲突检测会非常复杂，需要深入到 Node 级别。
   * 这里主要演示如何基于 jsondiffpatch 的 delta 来识别潜在冲突。
   * 真正的冲突检测需要识别：
   * - 同一路径下，源和目标都修改了，且修改内容不同
   * - 源和目标都删除了同一节点
   * - 源和目标都添加了同一节点 (通过 id 判断)
   */
  public generateConflictReport(
    baseSchema: PageSchema,
    sourceSchema: PageSchema,
    targetSchema: PageSchema
  ): ConflictReport[] {
    const conflicts: ConflictReport[] = []

    // 计算源分支相对于共同祖先的差异
    const sourceDelta = this.schemaDiffResolver.calculateDiff(baseSchema, sourceSchema)
    // 计算目标分支相对于共同祖先的差异
    const targetDelta = this.schemaDiffResolver.calculateDiff(baseSchema, targetSchema)

    if (!sourceDelta && !targetDelta) {
      return conflicts // 没有差异，就没有冲突
    }

    // 遍历 sourceDelta 和 targetDelta，识别冲突
    // 这是一个非常简化的冲突检测逻辑，仅作为示例，之后再去完善
    // 实际需要遍历 delta 对象的结构，识别修改、删除、添加等操作的交集
    // 并且需要判断这些交集是否构成冲突

    // 示例：如果 source 和 target 都修改了同一个属性，且修改值不同，则认为是冲突
    // 这是一个非常粗粒度的检测，实际需要更精细的路径匹配和值比较
    if (sourceDelta && targetDelta) {
      for (const path in sourceDelta) {
        if (
          Object.prototype.hasOwnProperty.call(sourceDelta, path) &&
          Object.prototype.hasOwnProperty.call(targetDelta, path)
        ) {
          // 假设如果同一个路径在两个 delta 中都存在，就可能存在冲突
          // 更精确的判断需要检查 delta 的具体操作类型 (e.g., _t, _0, _1, _2)
          const sourceChange = (sourceDelta as any)[path]
          const targetChange = (targetDelta as any)[path]

          // 简化：如果两者都是修改操作 (数组长度为2，表示旧值和新值)，且新值不同
          if (
            Array.isArray(sourceChange) &&
            sourceChange.length === 2 &&
            Array.isArray(targetChange) &&
            targetChange.length === 2 &&
            JSON.stringify(sourceChange[1]) !== JSON.stringify(targetChange[1])
          ) {
            conflicts.push({
              conflictType: 'property_conflict',
              filePath: path,
              baseContent: sourceChange[0], // 共同祖先的值
              currentContent: sourceChange[1],
              incomingContent: targetChange[1],
              message: `Conflict on property '${path}': both branches modified it.`
            })
          }
        }
      }
    }

    // 还可以添加其他类型的冲突检测，例如：
    // - 源分支删除了某个节点，目标分支修改了该节点
    // - 源分支修改了某个节点的属性，目标分支删除了该节点
    // - 两个分支都添加了相同 ID 的节点但内容不同
    return conflicts
  }

  /**
   * 解决单个冲突
   * @param conflictReport 冲突报告
   * @param resolutionStrategy 解决策略 ('use_source', 'use_target', 'manual')
   * @param manualResolutionData 手动解决时提供的数据
   * @returns 解决冲突后的值
   */
  public resolveConflict(
    conflictReport: ConflictReport,
    resolutionStrategy: 'use_source' | 'use_target' | 'manual',
    manualResolutionData?: any
  ): any {
    switch (resolutionStrategy) {
      case 'use_source':
        return conflictReport.currentContent
      case 'use_target':
        return conflictReport.incomingContent
      case 'manual':
        if (manualResolutionData === undefined) {
          throw new Error('Manual resolution requires manualResolutionData.')
        }
        return manualResolutionData
      default:
        throw new Error(`Unsupported resolution strategy: ${resolutionStrategy}`)
    }
  }
}
