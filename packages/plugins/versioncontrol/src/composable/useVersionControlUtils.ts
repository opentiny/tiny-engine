import { watch } from 'vue'
import type { Ref } from 'vue'

interface UseVersionControlUtilsParams {
  currentBranch: Ref<string>
  searchQuery: Ref<string>
}

export function useVersionControlUtils({ currentBranch, searchQuery }: UseVersionControlUtilsParams) {
  // 格式化函数
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('zh-CN', options)
  }

  const formatTime = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleTimeString('zh-CN', options)
  }

  const getCommitTypePrefix = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      feat: '特性',
      fix: '修复',
      docs: '文档',
      style: '样式',
      refactor: '重构',
      perf: '性能',
      test: '测试',
      build: '构建',
      ci: 'CI/CD',
      chore: '杂项',
      revert: '回滚',
      merge: '合并'
    }
    return typeMap[type] || type
  }

  const getCommitTypeClass = (commit: any): string => {
    if (commit.type === 'merge') return 'merge-dot'
    if (commit.tags && commit.tags.length > 0) return 'tag-dot'
    return 'normal-dot'
  }

  const getConnectorClass = (currentCommit: any, nextCommit: any): string => {
    // 简单的连接线逻辑，可以根据实际需求复杂化
    if (currentCommit.branches?.some((b: any) => nextCommit.branches?.includes(b))) {
      return 'straight-line'
    } else {
      return 'branching-line'
    }
  }

  // 监听器
  watch(currentBranch, () => {
    // 当分支改变时，可以触发一些数据重新加载或UI更新
    // console.log(`当前分支已切换到: ${currentBranch.value}`)
  })

  watch(searchQuery, () => {
    // 当搜索查询改变时，可以触发一些数据重新加载或UI更新
    // console.log(`搜索查询已更新: ${searchQuery.value}`)
  })

  return {
    formatDate,
    formatTime,
    getCommitTypePrefix,
    getCommitTypeClass,
    getConnectorClass
  }
}
