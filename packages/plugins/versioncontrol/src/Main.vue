<template>
  <div class="version-control-container">
    <version-header
      v-model:currentBranch="currentBranch"
      v-model:searchQuery="searchQuery"
      v-model:availableBranches="availableBranches"
      @close="close"
      @branch-change="onBranchChange"
      @search="onSearch"
      @createTag="createTag"
      @createBranch="createBranch"
    />

    <main class="version-control-content">
      <!-- 筛选器 -->
      <VersionControlFilters
        v-model:authorFilter="authorFilter"
        v-model:timeFilter="timeFilter"
        :uniqueAuthors="uniqueAuthors"
        :filteredCommitsLength="filteredCommits.length"
        :uniqueAuthorsLength="uniqueAuthors.length"
        @applyFilters="applyFilters"
        @clearFilters="clearFilters"
        @createCommit="createCommit"
      />

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 左侧：图形化分支线 -->
        <TimelineContainer
          v-model:timelineView="timelineView"
          :filteredCommits="filteredCommits"
          :selectedCommit="selectedCommit"
          @selectCommit="selectCommit"
          :formatTime="formatTime"
          :getCommitTypeClass="getCommitTypeClass"
          :getConnectorClass="getConnectorClass"
        />

        <!-- 右侧：提交详情列表 -->
        <CommitsContainer
          v-model:viewMode="viewMode"
          v-model:sortBy="sortBy"
          :paginatedCommits="paginatedCommits"
          :selectedCommit="selectedCommit"
          :filteredCommitsLength="filteredCommits.length"
          :isLoading="isLoading"
          :hasMore="hasMore"
          :currentPage="currentPage"
          :pageSize="pageSize"
          @applySorting="applySorting"
          @selectCommit="selectCommit"
          @showCommitDetails="showCommitDetails"
          @compareCommit="compareCommit"
          @revertToCommit="revertToCommit"
          @clearFilters="clearFilters"
          @loadMore="loadMore"
          :formatDate="formatDate"
          :getCommitTypePrefix="getCommitTypePrefix"
        />
      </div>
    </main>

    <!-- 提交详情对话框 -->
    <version-commit-info
      v-model:dialogVisible="dialogVisible"
      v-model:selectedCommit="selectedCommit"
      @close-dialog="closeDialog"
      @compare-with-current="compareWithCurrent"
      @create-branch-from-commit="createBranchFromCommit"
      @revert-to-commit="revertToCommit"
    />

    <!-- 标签创建对话框 -->
    <version-tag-create
      v-model:tagDialogVisible="tagDialogVisible"
      v-model:tagTargetCommit="tagTargetCommit"
      v-model:commits="commits"
      @close-tag-dialog="closeTagDialog"
    />

    <!-- 分支创建对话框 -->
    <version-branch-create
      v-model:branchDialogVisible="branchDialogVisible"
      v-model:newBranchName="newBranchName"
      v-model:branchTargetCommit="branchTargetCommit"
      v-model:availableBranches="availableBranches"
      :commits="commits"
      @close-branch-dialog="closeBranchDialog"
      @confirm-create-branch="confirmCreateBranch"
    />

    <version-commit-create
      v-model:commitDialogVisible="commitDialogVisible"
      v-model:availableBranches="availableBranches"
      v-model:commits="commits"
      @close-commit-dialog="closeCommitDialog"
    />

    <!-- 比较差异对话框 -->
    <version-diff-dialog
      v-model:compareDialogVisible="compareDialogVisible"
      v-model:compareData="compareData"
      @close-compare-dialog="closeCompareDialog"
    />
  </div>
</template>

<script setup>
import VersionHeader from './components/VersionHeader.vue'
import VersionTagCreate from './components/VersionTagCreate.vue'
import VersionCommitInfo from './components/VersionCommitInfo.vue'
import VersionDiffDialog from './components/VersionDiffDialog.vue'
import VersionControlFilters from './components/VersionControlFilters.vue'
import TimelineContainer from './components/TimelineContainer.vue'
import CommitsContainer from './components/CommitsContainer.vue'
import VersionBranchCreate from './components/VersionBranchCreate.vue'
import VersionCommitCreate from './components/VersionCommitCreate.vue'

import { useVersionControlData } from './composable/uesVersionControlData'
import { useVersionControlActions } from './composable/useVersionControlAction'
import { useVersionControlUtils } from './composable/useVersionControlUtils'

const emit = defineEmits(['close'])
const close = () => {
  emit('close') // 触发 "close" 事件
}

const {
  currentBranch,
  branches,
  availableBranches,
  searchQuery,
  authorFilter,
  timeFilter,
  sortBy,
  viewMode,
  timelineView,
  selectedCommit,
  dialogVisible,
  compareDialogVisible,
  isLoading,
  currentPage,
  pageSize,
  tagDialogVisible,
  tagTargetCommit,
  compareData,
  commits,
  uniqueAuthors,
  filteredCommits,
  paginatedCommits,
  hasMore,
  branchDialogVisible,
  newBranchName,
  branchTargetCommit,
  commitDialogVisible
} = useVersionControlData()

const {
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
} = useVersionControlActions(null, {
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
  commitDialogVisible
})

const { formatDate, formatTime, getCommitTypePrefix, getCommitTypeClass, getConnectorClass } = useVersionControlUtils({
  currentBranch,
  searchQuery
})
</script>

<style lang="less" scoped>
.version-control-container {
  width: 50vw;
  height: 100%;
  background-color: var(--ti-lowcode-plugin-version-control-bg, #ffffff);
  box-shadow: 6px 0px 3px 0px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  .version-control-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .main-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
  }

  // 动画
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  // 响应式设计
  @media (max-width: 1200px) {
    width: 60vw;

    .main-content {
      .timeline-container {
        width: 280px;
      }
    }
  }

  @media (max-width: 900px) {
    width: 70vw;

    .main-content {
      .timeline-container {
        width: 240px;
      }
    }
  }

  @media (max-width: 768px) {
    width: 90vw;

    .main-content {
      flex-direction: column;

      .timeline-container {
        width: 100%;
        max-height: 200px;
      }
    }

    .filters-container {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .filter-group {
        justify-content: space-between;

        &.stats {
          margin-left: 0;
        }
      }
    }
  }
}
</style>
