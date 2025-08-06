import type { ConflictReport, MergeStrategy, PageSchema } from '../../shared/type'
import type { Branch } from '../models/Branch'
import { SchemaDiffResolver } from './SchemaDiffResolver'

/**
 * MergeResolver 接口定义
 * 专注于 Schema 的合并逻辑
 */
export interface MergeResolver {
  performMerge(
    sourceBranch: Branch,
    targetBranch: Branch,
    sourceSchema: PageSchema,
    targetSchema: PageSchema,
    strategy: MergeStrategy,
    commitMessage?: string
  ): { mergedSchema?: PageSchema; conflictedReports?: ConflictReport[] }
}
/**
 * MergeReslover 实现类
 * 负责执行 PageSchema 的合并操作，处理不同的合并策略。
 * 依赖 SchemaDiffResolver 来计算和应用差异。
 */
export class MergeResloverImpl implements MergeResolver {
  private readonly schemaDiffResolver: SchemaDiffResolver

  constructor() {
    this.schemaDiffResolver = SchemaDiffResolver.getInstance()
  }

  /**
   * 执行 Schema 合并操作
   * @param sourceBranch 源分支
   * @param targetBranch 目标分支
   * @param sourceSchema 源分支的最新 Schema
   * @param targetSchema 目标分支的最新 Schema
   * @param strategy 合并策略
   * @param commitMessage 合并提交信息
   * @returns 合并结果，包含合并后的 Schema 和潜在的冲突报告
   */
  public performMerge(
    sourceBranch: Branch,
    targetBranch: Branch,
    sourceSchema: PageSchema,
    targetSchema: PageSchema,
    strategy: MergeStrategy
    // commitMessage?: string
  ): { mergedSchema?: PageSchema; conflictedReports?: ConflictReport[] } {
    switch (strategy) {
      case 'three-way':
        return this.threeWayMerge(sourceBranch, targetBranch, sourceSchema, targetSchema)
      case 'fast-forward':
        return this.fastForwardMerge(sourceBranch, targetBranch, sourceSchema, targetSchema)
      case 'rebase':
        // Rebase 策略通常在 BranchService 层面处理，这里简化为不支持直接合并
        throw new Error(
          'Rebase strategy not supported directly in MergeResolver. It should be handled at BranchService level.'
        )
      default:
        throw new Error(`Unsupported merge strategy: ${strategy}`)
    }
  }

  private threeWayMerge(
    sourceBranch: Branch,
    targetBranch: Branch,
    sourceSchema: PageSchema,
    targetSchema: PageSchema
  ): { mergedSchema?: PageSchema; conflictedReports?: ConflictReport[] } {
    // 简化处理：假设没有共同祖先，直接尝试合并 sourceSchema 到 targetSchema
    // 实际的三方合并需要：
    // 1. 找到 sourceBranch 和 targetBranch 的共同祖先 (baseCommit)
    // 2. 计算 sourceSchema 相对于 baseSchema 的差异 (sourceDiff)
    // 3. 计算 targetSchema 相对于 baseSchema 的差异 (targetDiff)
    // 4. 尝试将 sourceDiff 应用到 targetSchema 上
    // 5. 如果有冲突，则生成冲突报告

    // 这里我们直接尝试将 sourceSchema 的内容“合并”到 targetSchema
    // 这是一个非常简化的合并，它不会真正解决结构性冲突，只会覆盖或添加属性
    // 对于 PageSchema 这种复杂结构，真正的三方合并需要深入到 Node 层面进行比较和合并
    // TODO: 完成全部功能之后再来完善

    // 这里简单地将 sourceSchema 的属性合并到 targetSchema，如果属性冲突则 targetSchema 优先
    const mergedSchema: PageSchema = { ...targetSchema }

    // 遍历 sourceSchema 的属性，如果 targetSchema 没有，则添加；如果有，则根据需要覆盖或合并
    for (const key in sourceSchema) {
      if (Object.prototype.hasOwnProperty.call(sourceSchema, key)) {
        const sourceValue = (sourceSchema as any)[key]
        const targetValue = (targetSchema as any)[key]

        if (!Object.prototype.hasOwnProperty.call(targetSchema, key)) {
          // targetSchema 没有这个属性，直接添加
          ;(mergedSchema as any)[key] = sourceValue
        } else if (key === 'children' && Array.isArray(sourceValue) && Array.isArray(targetSchema)) {
          // 简化：对于 children 数组，直接合并（去重）
          // 实际需要更复杂的算法来合并 Node 数组，例如根据 id 合并或识别新增/删除/移动
          const mergedChildren = [...targetValue]
          sourceValue.forEach((sourceNode: any) => {
            if (!mergedChildren.some((targetNode: any) => targetNode.id === sourceNode.id)) {
              mergedChildren.push(sourceNode)
            }
          })
          mergedSchema.children = mergedChildren
        } else if (
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(sourceValue) &&
          !Array.isArray(targetValue)
        ) {
          // 递归合并对象属性
          ;(mergedSchema as any)[key] = { ...targetValue, ...sourceValue }
        } else {
          // 其他类型属性，targetSchema 优先
          ;(mergedSchema as any)[key] = targetValue
        }
      }
    }

    // 这里的冲突检测非常简化，实际需要更复杂的逻辑
    const conflictedReports: ConflictReport[] = []
    // TODO
    // 假设如果 sourceSchema 和 targetSchema 在某些关键属性上不同，就可能产生冲突
    // 举例说明：如果两个 Schema 的 fileName 不同，可以视为冲突
    // 其他情况之后再讨论
    if (sourceSchema.fileName && targetSchema.fileName && sourceSchema.fileName !== targetSchema.fileName) {
      conflictedReports.push({
        conflictType: 'property_conflict',
        filePath: 'fileName',
        baseContent: 'N/A', // 实际需要共同祖先的值
        currentContent: sourceSchema.fileName,
        incomingContent: targetSchema.fileName,
        message: `Filename conflict: source is '${sourceSchema.fileName}', target is '${targetSchema.fileName}'`
      })
    }

    return { mergedSchema, conflictedReports: conflictedReports.length > 0 ? conflictedReports : undefined }
  }

  /**
   * 快进合并 (Fast-Forward Merge)
   * 适用于目标分支是源分支的直接祖先的情况。
   * 此时只需将目标分支的头指针移动到源分支的头指针。
   */
  private fastForwardMerge(
    sourceBranch: Branch,
    targetBranch: Branch,
    sourceSchema: PageSchema,
    _targetSchema: PageSchema
  ): { mergedSchema?: PageSchema; conflictedReports?: ConflictReport[] } {
    // 检查是否满足快进合并条件：targetBranch 的 headCommitId 必须是 sourceBranch 的祖先
    // 简化：这里直接假设满足条件，直接返回 sourceSchema 作为合并结果
    // 实际需要通过遍历提交历史来判断祖先关系 (targetSchema)
    // 例如：if (this.isAncestor(targetBranch.headCommitId, sourceBranch.headCommitId) && targetSchema) {
    //   return { mergedSchema: sourceSchema };
    // } else {
    //   throw new Error('Not a fast-forward merge scenario.');
    // }

    return { mergedSchema: sourceSchema }
  }
}
