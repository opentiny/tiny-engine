import { ref, computed, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useUtils } from './useUtils'
import { versionManager } from '../js'

export interface DisplayCommit {
  id: string
  hash: string
  author: string
  date: string
  message: string
  avatar: string
  type: string
  branches: string[]
  tags?: string[]
  filesChanged?: number
  additions?: number
  deletions?: number
  changedFiles?: string[]
}

export interface CompareData {
  base: DisplayCommit | null
  target: DisplayCommit | null
  filesChanged: number
  additions: number
  deletions: number
  changedFiles: any[]
}

export function useVersionControlData() {
  const { transformCommit } = useUtils()
  // 基础数据
  const currentBranch: Ref<string> = ref('all')
  const branches: Ref<string[]> = ref(['all'])
  const availableBranches: Ref<any> = ref([])
  const selectedCommit: Ref<DisplayCommit | null> = ref(null)
  const isLoading: Ref<boolean> = ref(false)
  const currentPage: Ref<number> = ref(1)
  const viewMode: Ref<string> = ref('list')
  const timelineView: Ref<string> = ref('compact')
  const pageSize: Ref<number> = ref(20)

  // 过滤器数据
  const searchQuery: Ref<string> = ref('')
  const authorFilter: Ref<string> = ref('')
  const timeFilter: Ref<string> = ref('')
  const sortBy: Ref<string> = ref('date-desc')

  // 业务弹窗
  const dialogVisible: Ref<boolean> = ref(false)
  const compareDialogVisible: Ref<boolean> = ref(false)

  // 标签创建相关
  const tagDialogVisible: Ref<boolean> = ref(false)
  const tagTargetCommit: Ref<string> = ref('')

  // 分支创建相关
  const branchDialogVisible: Ref<boolean> = ref(false)
  const newBranchName: Ref<string> = ref('')
  const branchTargetCommit: Ref<string> = ref('')

  // 提交创建相关
  const commitDialogVisible: Ref<boolean> = ref(false)

  // 比较数据
  const compareData: Ref<CompareData> = ref({
    base: null,
    target: null,
    filesChanged: 0,
    additions: 0,
    deletions: 0,
    changedFiles: []
  })

  // 模拟提交数据
  const commits: Ref<DisplayCommit[]> = ref([])

  // 计算属性
  const uniqueAuthors = computed<string[]>(() => {
    const authors = new Set(commits.value.map((commit) => commit.author))
    return Array.from(authors).sort()
  })

  // 过滤后的commit，用于检索
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

    // 分支筛选
    if (currentBranch.value && currentBranch.value !== 'all') {
      filtered = filtered.filter((commit) => commit.branches?.includes(currentBranch.value))
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

  const paginatedCommits = computed<DisplayCommit[]>(() => {
    const start = 0
    const end = currentPage.value * pageSize.value
    return filteredCommits.value.slice(start, end)
  })

  const hasMore = computed<boolean>(() => {
    return paginatedCommits.value.length < filteredCommits.value.length
  })

  onMounted(async () => {
    try {
      const rawCommits = await versionManager.commitRepository.findAll()
      commits.value = await Promise.all(rawCommits.map(transformCommit))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('转换 commits 出错:', error)
    }
  })

  return {
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
  }
}

// [
//     {
//       id: 'commit_a1b2c3',
//       hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
//       author: 'Alice Johnson',
//       date: '2025-07-10 14:30:25',
//       message: 'feat: 添加用户认证功能和权限管理系统',
//       avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
//       type: 'feature',
//       tags: ['v2.1.0'],
//       branches: ['main'],
//       filesChanged: 8,
//       additions: 156,
//       deletions: 23,
//       changedFiles: [
//         'src/auth/login.js',
//         'src/auth/register.js',
//         'src/components/AuthForm.vue',
//         'tests/auth.test.js',
//         'src/middleware/auth.js',
//         'src/utils/token.js',
//         'docs/auth.md',
//         'package.json'
//       ]
//     },
//     {
//       id: 'commit_d4e5f6',
//       hash: 'd4e5f6g7h8i9012345678901234567890123abcd',
//       author: 'Bob Smith',
//       date: '2025-07-09 18:00:00',
//       message: 'fix: 修复用户登录时出现的偶发性崩溃问题',
//       avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
//       type: 'bugfix',
//       tags: [],
//       branches: ['main', 'hotfix/bug-fix'],
//       filesChanged: 2,
//       additions: 5,
//       deletions: 3,
//       changedFiles: ['src/auth/login.js', 'src/auth/auth.css']
//     },
//     {
//       id: 'commit_1691832200000_cdef34567',
//       hash: 'e5f6g7h8i9j0123456789012345678901234bcde',
//       author: 'Charlie Brown',
//       date: '2025-07-08 10:15:00',
//       message: 'docs: 更新项目部署文档和API接口说明',
//       avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
//       type: 'docs',
//       tags: [],
//       branches: ['develop'],
//       filesChanged: 3,
//       additions: 45,
//       deletions: 10,
//       changedFiles: ['docs/deployment.md', 'docs/api.md', 'README.md']
//     },
//   ]
