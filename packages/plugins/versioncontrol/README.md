# 分支与提交管理服务

本模块提供了一个完整的 **分支与提交管理系统**，适用于协作项目。  
它负责应用层业务逻辑，协调领域服务，提供分支创建、合并、保护、提交历史、快照等功能。

---

## 功能概览

### 分支管理

- **创建分支**：从上游分支或指定提交创建新分支。
- **销毁分支**：删除分支（支持强制删除），并更新上游引用。
- **合并分支**：将一个分支合并到另一个分支，支持冲突检测和多种合并策略。
- **更新分支**：将上游分支最新更改拉取到下游分支。(UI 尚未实现)
- **分支状态**：获取最新提交、领先/落后提交数量以及分支状态信息。
- **分支操作历史**：记录分支操作，如创建、合并、归档、删除等。
- **分支提交历史**：查询分支的提交记录。
- **分支保护 / 解除保护**：应用规则防止强制推送或要求拉取请求。
- **分支归档 / 解除归档**：归档不活跃分支。
- **恢复已删除分支**：恢复之前删除的分支。
- **重命名分支**：修改分支名称，确保唯一性。

### 提交管理

- **创建提交**：提交页面或 schema 变更，记录作者、信息及变更统计。
- **获取提交**：通过提交 ID 查询特定提交。
- **按分支查询提交**：分页获取分支提交列表。
- **提交差异**：比较两个提交之间的差异。
- **生成快照**：生成提交快照，方便历史回溯。
- **验证提交**：验证提交签名或完整性。
- **回滚分支**：将分支回滚到指定提交。
- **提交标签管理**：为提交添加标签，并根据标签查询提交。
- **提交历史**：查询提交历史，支持过滤和分页。

---

## 使用示例

````ts
import { BranchAppServiceImpl } from './app/services/BranchAppService'
import { CommitAppServiceImpl } from './app/services/CommitAppService'
import {
  branchService,
  commitService,
  branchRepository,
  commitRepository
} from './dependencies'

// 初始化服务
const branchAppService = new BranchAppServiceImpl(branchService, commitAppService, commitRepository, branchRepository)
const commitAppService = new CommitAppServiceImpl(commitService, branchRepository, commitRepository)

// 分支操作示例
const newBranch = await branchAppService.createBranch(
  'feature/login',
  'upstream-branch-id',
  { id: 'user-1', username: 'Alice' },
  'commit-id-123',
  '登录功能分支'
)

const mergeResult = await branchAppService.mergeBranch('feature/login', 'develop', 'three-way', '将登录功能合并到 develop 分支')
console.log(mergeResult.newCommitId, mergeResult.conflictedReports)

// 提交操作示例
const commit = await commitAppService.createCommit(
  newBranch.id,
  '添加登录页面',
  { id: 'user-1', username: 'Alice' },
  { pages: [{ id: 'p1', content: '...' }] },
  'feature'
)

const diff = await commitAppService.getCommitDiff(commit.id, 'previous-commit-id')
console.log(diff)

const snapshot = await commitAppService.generateSnapshot(commit.id)
console.log(snapshot)
````

## 注意事项

* **参数校验**：所有服务方法均有严格参数验证。
* **缓存优化**：常用查询方法使用 `@Memoize` 缓存，提高性能。
* **事务保证**：分支和提交操作确保仓库与领域模型数据一致。
* **可扩展**：`BranchAppService` 和 `CommitAppService` 可灵活扩展，支持自定义领域服务和仓库实现。
