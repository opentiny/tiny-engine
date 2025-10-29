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
    const changedFiles: { path: string; oldValue: any; newValue: any }[] = []

    if (!delta) {
      return { totalAdditions: 0, totalDeletions: 0, changedFiles: [] }
    }

    // 清理函数：去掉 jsondiffpatch 的内部数组键
    const cleanPath = (p: string) => {
      // 将 children.N 变为 children[N]
      let formatted = p
        .replace(/\.?_(\d+)/g, '[$1]')
        .replace(/children\.(\d+)/g, 'children[$1]')
        .replace(/\._t/g, '')
        .replace(/\.+/g, '.')
        .replace(/^\./, '')

      // 用 " > " 分隔不同层级
      formatted = formatted.replace(/\.children/g, ' > children')

      return formatted
    }

    const traverseDelta = (currentDelta: any, path: string[]) => {
      for (const key in currentDelta) {
        if (!Object.prototype.hasOwnProperty.call(currentDelta, key)) continue

        const value = currentDelta[key]
        const currentPath = [...path, key]
        const pathStr = cleanPath(currentPath.join('.')) // 清理路径

        if (Array.isArray(value)) {
          let oldValue = null
          let newValue = null

          if (value.length === 1) {
            // [newValue] - 新增
            totalAdditions++
            newValue = value[0]
          } else if (value.length === 2) {
            // [oldValue, newValue] - 修改
            // 但如果 newValue === 0，说明是被删除或空位，不应计入修改
            if (value[1] === 0) {
              totalDeletions++
              oldValue = value[0]
              newValue = null
            } else {
              totalAdditions++
              totalDeletions++
              oldValue = value[0]
              newValue = value[1]
            }
          } else if (value.length === 3 && value[2] === 0) {
            // [oldValue, newValue, 0] - 文本差异
            totalAdditions++
            totalDeletions++
            oldValue = value[0]
            newValue = value[1]
          } else if (value.length === 3 && value[2] === 2) {
            // [oldValue, 0, 2] - 删除
            totalDeletions++
            oldValue = value[0]
          } else if (value.length === 3 && value[2] === 3) {
            // [oldValue, newValue, 3] - 数组移动
            oldValue = value[0]
            newValue = value[1]
          }

          if (oldValue !== null || newValue !== null) {
            changedFiles.push({ path: pathStr, oldValue, newValue })
          }
        } else if (typeof value === 'object' && value !== null) {
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
