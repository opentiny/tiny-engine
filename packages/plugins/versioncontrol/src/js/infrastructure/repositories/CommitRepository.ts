import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import type { ID } from '../../shared/type'
import type { Commit } from '../../domain/models/Commit'

const api = getMetaApi(META_SERVICE.Http)
const BASE_URL = '/commit'

/**
 * CommitApi 接口定义
 */
export interface CommitApi {
  fetchCommitById(id: ID): Promise<Commit | null>
  fetchCommitsByBranchId(branchId: ID, limit?: number, offset?: number): Promise<Commit[]>
  fetchCommitsByTag(tag: string): Promise<Commit[]>
  saveCommit(commit: Commit): Promise<void>
  updateCommit(commit: Commit): Promise<void>
  deleteCommit(id: ID): Promise<void>
}

/**
 * CommitRepository 接口定义
 */
export interface CommitRepository {
  save(commit: Commit): Promise<void>
  findById(id: ID): Promise<Commit | null>
  findByBranchId(branchId: ID, limit?: number, offset?: number): Promise<Commit[]>
  findByTag(tag: string): Promise<Commit[]>
  update(commit: Commit): Promise<void>
  delete(id: ID): Promise<void>
}

export class CommitApiImpl implements CommitApi {
  async fetchCommitById(id: ID): Promise<Commit | null> {
    try {
      const res = await api.get(`${BASE_URL}/getById/${id}`)
      return res || null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch commit by ID:', error)
      return null
    }
  }

  async fetchCommitsByBranchId(branchId: ID, limit?: number, offset?: number): Promise<Commit[]> {
    try {
      const res = await api.get(`${BASE_URL}/listByBranch`, {
        params: {
          branchId,
          limit,
          offset
        }
      })
      return res || []
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch commits by branch ID:', error)
      return []
    }
  }

  async fetchCommitsByTag(tag: string): Promise<Commit[]> {
    try {
      const res = await api.get(`${BASE_URL}/listByTag`, {
        params: { tag }
      })
      return res || []
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch commits by tag:', error)
      return []
    }
  }

  async saveCommit(commit: Commit): Promise<void> {
    try {
      await api.post(`${BASE_URL}/create`, commit)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save commit:', error)
    }
  }

  async updateCommit(commit: Commit): Promise<void> {
    try {
      await api.post(`${BASE_URL}/update`, commit)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update commit:', error)
    }
  }

  async deleteCommit(id: ID): Promise<void> {
    try {
      await api.get(`${BASE_URL}/delete/${id}`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete commit:', error)
    }
  }
}

/**
 * CommitRepository 的实现类，通过 CommitApi 与后端交互
 */
export class CommitRepositoryImpl implements CommitRepository {
  private readonly commitApi: CommitApi

  constructor(commitApi: CommitApi) {
    this.commitApi = commitApi
  }

  async save(commit: Commit): Promise<void> {
    await this.commitApi.saveCommit(commit)
  }

  async findById(id: ID): Promise<Commit | null> {
    return await this.commitApi.fetchCommitById(id)
  }

  async findByBranchId(branchId: ID, limit?: number, offset?: number): Promise<Commit[]> {
    return await this.commitApi.fetchCommitsByBranchId(branchId, limit, offset)
  }

  async findByTag(tag: string): Promise<Commit[]> {
    return await this.commitApi.fetchCommitsByTag(tag)
  }

  async update(commit: Commit): Promise<void> {
    await this.commitApi.updateCommit(commit)
  }

  async delete(id: ID): Promise<void> {
    await this.commitApi.deleteCommit(id)
  }
}
