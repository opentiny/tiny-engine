import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import type { ID } from '../../shared/type'
import type { Commit } from '../../domain/models/Commit'

const BASE_URL = '/app-center/api/version/commit'

/**
 * CommitApi 接口定义
 */
export interface CommitApi {
  fetchCommitById(id: ID): Promise<Commit | null>
  fetchCommitsByBranchId(branchId: ID, limit?: number, offset?: number): Promise<Commit[]>
  fetchCommitsByTag(tag: string): Promise<Commit[]>
  fetchAllCommits(): Promise<Commit[]>
  saveCommit(commit: Commit): Promise<void>
  updateCommit(commit: Commit): Promise<void>
  deleteCommit(id: ID): Promise<void>
}

/**
 * CommitRepository 接口定义
 */
export interface CommitRepository {
  save(commit: Commit): Promise<void>
  findById(id: ID): Promise<any | null>
  findByBranchId(branchId: ID, limit?: number, offset?: number): Promise<Commit[]>
  findByTag(tag: string): Promise<Commit[]>
  findAll(): Promise<Commit[]>
  update(commit: Commit): Promise<void>
  delete(id: ID): Promise<void>
}

export class CommitApiImpl implements CommitApi {
  async fetchCommitById(id: ID): Promise<Commit | null> {
    try {
      const res = await getMetaApi(META_SERVICE.Http).get(`${BASE_URL}/detail/${id}`)
      return res || null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch commit by ID:', error)
      return null
    }
  }

  async fetchCommitsByBranchId(branchId: ID, limit?: number, offset?: number): Promise<Commit[]> {
    try {
      const res = await getMetaApi(META_SERVICE.Http).get(`${BASE_URL}/listByBranch`, {
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
      const res = await getMetaApi(META_SERVICE.Http).get(`${BASE_URL}/listByTag`, {
        params: { tag }
      })
      return res || []
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch commits by tag:', error)
      return []
    }
  }

  async fetchAllCommits(): Promise<Commit[]> {
    try {
      const res = await getMetaApi(META_SERVICE.Http).get(`/app-center/api/version/commit/list/${1}`)
      return res || null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch all commits:', error)
      return []
    }
  }

  async saveCommit(commit: Commit): Promise<void> {
    try {
      const result = await getMetaApi(META_SERVICE.Http).post(`${BASE_URL}/create`, commit.toData())
      return result || null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save commit:', error)
    }
  }

  async updateCommit(commit: Commit): Promise<void> {
    try {
      const res = await getMetaApi(META_SERVICE.Http).post(`${BASE_URL}/update/${commit.id}`, commit.toData())
      return res || null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update commit:', error)
    }
  }

  async deleteCommit(id: ID): Promise<void> {
    try {
      await getMetaApi(META_SERVICE.Http).get(`${BASE_URL}/delete/${id}`)
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

  constructor() {
    this.commitApi = new CommitApiImpl()
  }

  async save(commit: Commit): Promise<void> {
    await this.commitApi.saveCommit(commit)
  }

  async findById(id: ID): Promise<any | null> {
    return await this.commitApi.fetchCommitById(id)
  }

  async findByBranchId(branchId: ID, limit?: number, offset?: number): Promise<Commit[]> {
    return await this.commitApi.fetchCommitsByBranchId(branchId, limit, offset)
  }

  async findByTag(tag: string): Promise<Commit[]> {
    return await this.commitApi.fetchCommitsByTag(tag)
  }

  async findAll(): Promise<Commit[]> {
    return await this.commitApi.fetchAllCommits()
  }

  async update(commit: Commit): Promise<void> {
    await this.commitApi.updateCommit(commit)
  }

  async delete(id: ID): Promise<void> {
    await this.commitApi.deleteCommit(id)
  }
}
