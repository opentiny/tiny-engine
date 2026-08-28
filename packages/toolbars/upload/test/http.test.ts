import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMetaApi, getMergeMeta, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import {
  batchCreateResource,
  createBlock,
  createBlockGroup,
  createDataSource,
  createResourceGroup,
  createUtilsResource,
  deployBlock,
  fetchBlockByLabel,
  fetchBlockGroups,
  fetchDataSourceList,
  fetchPageList,
  fetchResourceGroups,
  fetchResourceListByGroupId,
  fetchUtilsResourceList,
  updateAppConfig,
  updateBlock,
  updateDataSource,
  updateUtilsResource
} from '../src/http'

vi.mock('@opentiny/tiny-engine-meta-register', () => ({
  getMetaApi: vi.fn(),
  getMergeMeta: vi.fn(),
  callEntry: vi.fn((entry: any) => entry),
  META_SERVICE: { GlobalService: 'GlobalService', Http: 'Http' }
}))

describe('upload HTTP helpers', () => {
  const http = { get: vi.fn(), post: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMetaApi).mockReturnValue(http as any)
    vi.mocked(getMergeMeta).mockReturnValue({ platformId: 'platform-1' } as any)
    vi.mocked(getMetaApi).mockImplementation((service: any) => {
      if (service === META_SERVICE.GlobalService) {
        return { getBaseInfo: () => ({ id: 'app-1' }) } as any
      }
      return http as any
    })
  })

  it('should request page and block lists with the expected query parameters', () => {
    fetchPageList('app-1')
    expect(http.get).toHaveBeenCalledWith('/app-center/api/pages/list/app-1')

    fetchBlockGroups({ page: 2, size: 10 })
    expect(http.get).toHaveBeenCalledWith('/material-center/api/block-groups', {
      params: { page: 2, size: 10, from: 'block' }
    })

    fetchBlockByLabel('hero block')
    expect(http.get).toHaveBeenCalledWith('/material-center/api/block?label=hero block')
  })

  it('should create, update and deploy blocks through the matching endpoints', () => {
    const group = { name: 'Imported' }
    const block = { label: 'Hero', content: {} }
    const update = { content: { componentName: 'Block' } }

    createBlockGroup(group)
    createBlock(block)
    updateBlock('block-1', update, 'app-1')
    deployBlock({ id: 'block-1' })

    expect(http.post).toHaveBeenNthCalledWith(1, '/material-center/api/block-groups/create', group)
    expect(http.post).toHaveBeenNthCalledWith(2, '/material-center/api/block/create', block)
    expect(http.post).toHaveBeenNthCalledWith(3, '/material-center/api/block/update/block-1', update, {
      params: { appId: 'app-1' }
    })
    expect(http.post).toHaveBeenNthCalledWith(4, '/material-center/api/block/deploy', { id: 'block-1' })
  })

  it('should expose utils and data source endpoints with app identifiers', () => {
    fetchUtilsResourceList('app-1')
    createUtilsResource({ name: 'format' })
    updateUtilsResource({ id: 'util-1', name: 'format' })
    fetchDataSourceList(7)
    createDataSource({ name: 'users' })
    updateDataSource(9, { name: 'users' })
    updateAppConfig('app-1', { description: 'Imported' })

    expect(http.get).toHaveBeenCalledWith('/app-center/api/apps/extension/list?app=app-1&category=utils')
    expect(http.get).toHaveBeenCalledWith('/app-center/api/sources/list/7')
    expect(http.post).toHaveBeenCalledWith('/app-center/api/apps/extension/create', { name: 'format' })
    expect(http.post).toHaveBeenCalledWith('/app-center/api/apps/extension/update', { id: 'util-1', name: 'format' })
    expect(http.post).toHaveBeenCalledWith('/app-center/api/sources/create', { name: 'users' })
    expect(http.post).toHaveBeenCalledWith('/app-center/api/sources/update/9', { name: 'users' })
    expect(http.post).toHaveBeenCalledWith('/app-center/api/apps/update/app-1', { description: 'Imported' })
  })

  it('should include app and platform metadata for resource group and batch uploads', () => {
    const group = { name: 'Imported assets', description: 'Images' }
    const resources = [{ name: 'logo.png', resourceData: 'data:image/png;base64,abc' }]

    fetchResourceGroups()
    createResourceGroup(group)
    fetchResourceListByGroupId('group-1')
    batchCreateResource(resources)

    expect(http.get).toHaveBeenCalledWith('/material-center/api/resource-group/app-1')
    expect(http.get).toHaveBeenCalledWith('/material-center/api/resource/find/group-1')
    expect(http.post).toHaveBeenCalledWith('/material-center/api/resource-group/create', {
      ...group,
      appId: 'app-1',
      platformId: 'platform-1'
    })
    expect(http.post).toHaveBeenCalledWith('/material-center/api/resource/create/batch', [
      {
        ...resources[0],
        appId: 'app-1',
        platformId: 'platform-1'
      }
    ])
  })
})
