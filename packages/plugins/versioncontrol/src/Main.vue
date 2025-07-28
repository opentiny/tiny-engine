<template>
  <div class="version-control-container">
    <version-header
      v-model:currentBranch="currentBranch"
      v-model:searchQuery="searchQuery"
      :branches="branches"
      @close="close"
      @branch-change="onBranchChange"
      @search="onSearch"
      @createTag="createTag"
      @createBranch="createBranch"
    />

    <main class="version-control-content">
      <!-- 筛选器 -->
      <div class="filters-container">
        <div class="filter-group">
          <label>作者:</label>
          <select v-model="authorFilter" @change="applyFilters" class="filter-select">
            <option value="">全部</option>
            <option v-for="author in uniqueAuthors" :key="author" :value="author">
              {{ author }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>时间范围:</label>
          <select v-model="timeFilter" @change="applyFilters" class="filter-select">
            <option value="">全部</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>

        <div class="filter-group">
          <button @click="clearFilters" class="clear-filters-btn">清除筛选</button>
        </div>

        <div class="filter-group stats">
          <span class="stats-text"> 共 {{ filteredCommits.length }} 个提交 | {{ uniqueAuthors.length }} 位贡献者 </span>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 左侧：图形化分支线 -->
        <div class="timeline-container">
          <div class="timeline-header">
            <h3>提交时间线</h3>
            <div class="timeline-controls">
              <button
                @click="timelineView = 'compact'"
                :class="{ active: timelineView === 'compact' }"
                class="view-toggle"
              >
                紧凑
              </button>
              <button
                @click="timelineView = 'detailed'"
                :class="{ active: timelineView === 'detailed' }"
                class="view-toggle"
              >
                详细
              </button>
            </div>
          </div>

          <div class="timeline-content" :class="timelineView">
            <div
              v-for="(commit, index) in filteredCommits"
              :key="commit.hash"
              class="timeline-item"
              :class="{
                selected: selectedCommit?.hash === commit.hash,
                'merge-item': commit.type === 'merge'
              }"
              @click="selectCommit(commit)"
            >
              <!-- 分支线 -->
              <div class="timeline-line">
                <div class="timeline-dot" :class="getCommitTypeClass(commit)">
                  <!-- 合并提交图标 -->
                  <svg v-if="commit.type === 'merge'" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 16l2.879-2.879a3 3 0 0 1 4.242 0L18 16M8 8l2.879 2.879a3 3 0 0 1 4.242 0L18 8" />
                  </svg>
                  <!-- 标签提交图标 -->
                  <svg v-else-if="commit.tags && commit.tags.length > 0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  </svg>
                  <!-- 普通提交点 -->
                  <div v-else class="commit-dot"></div>
                </div>
                <!-- 连接线 -->
                <div
                  v-if="index < filteredCommits.length - 1"
                  class="timeline-connector"
                  :class="getConnectorClass(commit, filteredCommits[index + 1])"
                ></div>
              </div>

              <!-- 提交信息预览 -->
              <div class="timeline-info">
                <div class="commit-hash-mini">{{ commit.hash.slice(0, 7) }}</div>
                <div class="commit-time">{{ formatTime(commit.date) }}</div>
                <div v-if="timelineView === 'detailed'" class="commit-message-mini">
                  {{ commit.message.slice(0, 30) }}{{ commit.message.length > 30 ? '...' : '' }}
                </div>
                <div v-if="commit.tags && commit.tags.length > 0" class="commit-tags-mini">
                  <span v-for="tag in commit.tags.slice(0, 2)" :key="tag" class="tag-mini">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：提交详情列表 -->
        <div class="commits-container">
          <div class="commits-header">
            <h3>提交详情</h3>
            <div class="header-controls">
              <div class="view-options">
                <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }" class="view-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  列表
                </button>
                <button @click="viewMode = 'detailed'" :class="{ active: viewMode === 'detailed' }" class="view-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  详细
                </button>
              </div>

              <div class="sort-options">
                <select v-model="sortBy" @change="applySorting" class="sort-select">
                  <option value="date-desc">时间 ↓</option>
                  <option value="date-asc">时间 ↑</option>
                  <option value="author">作者</option>
                  <option value="message">消息</option>
                </select>
              </div>
            </div>
          </div>

          <div class="commits-list" :class="viewMode">
            <div
              v-for="commit in paginatedCommits"
              :key="commit.hash"
              class="commit-item"
              :class="{
                selected: selectedCommit?.hash === commit.hash,
                'merge-commit': commit.type === 'merge'
              }"
              @click="selectCommit(commit)"
            >
              <!-- 提交头部信息 -->
              <div class="commit-header">
                <div class="commit-meta">
                  <img :src="commit.avatar" alt="avatar" class="commit-avatar" />
                  <div class="commit-author-info">
                    <div class="commit-author">{{ commit.author }}</div>
                    <div class="commit-date">{{ formatDate(commit.date) }}</div>
                  </div>
                  <div v-if="commit.type === 'merge'" class="merge-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 16l2.879-2.879a3 3 0 0 1 4.242 0L18 16M8 8l2.879 2.879a3 3 0 0 1 4.242 0L18 8" />
                    </svg>
                    合并
                  </div>
                </div>

                <div class="commit-actions">
                  <span class="commit-hash">{{ commit.hash.slice(0, 7) }}</span>
                  <div class="action-buttons">
                    <button @click.stop="showCommitDetails(commit)" class="action-btn small" title="查看详情">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                      </svg>
                    </button>
                    <button @click.stop="compareCommit(commit)" class="action-btn small" title="比较差异">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 20V10M6 20V4m6 16v-8"></path>
                      </svg>
                    </button>
                    <button @click.stop="revertToCommit(commit)" class="action-btn small danger" title="回滚">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 7v6h6M21 17v-6h-6"></path>
                        <path d="M21 3l-9 9-9-9"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 提交消息 -->
              <div class="commit-message">
                <span class="commit-type-prefix" :class="commit.type">
                  {{ getCommitTypePrefix(commit.type) }}
                </span>
                {{ commit.message }}
              </div>

              <!-- 标签和分支信息 -->
              <div v-if="commit.tags?.length || commit.branches?.length" class="commit-labels">
                <span v-for="tag in commit.tags" :key="tag" class="commit-tag">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  </svg>
                  {{ tag }}
                </span>
                <span v-for="branch in commit.branches" :key="branch" class="commit-branch">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="6" y1="3" x2="6" y2="15"></line>
                    <circle cx="18" cy="6" r="3"></circle>
                    <circle cx="6" cy="18" r="3"></circle>
                  </svg>
                  {{ branch }}
                </span>
              </div>

              <!-- 详细视图额外信息 -->
              <div v-if="viewMode === 'detailed'" class="commit-details">
                <div class="commit-stats">
                  <span class="stat-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    <span class="stat-value">{{ commit.filesChanged || 0 }} 文件</span>
                  </span>
                  <span class="stat-item additions">
                    <span class="stat-value">+{{ commit.additions || 0 }}</span>
                  </span>
                  <span class="stat-item deletions">
                    <span class="stat-value">-{{ commit.deletions || 0 }}</span>
                  </span>
                </div>

                <div v-if="commit.changedFiles?.length" class="commit-files">
                  <div class="files-header">变更文件:</div>
                  <div class="files-list">
                    <div v-for="file in commit.changedFiles.slice(0, 3)" :key="file" class="changed-file">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                      </svg>
                      {{ file }}
                    </div>
                    <div v-if="commit.changedFiles.length > 3" class="more-files">
                      +{{ commit.changedFiles.length - 3 }} 个文件...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredCommits.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3>未找到匹配的提交</h3>
              <p>尝试调整搜索条件或筛选器</p>
              <button @click="clearFilters" class="clear-btn">清除所有筛选</button>
            </div>
          </div>

          <!-- 分页控制 -->
          <div v-if="filteredCommits.length > 0" class="pagination-container">
            <button @click="loadMore" :disabled="isLoading || !hasMore" class="load-more-btn">
              <svg v-if="isLoading" class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 12a9 9 0 11-6.219-8.56"></path>
              </svg>
              <span v-if="isLoading">加载中...</span>
              <span v-else-if="hasMore">加载更多 ({{ filteredCommits.length - paginatedCommits.length }} 个)</span>
              <span v-else>已加载全部</span>
            </button>

            <div class="pagination-info">
              显示 {{ Math.min(currentPage * pageSize, filteredCommits.length) }} / {{ filteredCommits.length }} 个提交
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 提交详情对话框 -->
    <version-commit-info
      v-model:dialogVisible="dialogVisible"
      v-model:selectedCommit="selectedCommit"
      @close-dialog="closeDialog"
      @get-commit-type-text="getCommitTypeText"
      @compare-with-current="compareWithCurrent"
      @create-branch-from-commit="createBranchFromCommit"
      @revert-to-commit="revertToCommit"
    />

    <!-- 标签创建对话框 -->
    <version-tag-create
      v-model:tagDialogVisible="tagDialogVisible"
      v-model:newTagName="newTagName"
      v-model:newTagDescription="newTagDescription"
      v-model:tagTargetCommit="tagTargetCommit"
      :commits="commits"
      @close-tag-dialog="closeTagDialog"
      @confirm-create-tag="confirmCreateTag"
    />

    <!-- 比较差异对话框 -->
    <version-diff-dialog
      v-model:compareDialogVisible="compareDialogVisible"
      v-model:compareData="compareData"
      @close-compare-dialog="closeCompareDialog"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useHelp } from '@opentiny/tiny-engine-meta-register'
