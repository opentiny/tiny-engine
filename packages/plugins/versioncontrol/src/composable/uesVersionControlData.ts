import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface Commit {
  hash: string
  author: string
  date: string
  message: string
  avatar: string
  type: string
  tags?: string[]
  branches?: string[]
  filesChanged?: number
  additions?: number
  deletions?: number
  changedFiles?: string[]
}

export interface CompareData {
  base: Commit | null
  target: Commit | null
  filesChanged: number
  additions: number
  deletions: number
  changedFiles: any[]
}

export function useVersionControlData() {
  // 基础数据
  const currentBranch: Ref<string> = ref('all')
  const branches: Ref<string[]> = ref(['all', 'main', 'develop', 'feature/new-ui', 'hotfix/bug-fix', 'release/v2.1'])
  const selectedCommit: Ref<Commit | null> = ref(null)
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
  const newTagName: Ref<string> = ref('')
  const newTagDescription: Ref<string> = ref('')
  const tagTargetCommit: Ref<string> = ref('')

  // 分支创建相关
  const branchDialogVisible: Ref<boolean> = ref(false)
  const newBranchName: Ref<string> = ref('')
  const branchTargetCommit: Ref<string> = ref('')

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
  const commits: Ref<Commit[]> = ref([
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
      date: '2025-07-09 18:00:00',
      message: 'fix: 修复用户登录时出现的偶发性崩溃问题',
      avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
      type: 'bugfix',
      tags: [],
      branches: ['main', 'hotfix/bug-fix'],
      filesChanged: 2,
      additions: 5,
      deletions: 3,
      changedFiles: ['src/auth/login.js', 'src/auth/auth.css']
    },
    {
      hash: 'e5f6g7h8i9j0123456789012345678901234bcde',
      author: 'Charlie Brown',
      date: '2025-07-08 10:15:00',
      message: 'docs: 更新项目部署文档和API接口说明',
      avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
      type: 'docs',
      tags: [],
      branches: ['develop'],
      filesChanged: 3,
      additions: 45,
      deletions: 10,
      changedFiles: ['docs/deployment.md', 'docs/api.md', 'README.md']
    },
    {
      hash: 'f6g7h8i9j0k1234567890123456789012345cdef',
      author: 'Alice Johnson',
      date: '2025-07-07 16:45:00',
      message: 'feat: 实现多语言支持，增加英文和日文翻译',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      type: 'feature',
      tags: [],
      branches: ['develop'],
      filesChanged: 15,
      additions: 200,
      deletions: 15,
      changedFiles: [
        'src/i18n/en.js',
        'src/i18n/jp.js',
        'src/i18n/index.js',
        'src/components/Navbar.vue',
        'src/pages/HomePage.vue',
        'src/pages/AboutPage.vue',
        'src/pages/ContactPage.vue',
        'src/utils/i18n.js',
        'public/index.html',
        'package.json',
        'src/assets/styles/main.css',
        'src/assets/images/logo.png',
        'src/assets/fonts/Roboto-Regular.ttf',
        'src/assets/icons/home.svg',
        'src/assets/icons/about.svg'
      ]
    },
    {
      hash: 'g7h8i9j0k1l2345678901234567890123456defg',
      author: 'David Lee',
      date: '2025-07-06 09:00:00',
      message: 'merge: 合并 feature/new-ui 到 develop',
      avatar: 'https://avatars.githubusercontent.com/u/4?v=4',
      type: 'merge',
      tags: [],
      branches: ['develop'],
      filesChanged: 5,
      additions: 50,
      deletions: 20,
      changedFiles: [
        'src/components/NewUIComponent.vue',
        'src/views/NewUIPage.vue',
        'src/assets/styles/new-ui.css',
        'src/router/index.js',
        'package.json'
      ]
    },
    {
      hash: 'h8i9j0k1l2m3456789012345678901234567efgh',
      author: 'Eve Davis',
      date: '2025-07-05 11:30:00',
      message: 'perf: 优化图片加载性能，引入懒加载和WebP格式支持',
      avatar: 'https://avatars.githubusercontent.com/u/5?v=4',
      type: 'perf',
      tags: [],
      branches: ['develop'],
      filesChanged: 7,
      additions: 30,
      deletions: 10,
      changedFiles: [
        'src/utils/imageLoader.js',
        'src/components/ImageGallery.vue',
        'src/views/ProductDetail.vue',
        'public/index.html',
        'package.json',
        'src/assets/images/product1.jpg',
        'src/assets/images/product1.webp'
      ]
    },
    {
      hash: 'i9j0k1l2m3n4567890123456789012345678fghi',
      author: 'Frank White',
      date: '2025-07-04 14:00:00',
      message: 'refactor: 重构数据请求模块，使用 async/await 替代回调函数',
      avatar: 'https://avatars.githubusercontent.com/u/6?v=4',
      type: 'refactor',
      tags: [],
      branches: ['develop'],
      filesChanged: 10,
      additions: 80,
      deletions: 60,
      changedFiles: [
        'src/api/index.js',
        'src/api/user.js',
        'src/api/product.js',
        'src/store/modules/user.js',
        'src/store/modules/product.js',
        'src/views/UserList.vue',
        'src/views/ProductList.vue',
        'tests/api.test.js',
        'package.json',
        'src/utils/helpers.js'
      ]
    },
    {
      hash: 'j0k1l2m3n4o5678901234567890123456789ghij',
      author: 'Grace Taylor',
      date: '2025-07-03 09:45:00',
      message: 'chore: 更新依赖包版本并清理不使用的文件',
      avatar: 'https://avatars.githubusercontent.com/u/7?v=4',
      type: 'chore',
      tags: [],
      branches: ['develop'],
      filesChanged: 4,
      additions: 10,
      deletions: 5,
      changedFiles: ['package.json', 'package-lock.json', '.gitignore', 'src/temp/old-file.js']
    },
    {
      hash: 'k1l2m3n4o5p6789012345678901234567890hijk',
      author: 'Henry Wilson',
      date: '2025-07-02 17:00:00',
      message: 'test: 增加单元测试覆盖率，修复测试用例中的错误',
      avatar: 'https://avatars.githubusercontent.com/u/8?v=4',
      type: 'test',
      tags: [],
      branches: ['develop'],
      filesChanged: 6,
      additions: 70,
      deletions: 15,
      changedFiles: [
        'tests/unit/example.test.js',
        'tests/unit/auth.test.js',
        'tests/unit/utils.test.js',
        'src/utils/helpers.js',
        'jest.config.js',
        'package.json'
      ]
    },
    {
      hash: 'l2m3n4o5p6q7890123456789012345678901ijkl',
      author: 'Ivy Moore',
      date: '2025-07-01 10:00:00',
      message: 'build: 配置CI/CD流水线，实现自动化部署',
      avatar: 'https://avatars.githubusercontent.com/u/9?v=4',
      type: 'build',
      tags: [],
      branches: ['develop'],
      filesChanged: 3,
      additions: 25,
      deletions: 5,
      changedFiles: ['.gitlab-ci.yml', 'Dockerfile', 'package.json']
    },
    {
      hash: 'm3n4o5p6q7r8901234567890123456789012jklm',
      author: 'Jack King',
      date: '2025-06-30 15:30:00',
      message: 'ci: 优化CI构建时间，并行运行测试',
      avatar: 'https://avatars.githubusercontent.com/u/10?v=4',
      type: 'ci',
      tags: [],
      branches: ['develop'],
      filesChanged: 2,
      additions: 10,
      deletions: 3,
      changedFiles: ['.gitlab-ci.yml', 'package.json']
    },
    {
      hash: 'n4o5p6q7r8s9012345678901234567890123klmn',
      author: 'Karen Green',
      date: '2025-06-29 11:00:00',
      message: 'revert: 撤销上一个提交，修复引入的回归问题',
      avatar: 'https://avatars.githubusercontent.com/u/11?v=4',
      type: 'revert',
      tags: [],
      branches: ['develop'],
      filesChanged: 1,
      additions: 0,
      deletions: 10,
      changedFiles: ['src/utils/helpers.js']
    },
    {
      hash: 'o5p6q7r8s9t0123456789012345678901234lmno',
      author: 'Liam Hall',
      date: '2025-06-28 09:00:00',
      message: 'style: 统一代码风格，修复ESLint警告',
      avatar: 'https://avatars.githubusercontent.com/u/12?v=4',
      type: 'style',
      tags: [],
      branches: ['develop'],
      filesChanged: 20,
      additions: 50,
      deletions: 50,
      changedFiles: [
        'src/components/Button.vue',
        'src/components/Input.vue',
        'src/views/Dashboard.vue',
        'src/utils/formatters.js',
        '.eslintrc.js',
        'package.json',
        'src/assets/styles/variables.css',
        'src/assets/styles/mixins.css',
        'src/assets/styles/base.css',
        'src/assets/styles/components.css',
        'src/assets/styles/pages.css',
        'src/assets/styles/utilities.css',
        'src/assets/images/background.jpg',
        'src/assets/images/icon.png',
        'src/assets/fonts/OpenSans-Regular.ttf',
        'src/assets/icons/dashboard.svg',
        'src/assets/icons/settings.svg',
        'src/assets/icons/profile.svg',
        'src/assets/icons/notifications.svg',
        'src/assets/icons/messages.svg'
      ]
    },
    {
      hash: 'p6q7r8s9t0u1234567890123456789012345mnop',
      author: 'Mia Clark',
      date: '2025-06-27 16:00:00',
      message: 'feat: 添加用户个人资料编辑功能',
      avatar: 'https://avatars.githubusercontent.com/u/13?v=4',
      type: 'feature',
      tags: [],
      branches: ['develop'],
      filesChanged: 5,
      additions: 120,
      deletions: 10,
      changedFiles: [
        'src/views/ProfileEdit.vue',
        'src/components/ProfileForm.vue',
        'src/store/modules/profile.js',
        'src/api/profile.js',
        'src/router/index.js'
      ]
    },
    {
      hash: 'q7r8s9t0u1v2345678901234567890123456nopq',
      author: 'Noah Lewis',
      date: '2025-06-26 10:30:00',
      message: 'fix: 修复移动端布局问题，优化响应式设计',
      avatar: 'https://avatars.githubusercontent.com/u/14?v=4',
      type: 'bugfix',
      tags: [],
      branches: ['develop'],
      filesChanged: 8,
      additions: 40,
      deletions: 25,
      changedFiles: [
        'src/assets/styles/responsive.css',
        'src/components/Header.vue',
        'src/components/Footer.vue',
        'src/views/HomePage.vue',
        'src/views/AboutPage.vue',
        'src/views/ContactPage.vue',
        'public/index.html',
        'src/assets/styles/main.css'
      ]
    },
    {
      hash: 'r8s9t0u1v2w3456789012345678901234567opqr',
      author: 'Olivia Scott',
      date: '2025-06-25 14:00:00',
      message: 'docs: 编写新功能的用户手册和常见问题解答',
      avatar: 'https://avatars.githubusercontent.com/u/15?v=4',
      type: 'docs',
      tags: [],
      branches: ['develop'],
      filesChanged: 2,
      additions: 60,
      deletions: 5,
      changedFiles: ['docs/user-manual.md', 'docs/faq.md']
    },
    {
      hash: 's9t0u1v2w3x4567890123456789012345678pqrs',
      author: 'Alice Johnson',
      date: '2025-06-24 09:00:00',
      message: 'feat: 集成第三方支付网关，支持多种支付方式',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      type: 'feature',
      tags: [],
      branches: ['develop'],
      filesChanged: 10,
      additions: 180,
      deletions: 20,
      changedFiles: [
        'src/payment/stripe.js',
        'src/payment/paypal.js',
        'src/payment/index.js',
        'src/components/PaymentForm.vue',
        'src/views/CheckoutPage.vue',
        'src/store/modules/cart.js',
        'src/api/order.js',
        'tests/payment.test.js',
        'package.json',
        'src/utils/constants.js'
      ]
    },
    {
      hash: 't0u1v2w3x4y5678901234567890123456789qrst',
      author: 'Bob Smith',
      date: '2025-06-23 11:00:00',
      message: 'fix: 修复数据加载时的竞态条件问题',
      avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
      type: 'bugfix',
      tags: [],
      branches: ['develop'],
      filesChanged: 3,
      additions: 10,
      deletions: 8,
      changedFiles: ['src/utils/dataFetcher.js', 'src/views/DataDisplay.vue', 'tests/data.test.js']
    },
    {
      hash: 'u1v2w3x4y5z6789012345678901234567890rstu',
      author: 'Charlie Brown',
      date: '2025-06-22 15:00:00',
      message: 'refactor: 优化组件通信，使用 provide/inject 替代 props/emit 链',
      avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
      type: 'refactor',
      tags: [],
      branches: ['develop'],
      filesChanged: 7,
      additions: 30,
      deletions: 20,
      changedFiles: [
        'src/components/ParentComponent.vue',
        'src/components/ChildComponent.vue',
        'src/components/GrandchildComponent.vue',
        'src/utils/context.js',
        'src/views/ComplexView.vue',
        'tests/component.test.js',
        'package.json'
      ]
    },
    {
      hash: 'v2w3x4y5z6a7890123456789012345678901stuv',
      author: 'David Lee',
      date: '2025-06-21 09:30:00',
      message: 'chore: 升级Vue版本到3.x，适配Composition API',
      avatar: 'https://avatars.githubusercontent.com/u/4?v=4',
      type: 'chore',
      tags: [],
      branches: ['develop'],
      filesChanged: 12,
      additions: 150,
      deletions: 100,
      changedFiles: [
        'package.json',
        'src/main.js',
        'src/App.vue',
        'src/components/OldComponent.vue',
        'src/components/NewComponent.vue',
        'src/views/Home.vue',
        'src/router/index.js',
        'src/store/index.js',
        'src/utils/migration.js',
        'public/index.html',
        'babel.config.js',
        'vue.config.js'
      ]
    }
  ])

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

  const paginatedCommits = computed<Commit[]>(() => {
    const start = 0
    const end = currentPage.value * pageSize.value
    return filteredCommits.value.slice(start, end)
  })

  const hasMore = computed<boolean>(() => {
    return paginatedCommits.value.length < filteredCommits.value.length
  })

  return {
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
    compareDialogVisible,
    isLoading,
    currentPage,
    pageSize,
    tagDialogVisible,
    newTagName,
    newTagDescription,
    tagTargetCommit,
    compareData,
    commits,
    uniqueAuthors,
    filteredCommits,
    paginatedCommits,
    hasMore,
    branchDialogVisible,
    newBranchName,
    branchTargetCommit
  }
}
