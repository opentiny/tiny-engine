import { describe, expect, it } from 'vitest'
import {
  buildImportedAssetCreatePayload,
  buildImportedAssetResourceName,
  findImportedAssetResource,
  getImportedAssetResourceUrl,
  getImportedAssets,
  normalizeImportedAssetResourceList,
  replaceImportedAssetPlaceholders,
  splitImportedAssetCreatePayloads
} from '../src/assetImport'

describe('asset import helpers', () => {
  it('should keep only importable assets from an app schema', () => {
    const valid = { placeholder: '__ASSET_1__', resourceData: 'data:image/png;base64,abc' }
    const assets = getImportedAssets({
      assets: [valid, { placeholder: '__ASSET_2__' }, { resourceData: 'missing' }, null]
    })

    expect(assets).toEqual([valid])
    expect(getImportedAssets({ assets: [] })).toEqual([])
    expect(getImportedAssets(undefined)).toEqual([])
  })

  it('should generate deterministic sanitized resource names and create payloads', () => {
    const asset = { filePath: 'src/assets/app logo.JPG', resourceData: 'binary-data' }
    const name = buildImportedAssetResourceName(asset)

    expect(name).toMatch(/^app_logo_[a-z0-9]+\.jpg$/)
    expect(buildImportedAssetResourceName(asset)).toBe(name)
    expect(buildImportedAssetCreatePayload(asset, 42, { appId: 'app-1', platformId: 'platform-1' })).toEqual({
      name,
      description: asset.filePath,
      resourceGroupId: 42,
      resourceData: asset.resourceData,
      resourceUrl: '',
      category: 'image',
      appId: 'app-1',
      platformId: 'platform-1'
    })
  })

  it('should split upload payloads by batch count and serialized size', () => {
    const payloads = [{ id: 1 }, { id: 2 }, { id: 3 }]

    expect(splitImportedAssetCreatePayloads(payloads, { maxBatchSize: 2 })).toEqual([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }]
    ])
    expect(splitImportedAssetCreatePayloads(payloads, { maxPayloadSize: 1 })).toEqual([
      [{ id: 1 }],
      [{ id: 2 }],
      [{ id: 3 }]
    ])
    expect(splitImportedAssetCreatePayloads([])).toEqual([])
  })

  it('should replace asset placeholders recursively without changing non-string values', () => {
    const schema = {
      image: '__ASSET_1__',
      nested: [{ css: 'url(__ASSET_1__)' }, { value: 1 }],
      expression: { type: 'JSExpression', value: "'__ASSET_1__'" }
    }
    const replacements = new Map([['__ASSET_1__', 'https://cdn.test/logo.png']])

    expect(replaceImportedAssetPlaceholders(schema, replacements)).toEqual({
      image: 'https://cdn.test/logo.png',
      nested: [{ css: 'url(https://cdn.test/logo.png)' }, { value: 1 }],
      expression: { type: 'JSExpression', value: "'https://cdn.test/logo.png'" }
    })
    expect(replaceImportedAssetPlaceholders(schema, new Map())).toBe(schema)
  })

  it('should resolve resource URLs from supported response field names', () => {
    expect(getImportedAssetResourceUrl({ resourceUrl: '/resource.png', url: '/fallback.png' })).toBe('/resource.png')
    expect(getImportedAssetResourceUrl({ download_url: '/download.png' })).toBe('/download.png')
    expect(getImportedAssetResourceUrl({})).toBe('')
    expect(findImportedAssetResource([{ name: 'logo_hash.png' }], { name: 'logo_hash.png' })).toEqual({
      name: 'logo_hash.png'
    })
    expect(findImportedAssetResource([{ description: 'src/logo.png' }], { description: 'src/logo.png' })).toEqual({
      description: 'src/logo.png'
    })
    expect(findImportedAssetResource([], { name: 'missing' })).toBeNull()
  })

  it('should normalize resource list responses from common API envelopes', () => {
    const list = [{ id: 1 }]

    expect(normalizeImportedAssetResourceList(list)).toBe(list)
    expect(normalizeImportedAssetResourceList({ data: list })).toBe(list)
    expect(normalizeImportedAssetResourceList({ data: { records: list } })).toBe(list)
    expect(normalizeImportedAssetResourceList({ list })).toBe(list)
    expect(normalizeImportedAssetResourceList({ data: {} })).toEqual([])
  })
})
