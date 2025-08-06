import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import type { Branch } from '../../domain/models/Branch'
import type { ID } from '../../shared/type'

const api = getMetaApi(META_SERVICE.Http)
const BASE_URL = '/branch'

/**
 * BranchApi 接口定义
 */
export interface BranchApi {
  fetchBranchById(id: ID): Promise<Branch | null>
  fetchBranchByName(name: string): Promise<Branch | null>
  fetchAllBranches(): Promise<Branch[]>
  saveBranch(branch: Branch): Promise<void>
  updateBranch(branch: Branch): Promise<void>
  deleteBranch(id: ID): Promise<void>
}

/**
 * Repository 接口定义 - 用于数据持久化
 */
export interface BranchRepository {
  save(branch: Branch): Promise<void>
  findById(id: ID): Promise<Branch | null>
  findByName(name: string): Promise<Branch | null>
  findAll(): Promise<Branch[]>
  update(branch: Branch): Promise<void>
  delete(id: ID): Promise<void>
}

/**
 * BranchApi 接口实现
 */
export class BranchApiImpl implements BranchApi {
  async fetchBranchById(id: ID): Promise<Branch | null> {
    try {
      const res = await api.get(`${BASE_URL}/getById/${id}`)
      return res || null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch branch by ID:', error)
      return null
    }
  }

  async fetchBranchByName(name: string): Promise<Branch | null> {
    try {
      const res = await api.get(`${BASE_URL}/getByName`, { params: { name } })
      return res || null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch branch by name:', error)
      return null
    }
  }

  async fetchAllBranches(): Promise<Branch[]> {
    try {
      const res = await api.get(`${BASE_URL}/list`)
      return res.data || []
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch all branches:', error)
      return []
    }
  }

  async saveBranch(branch: Branch): Promise<void> {
    try {
      await api.post(`${BASE_URL}/create`, branch)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save branch:', error)
    }
  }

  async updateBranch(branch: Branch): Promise<void> {
    try {
      await api.post(`${BASE_URL}/update`, branch)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update branch:', error)
    }
  }

  async deleteBranch(id: ID): Promise<void> {
    try {
      await api.get(`${BASE_URL}/delete/${id}`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete branch:', error)
    }
  }
}

/**
 * BranchRepository 的实现类，通过 BranchApi 与后端交互
 */
export class BranchRepositoryImpl implements BranchRepository {
  private readonly branchApi: BranchApi

  constructor(branchApi: BranchApi) {
    this.branchApi = branchApi
  }

  async save(branch: Branch): Promise<void> {
    await this.branchApi.saveBranch(branch)
  }

  async findById(id: ID): Promise<Branch | null> {
    return await this.branchApi.fetchBranchById(id)
  }

  async findByName(name: string): Promise<Branch | null> {
    return await this.branchApi.fetchBranchByName(name)
  }

  async findAll(): Promise<Branch[]> {
    return await this.branchApi.fetchAllBranches()
  }

  async update(branch: Branch): Promise<void> {
    await this.branchApi.updateBranch(branch)
  }

  async delete(id: ID): Promise<void> {
    await this.branchApi.deleteBranch(id)
  }
}
