import { computed } from 'vue'
import type { DisplayCommit } from './uesVersionControlData'
import { versionManager } from '../js'

export function useUtils() {
  const useVModel = (
    props: { [x: string]: any },
    emit: (arg0: string, arg1: any) => void,
    propName: string | number
  ) => {
    return computed({
      get: () => props[propName],
      set: (val) => emit(`update:${propName}`, val)
    })
  }

  const transformCommit = async (json: Record<any, any>): Promise<DisplayCommit> => {
    let branchName: string[]
    if (json.branchId) {
      const branch = await versionManager.branchAppService.getBranch(json.branchId)
      if (branch) {
        branchName = [branch.name]
      } else {
        branchName = []
      }
    } else {
      branchName = []
    }

    return {
      id: json.id,
      hash: json.hash,
      author: json.author?.username || '',
      date: new Date(json.timestamp).toISOString(),
      message: json.message,
      avatar: json.author?.avatar || '',
      type: json.type || 'commit',
      tags: json.tags || [],
      branches: branchName,
      filesChanged: json.stats?.changedFiles?.length || 0,
      additions: json.stats?.totalAdditions || 0,
      deletions: json.stats?.totalDeletions || 0,
      changedFiles: json.stats?.changedFiles || []
      // raw: json, // 保留原始数据
    }
  }
  return {
    useVModel,
    transformCommit
  }
}
