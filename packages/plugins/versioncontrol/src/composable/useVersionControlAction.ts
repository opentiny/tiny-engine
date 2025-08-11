import type { Ref } from 'vue'
import type { Commit, CompareData } from './uesVersionControlData'

interface UseVersionControlActionsParams {
  commits: Ref<Commit[]>
  branches: Ref<string[]>
  currentBranch: Ref<string>
  selectedCommit: Ref<Commit | null>
  dialogVisible: Ref<boolean>
  compareDialogVisible: Ref<boolean>
  isLoading: Ref<boolean>
  compareData: Ref<CompareData>
  tagDialogVisible: Ref<boolean>
  newTagName: Ref<string>
  newTagDescription: Ref<string>
  tagTargetCommit: Ref<string>
  currentPage: Ref<number>
  pageSize: Ref<number>
  searchQuery: Ref<string>
  authorFilter: Ref<string>
  timeFilter: Ref<string>
  branchDialogVisible: Ref<boolean>
  branchTargetCommit: Ref<string>
  newBranchName: Ref<string>
}

export function useVersionControlActions(
  emit: (event: string, ...args: any[]) => void,
  {
    commits,
    branches,
    currentBranch,
    selectedCommit,
    dialogVisible,
    compareDialogVisible,
    isLoading,
    compareData,
    tagDialogVisible,
    newTagName,
    newTagDescription,
    tagTargetCommit,
    currentPage,
    searchQuery,
    authorFilter,
    timeFilter,
    branchDialogVisible,
    branchTargetCommit,
    newBranchName
  }: UseVersionControlActionsParams
) {
  const close = () => {
    emit('close')
  }

  const onBranchChange = () => {
    currentPage.value = 1 // 分支改变时重置分页
  }

  const onSearch = () => {
    currentPage.value = 1 // 搜索时重置分页
  }

  const applyFilters = () => {
    currentPage.value = 1 // 筛选时重置分页
  }

  const clearFilters = () => {
    authorFilter.value = ''
    timeFilter.value = ''
    searchQuery.value = ''
    currentBranch.value = 'all'
    currentPage.value = 1
  }

  const applySorting = () => {
    currentPage.value = 1 // 排序时重置分页
  }

  const selectCommit = (commit: Commit) => {
    selectedCommit.value = commit
  }

  const showCommitDetails = (commit: Commit) => {
    selectedCommit.value = commit
    dialogVisible.value = true
  }

  const closeDialog = () => {
    dialogVisible.value = false
    selectedCommit.value = null
  }

  const compareCommit = (commit: Commit) => {
    // 模拟比较数据
    compareData.value = {
      base: commits.value[commits.value.indexOf(commit) + 1] || null,
      target: commit,
      filesChanged: commit.filesChanged || 0,
      additions: commit.additions || 0,
      deletions: commit.deletions || 0,
      changedFiles:
        commit.changedFiles?.map((name) => ({
          name,
          additions: Math.floor(Math.random() * 20),
          deletions: Math.floor(Math.random() * 10)
        })) || []
    }
    compareDialogVisible.value = true
  }

  const closeCompareDialog = () => {
    compareDialogVisible.value = false
    compareData.value = {
      base: null,
      target: null,
      filesChanged: 0,
      additions: 0,
      deletions: 0,
      changedFiles: []
    }
  }

  const revertToCommit = (commit: Commit) => {
    if (confirm(`确定要回滚到提交 ${commit.hash.slice(0, 7)} 吗？这将撤销所有后续更改。`)) {
      alert(`已回滚到提交 ${commit.hash.slice(0, 7)}。 (模拟操作)`)
      // 实际操作中会调用后端API执行回滚
    }
  }

  const compareWithCurrent = () => {
    compareCommit(selectedCommit.value!)
    closeDialog()
  }

  const createTag = () => {
    tagDialogVisible.value = true
    newTagName.value = ''
    newTagDescription.value = ''
    tagTargetCommit.value = selectedCommit.value ? selectedCommit.value.hash : commits.value[0].hash // 默认当前选中或最新提交
  }

  const closeTagDialog = () => {
    tagDialogVisible.value = false
  }

  const confirmCreateTag = () => {
    if (!newTagName.value) {
      alert('标签名称不能为空！')
      return
    }
    alert(
      `已为提交 ${tagTargetCommit.value.slice(0, 7)} 创建标签：${newTagName.value} (描述：${
        newTagDescription.value
      }) (模拟操作)`
    )
    // 实际操作中会调用后端API创建标签
    tagDialogVisible.value = false
  }

  const closeBranchDialog = () => {
    branchDialogVisible.value = false
  }

  const createBranch = () => {
    branchDialogVisible.value = true
    newBranchName.value = ''
    branchTargetCommit.value = selectedCommit.value ? selectedCommit.value.hash : commits.value[0].hash // 默认当前选中或最新提交
  }

  const createBranchFromCommit = (commit: Commit) => {
    branchDialogVisible.value = true
    branchTargetCommit.value = commit.hash
    closeDialog()
  }

  const confirmCreateBranch = () => {
    if (branchTargetCommit && newBranchName) {
      alert(`已基于提交 ${branchTargetCommit.value} 创建新分支：${newBranchName.value} (模拟操作)`)
      branches.value.push(newBranchName.value)
      currentBranch.value = newBranchName.value
      // 实际操作中会调用后端API创建分支
    }
    branchDialogVisible.value = false
  }

  const loadMore = () => {
    if (!isLoading.value) {
      isLoading.value = true
      setTimeout(() => {
        currentPage.value++
        isLoading.value = false
      }, 500) // 模拟加载延迟
    }
  }

  return {
    close,
    onBranchChange,
    onSearch,
    applyFilters,
    clearFilters,
    applySorting,
    selectCommit,
    showCommitDetails,
    closeDialog,
    compareCommit,
    closeCompareDialog,
    revertToCommit,
    createTag,
    closeTagDialog,
    confirmCreateTag,
    createBranch,
    createBranchFromCommit,
    loadMore,
    compareWithCurrent,
    closeBranchDialog,
    confirmCreateBranch
  }
}
