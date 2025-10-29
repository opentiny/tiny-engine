import { versionManager } from '../js'
import type { DisplayCommit } from './uesVersionControlData'
import { useUtils } from './useUtils'
import { useCanvas, useModal, useNotify } from '@opentiny/tiny-engine-meta-register'

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
    tagTargetCommit,
    currentPage,
    searchQuery,
    authorFilter,
    timeFilter,
    branchDialogVisible,
    branchTargetCommit,
    newBranchName,
    commitDialogVisible,
    close
  }: any
) {
  const { transformCommit } = useUtils()

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

  const selectCommit = (commit: DisplayCommit) => {
    selectedCommit.value = commit
  }

  const showCommitDetails = (commit: DisplayCommit) => {
    selectedCommit.value = commit
    dialogVisible.value = true
  }

  const closeDialog = () => {
    dialogVisible.value = false
    selectedCommit.value = null
  }

  const compareCommit = async (commit: DisplayCommit) => {
    // 比较 commit
    const brnachId = commit.branches[0]
    const baseBranch = await versionManager.branchRepository.findByName(brnachId)

    // 找到基准 commit
    const baseCommitId = baseBranch?.baseCommitId as string
    const rawBaseCommit = await versionManager.commitRepository.findById(baseCommitId)

    const baseCommit = await transformCommit(rawBaseCommit)

    // 对比数据
    compareData.value = {
      base: baseCommit || null,
      target: commit,
      filesChanged: commit.filesChanged || 0,
      additions: commit.additions || 0,
      deletions: commit.deletions || 0,
      changedFiles:
        commit.changedFiles?.map((name) => ({
          name: name.path,
          additions: name.newValue,
          deletions: name.oldValue
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

  const revertToCommit = (commit: DisplayCommit) => {
    const { confirm } = useModal()
    confirm({
      title: '提示',
      message: `请确认是否回归到 "${commit.message}" 这个提交，这将覆盖你的所有更改`,
      exec() {
        versionManager.commitRepository.findById(commit.id).then((val) => {
          useCanvas().importSchema(val.schema)

          close()

          useNotify({
            type: 'success',
            message: '版本回退成功！'
          })
        })
      },
      cancel() {}
    })
  }

  const compareWithCurrent = () => {
    if (selectedCommit.value) {
      compareCommit(selectedCommit.value)
      closeDialog()
    } else {
      useNotify({ type: 'warning', message: '请先选择一个提交' })
    }
  }

  const createTag = () => {
    tagDialogVisible.value = true
    tagTargetCommit.value = selectedCommit.value ? selectedCommit.value.hash : commits.value[0].hash // 默认当前选中或最新提交
  }

  const closeTagDialog = () => {
    tagDialogVisible.value = false
  }

  const closeBranchDialog = () => {
    branchDialogVisible.value = false
  }

  const createBranch = () => {
    branchDialogVisible.value = true
    newBranchName.value = ''
    // branchTargetCommit.value = selectedCommit.value ? selectedCommit.value.hash : commits.value[0].hash // 默认当前选中或最新提交
  }

  const createBranchFromCommit = (commit: DisplayCommit) => {
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

  const closeCommitDialog = () => {
    commitDialogVisible.value = false
  }

  const createCommit = () => {
    commitDialogVisible.value = true
  }

  return {
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
    createBranch,
    createBranchFromCommit,
    loadMore,
    compareWithCurrent,
    closeBranchDialog,
    confirmCreateBranch,
    closeCommitDialog,
    createCommit
  }
}