import VersionHeader from './components/VersionHeader.vue'
import VersionTagCreate from './components/VersionTagCreate.vue'
import VersionCommitInfo from './components/VersionCommitInfo.vue'
import VersionDiffDialog from './components/VersionDiffDialog.vue'

export default {
  components: {
    VersionHeader,
    VersionTagCreate,
    VersionCommitInfo,
    VersionDiffDialog
  },
  emits: ['close'],
  setup(props, { emit }) {
    const docsUrl = useHelp().getDocsUrl('script')

    // 响应式数据
    const currentBranch = ref('main')
    const branches = ref(['main', 'develop', 'feature/new-ui', 'hotfix/bug-fix', 'release/v2.1'])
    const searchQuery = ref('')
    const authorFilter = ref('')
    const timeFilter = ref('')
    const sortBy = ref('date-desc')
    const viewMode = ref('list')
    const timelineView = ref('compact')
    const selectedCommit = ref(null)
    const dialogVisible = ref(false)
    const compareDialogVisible = ref(false)
    const isLoading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(20)

    // 标签创建相关
    const tagDialogVisible = ref(false)
    const newTagName = ref('')
    const newTagDescription = ref('')
    const tagTargetCommit = ref('')

    // 比较数据
    const compareData = ref({
      base: null,
      target: null,
      filesChanged: 0,
      additions: 0,
      deletions: 0,
      changedFiles: []
    })

    // 模拟提交数据
    const commits = ref([
      {
        hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
        author: 'Alice Johnson',
        date: '2025-07-10 14:30:25',
        message: 'feat: 添加用户认证功能和权限管理系统',
        avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
        type: 'feature',
        tags: ['v2.1.0'],
        branches: ['main'],
        filesChanged: 8,
        additions: 156,
        deletions: 23,
        changedFiles: [
          'src/auth/login.js',
          'src/auth/register.js',
          'src/components/AuthForm.vue',
          'tests/auth.test.js',
          'src/middleware/auth.js',
          'src/utils/token.js',
          'docs/auth.md',
          'package.json'
        ]
      },
      {
        hash: 'd4e5f6g7h8i9012345678901234567890123abcd',
        author: 'Bob Smith',
        date: '2025-07-10 11:45:10',
        message: 'fix: 修复登录页面样式问题和响应式布局',
        avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
        type: 'bugfix',
        tags: [],
        branches: ['main', 'develop'],
        filesChanged: 3,
        additions: 12,
        deletions: 8,
        changedFiles: ['src/styles/login.css', 'src/components/LoginForm.vue', 'src/styles/responsive.css']
      },
      {
        hash: 'g7h8i9j0k1l2345678901234567890123456abcd',
        author: 'Charlie Brown',
        date: '2025-07-09 16:20:33',
        message: 'merge: 合并 feature/dashboard 分支到主分支',
        avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
        type: 'merge',
        tags: [],
        branches: ['main'],
        filesChanged: 15,
        additions: 234,
        deletions: 67,
        changedFiles: [
          'src/dashboard/Dashboard.vue',
          'src/dashboard/widgets/Chart.vue',
          'src/dashboard/widgets/Stats.vue',
          'src/api/dashboard.js',
          'src/store/dashboard.js'
        ]
      },
      {
        hash: 'j0k1l2m3n4o5678901234567890123456789abcd',
        author: 'Diana Prince',
        date: '2025-07-09 09:15:42',
        message: 'docs: 更新API文档和开发指南',
        avatar: 'https://avatars.githubusercontent.com/u/4?v=4',
        type: 'docs',
        tags: [],
        branches: ['main'],
        filesChanged: 5,
        additions: 89,
        deletions: 12,
        changedFiles: ['docs/api.md', 'README.md', 'docs/getting-started.md', 'docs/deployment.md', 'CHANGELOG.md']
      },
      {
        hash: 'm3n4o5p6q7r8901234567890123456789012abcd',
        author: 'Eve Wilson',
        date: '2025-07-08 15:30:18',
        message: 'refactor: 重构数据库连接模块和查询优化',
        avatar: 'https://avatars.githubusercontent.com/u/5?v=4',
        type: 'refactor',
        tags: ['v2.0.1'],
        branches: ['main'],
        filesChanged: 12,
        additions: 178,
        deletions: 145,
        changedFiles: [
          'src/database/connection.js',
          'src/database/models/User.js',
          'src/database/models/Post.js',
          'src/config/database.js',
          'src/utils/query.js'
        ]
      },
      {
        hash: 'p6q7r8s9t0u1234567890123456789012345abcd',
        author: 'Frank Miller',
        date: '2025-07-08 10:45:55',
        message: 'feat: 实现实时通知系统',
        avatar: 'https://avatars.githubusercontent.com/u/6?v=4',
        type: 'feature',
        tags: [],
        branches: ['main', 'develop'],
        filesChanged: 6,
        additions: 98,
        deletions: 5,
        changedFiles: [
          'src/components/Notification.vue',
          'src/services/websocket.js',
          'src/store/notifications.js',
          'src/utils/notification.js'
        ]
      },
      {
        hash: 's9t0u1v2w3x4567890123456789012345678abcd',
        author: 'Grace Lee',
        date: '2025-07-07 14:22:11',
        message: 'style: 统一代码格式和ESLint规则',
        avatar: 'https://avatars.githubusercontent.com/u/7?v=4',
        type: 'style',
        tags: [],
        branches: ['main'],
        filesChanged: 20,
        additions: 45,
        deletions: 38,
        changedFiles: ['.eslintrc.js', '.prettierrc', 'src/components/*.vue', 'src/utils/*.js']
      },
      {
        hash: 'v2w3x4y5z6a7890123456789012345678901abcd',
        author: 'Henry Davis',
        date: '2025-07-07 09:33:44',
        message: 'test: 添加单元测试和集成测试',
        avatar: 'https://avatars.githubusercontent.com/u/8?v=4',
        type: 'test',
        tags: [],
        branches: ['main'],
        filesChanged: 8,
        additions: 156,
        deletions: 0,
        changedFiles: [
          'tests/unit/auth.test.js',
          'tests/unit/dashboard.test.js',
          'tests/integration/api.test.js',
          'jest.config.js'
        ]
      }
    ])

    // 计算属性
    const uniqueAuthors = computed(() => {
      return [...new Set(commits.value.map((commit) => commit.author))]
    })

    const filteredCommits = computed(() => {
      let filtered = [...commits.value]

      // 搜索筛选
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          (commit) =>
            commit.message.toLowerCase().includes(query) ||
            commit.author.toLowerCase().includes(query) ||
            commit.hash.toLowerCase().includes(query)
        )
      }

      // 作者筛选
      if (authorFilter.value) {
        filtered = filtered.filter((commit) => commit.author === authorFilter.value)
      }

      // 时间筛选
      if (timeFilter.value) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        filtered = filtered.filter((commit) => {
          const commitDate = new Date(commit.date)

          switch (timeFilter.value) {
            case 'today':
              return commitDate >= today
            case 'week': {
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              return commitDate >= weekAgo
            }
            case 'month': {
              const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
              return commitDate >= monthAgo
            }
            default:
              return true
          }
        })
      }

      // 排序
      filtered.sort((a, b) => {
        switch (sortBy.value) {
          case 'date-desc': {
            return Date.parse(b.date) - Date.parse(a.date)
          }
          case 'date-asc': {
            return Date.parse(a.date) - Date.parse(b.date)
          }
          case 'author': {
            return a.author.localeCompare(b.author)
          }
          case 'message': {
            return a.message.localeCompare(b.message)
          }
          default:
            return 0
        }
      })

      return filtered
    })

    const paginatedCommits = computed(() => {
      return filteredCommits.value.slice(0, currentPage.value * pageSize.value)
    })

    const hasMore = computed(() => {
      return filteredCommits.value.length > currentPage.value * pageSize.value
    })

    // 方法
    const close = () => {
      emit('close')
    }

    const onBranchChange = () => {
      // console.log('切换到分支:', currentBranch.value)
      // 这里可以实现分支切换逻辑
    }

    const onSearch = () => {
      // 搜索逻辑已在计算属性中处理
      currentPage.value = 1 // 重置分页
    }

    const applyFilters = () => {
      // 筛选逻辑已在计算属性中处理
      currentPage.value = 1 // 重置分页
    }

    const applySorting = () => {
      // 排序逻辑已在计算属性中处理
      currentPage.value = 1 // 重置分页
    }

    const clearFilters = () => {
      searchQuery.value = ''
      authorFilter.value = ''
      timeFilter.value = ''
      sortBy.value = 'date-desc'
      currentPage.value = 1
    }

    const selectCommit = (commit) => {
      selectedCommit.value = commit
    }

    const showCommitDetails = (commit) => {
      selectedCommit.value = commit
      dialogVisible.value = true
    }

    const closeDialog = () => {
      dialogVisible.value = false
    }

    const compareCommit = (commit) => {
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
    }

    const revertToCommit = (commit) => {
      if (confirm(`确定要回滚到提交 ${commit.hash.slice(0, 7)} 吗？\n\n这将撤销此提交之后的所有更改。`)) {
        // 这里实现回滚逻辑
        alert('回滚操作已提交，请等待处理完成。')
      }
    }

    const compareWithCurrent = () => {
      compareCommit(selectedCommit.value)
      closeDialog()
    }

    const createBranchFromCommit = () => {
      const branchName = prompt('请输入新分支名称:', `feature/from-${selectedCommit.value.hash.slice(0, 7)}`)
      if (branchName && branchName.trim()) {
        branches.value.push(branchName.trim())
        alert(`分支 "${branchName}" 创建成功！`)
        closeDialog()
      }
    }

    const createTag = () => {
      tagDialogVisible.value = true
    }

    const closeTagDialog = () => {
      tagDialogVisible.value = false
      newTagName.value = ''
      newTagDescription.value = ''
      tagTargetCommit.value = ''
    }

    const confirmCreateTag = () => {
      if (!newTagName.value.trim()) {
        alert('请输入标签名称')
        return
      }

      const targetHash = tagTargetCommit.value || commits.value[0].hash
      const targetCommit = commits.value.find((c) => c.hash === targetHash)

      if (targetCommit) {
        if (!targetCommit.tags) {
          targetCommit.tags = []
        }
        targetCommit.tags.push(newTagName.value.trim())
      }

      // console.log('创建标签:', {
      //   name: newTagName.value.trim(),
      //   description: newTagDescription.value,
      //   commit: targetHash
      // })

      alert(`标签 "${newTagName.value.trim()}" 创建成功！`)
      closeTagDialog()
    }

    const createBranch = () => {
      const branchName = prompt('请输入新分支名称:', 'feature/new-feature')
      if (branchName && branchName.trim()) {
        // console.log('创建分支:', branchName.trim())
        branches.value.push(branchName.trim())
        alert(`分支 "${branchName.trim()}" 创建成功！`)
      }
    }

    const loadMore = () => {
      if (hasMore.value && !isLoading.value) {
        isLoading.value = true
        setTimeout(() => {
          currentPage.value++
          isLoading.value = false
        }, 500)
      }
    }

    const getCommitTypeClass = (commit) => {
      return {
        'merge-commit': commit.type === 'merge',
        'tag-commit': commit.tags && commit.tags.length > 0,
        'feature-commit': commit.type === 'feature',
        'bugfix-commit': commit.type === 'bugfix',
        'docs-commit': commit.type === 'docs',
        'refactor-commit': commit.type === 'refactor',
        'style-commit': commit.type === 'style',
        'test-commit': commit.type === 'test'
      }
    }

    const getConnectorClass = (currentCommit, nextCommit) => {
      if (!nextCommit) return ''

      if (currentCommit.type === 'merge' || nextCommit.type === 'merge') {
        return 'merge-connector'
      }

      return 'normal-connector'
    }

    const getCommitTypePrefix = (type) => {
      const prefixes = {
        feature: 'feat:',
        bugfix: 'fix:',
        docs: 'docs:',
        style: 'style:',
        refactor: 'refactor:',
        test: 'test:',
        merge: 'merge:'
      }
      return prefixes[type] || ''
    }

    const getCommitTypeText = (type) => {
      const texts = {
        feature: '新功能',
        bugfix: '修复',
        docs: '文档',
        style: '样式',
        refactor: '重构',
        test: '测试',
        merge: '合并'
      }
      return texts[type] || '其他'
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const formatTime = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) {
        // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) {
        // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) {
        // 1天内
        return `${Math.floor(diff / 3600000)}小时前`
      } else if (diff < 604800000) {
        // 1周内
        return `${Math.floor(diff / 86400000)}天前`
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit'
        })
      }
    }

    // 监听选中的提交变化
    watch(selectedCommit, (newCommit) => {
      if (newCommit) {
        // console.log('选中提交:', newCommit.hash.slice(0, 7), newCommit.message)
      }
    })

    return {
      docsUrl,
      currentBranch,
      branches,
      searchQuery,
      authorFilter,
      timeFilter,
      sortBy,
      viewMode,
      timelineView,
      selectedCommit,
      dialogVisible,
      tagDialogVisible,
      compareDialogVisible,
      isLoading,
      currentPage,
      pageSize,
      newTagName,
      newTagDescription,
      tagTargetCommit,
      compareData,
      commits,
      uniqueAuthors,
      filteredCommits,
      paginatedCommits,
      hasMore,
      close,
      onBranchChange,
      onSearch,
      applyFilters,
      applySorting,
      clearFilters,
      selectCommit,
      showCommitDetails,
      closeDialog,
      compareCommit,
      closeCompareDialog,
      revertToCommit,
      compareWithCurrent,
      createBranchFromCommit,
      createTag,
      closeTagDialog,
      confirmCreateTag,
      createBranch,
      loadMore,
      getCommitTypeClass,
      getConnectorClass,
      getCommitTypePrefix,
      getCommitTypeText,
      formatDate,
      formatTime
    }
  }
}
</script>

<style lang="less">
@import './styles/main.less';
</style>
