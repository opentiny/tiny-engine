import { BranchAppServiceImpl } from './application/service/BranchAppService'
import { CommitAppServiceImpl } from './application/service/CommitAppService'
import { BranchServiceImpl } from './domain/services/BranchService'
import { CommitServiceImpl } from './domain/services/CommitService'
import { BranchRepositoryImpl } from './infrastructure/repositories/BranchRepository'
import { CommitRepositoryImpl } from './infrastructure/repositories/CommitRepository'

export class VersionManager {
  commitService: CommitServiceImpl
  branchService: BranchServiceImpl

  commitRepository: CommitRepositoryImpl
  branchRepository: BranchRepositoryImpl

  commitAppService: CommitAppServiceImpl
  branchAppService: BranchAppServiceImpl

  constructor() {
    this.commitService = new CommitServiceImpl()
    this.branchService = new BranchServiceImpl()

    this.commitRepository = new CommitRepositoryImpl()
    this.branchRepository = new BranchRepositoryImpl()

    this.commitAppService = new CommitAppServiceImpl(this.commitService, this.branchRepository, this.commitRepository)

    this.branchAppService = new BranchAppServiceImpl(
      this.branchService,
      this.commitAppService,
      this.commitRepository,
      this.branchRepository
    )
  }
}

// 方便外部直接用单例
export const versionManager = new VersionManager()
