import * as jsonDiffPatch from 'jsondiffpatch'
import DiffMatchPatch from 'diff-match-patch'
import type { CommitStats, PageSchema } from '../../shared/type'

/**
 * SchemaStatsCalculator 类
 * 用于计算两个 PageSchema 之间的差异统计信息 (CommitStats)
 */
export class SchemaStatsCalculator {
  private jsonDiffPatchInstance: jsonDiffPatch.DiffPatcher

  constructor() {
    this.jsonDiffPatchInstance = jsonDiffPatch.create({
      // 用于对象哈希，确保相同的文件或节点能被正确识别
      objectHash: function (obj: any, index) {
        // 优先使用 id 字段作为哈希，如果不存在则使用 componentName 或索引
        return obj.id || obj.componentName || `$$index:${index}`
      },
      // 数组差异检测，可以检测元素的移动
      arrays: {
        detectMove: true,
        includeValueOnMove: false
      },
      // 文本差异，用于处理字符串内容的详细差异
      textDiff: {
        diffMatchPatch: DiffMatchPatch,
        minLength: 60 // 只有当字符串长度超过此值时才进行详细文本差异计算
      },
      // 属性过滤器，忽略以 '$' 开头的内部属性
      propertyFilter: function (name) {
        return name.slice(0, 1) !== '$'
      },
      // 避免克隆差异值，提高性能
      cloneDiffValues: false
    })
  }

  /**
   * 计算两个 PageSchema 之间的 CommitStats
   * @param oldSchema 旧的 PageSchema
   * @param newSchema 新的 PageSchema
   * @returns CommitStats 包含 totalAdditions, totalDeletions, changedFiles
   */
  public calculateStats(oldSchema: PageSchema, newSchema: PageSchema): CommitStats {
    const delta = this.jsonDiffPatchInstance.diff(oldSchema, newSchema)

    let totalAdditions = 0
    let totalDeletions = 0
    const changedFiles: string[] = [] // 在 Schema 中，可以理解为 changedNodes 或 changedPaths

    if (!delta) {
      return { totalAdditions: 0, totalDeletions: 0, changedFiles: [] }
    }

    // 递归遍历 delta 对象，计算差异
    const traverseDelta = (currentDelta: any, path: string[]) => {
      for (const key in currentDelta) {
        if (!Object.prototype.hasOwnProperty.call(currentDelta, key)) {
          continue
        }

        const value = currentDelta[key]
        const currentPath = [...path, key]
        const pathStr = currentPath.join('.')

        // 判断是否是新增、删除或修改
        if (Array.isArray(value)) {
          if (value.length === 1) {
            // [newValue] - 新增
            totalAdditions++
            if (!changedFiles.includes(pathStr)) changedFiles.push(pathStr)
          } else if (value.length === 2) {
            // [oldValue, newValue] - 修改
            totalAdditions++ // 视为新增一行
            totalDeletions++ // 视为删除一行
            if (!changedFiles.includes(pathStr)) changedFiles.push(pathStr)
          } else if (value.length === 3 && value[2] === 0) {
            // [oldValue, newValue, 0] - 文本差异
            // 文本差异通常包含在 value[0] 和 value[1] 中，这里简化处理，只算作修改
            totalAdditions++
            totalDeletions++
            if (!changedFiles.includes(pathStr)) changedFiles.push(pathStr)
          } else if (value.length === 3 && value[2] === 2) {
            // [oldValue, 0, 2] - 删除
            totalDeletions++
            if (!changedFiles.includes(pathStr)) changedFiles.push(pathStr)
          } else if (value.length === 3 && value[2] === 3) {
            // [oldValue, newValue, 3] - 数组元素移动
            // 移动不直接增加或删除行数，但表示文件有变动
            if (!changedFiles.includes(pathStr)) changedFiles.push(pathStr)
          }
        } else if (typeof value === 'object' && value !== null) {
          // 递归处理嵌套对象
          traverseDelta(value, currentPath)
        }
      }
    }

    traverseDelta(delta, [])

    return {
      totalAdditions,
      totalDeletions,
      changedFiles
    }
  }
}
