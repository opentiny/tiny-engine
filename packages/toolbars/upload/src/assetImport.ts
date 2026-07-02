const replaceStringByMap = (value: string, replacements: Map<string, string>) => {
  let nextValue = String(value ?? '')

  replacements.forEach((targetValue, sourceValue) => {
    if (!sourceValue) return
    nextValue = nextValue.split(sourceValue).join(targetValue)
  })

  return nextValue
}

const hashString = (value: string) => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash.toString(36)
}

const getAssetExtension = (fileName = '') => {
  const match = String(fileName).match(/(\.[^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

const normalizeResourceAssetExtension = (extension = '') => {
  const normalized = String(extension || '').toLowerCase()
  if (['.png', '.jpg', '.jpeg', '.svg'].includes(normalized)) {
    return normalized
  }

  return '.png'
}

const getAssetBaseName = (filePath = '') => {
  const normalized = String(filePath || '').replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  return fileName.replace(/\.[^.]+$/, '')
}

const sanitizeAssetSegment = (value = '') =>
  String(value || '')
    .replace(/[^a-zA-Z0-9_=+(){}[\]\u4e00-\u9fa5-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

export const getImportedAssets = (appSchema: any) =>
  Array.isArray(appSchema?.assets)
    ? appSchema.assets.filter((item: any) => item?.placeholder && item?.resourceData)
    : []

export const buildImportedAssetResourceName = (asset: any) => {
  const extension = normalizeResourceAssetExtension(getAssetExtension(asset?.name || asset?.filePath || '') || '.png')
  const baseName =
    sanitizeAssetSegment(getAssetBaseName(asset?.filePath || asset?.name || 'imported_asset')) || 'imported_asset'
  const fingerprint = hashString(`${asset?.filePath || ''}:${asset?.resourceData || ''}`).slice(0, 8)

  return `${baseName}_${fingerprint}${extension}`
}

export const buildImportedAssetCreatePayload = (
  asset: any,
  resourceGroupId: number | string,
  requestMeta: { appId?: number | string; platformId?: number | string } = {}
) => ({
  name: buildImportedAssetResourceName(asset),
  description: asset?.filePath || '',
  resourceGroupId,
  resourceData: asset?.resourceData || '',
  resourceUrl: '',
  category: 'image',
  ...(requestMeta?.appId ? { appId: requestMeta.appId } : {}),
  ...(requestMeta?.platformId ? { platformId: requestMeta.platformId } : {})
})

const estimateImportedAssetPayloadSize = (payload: any) => JSON.stringify(payload || {}).length

export const splitImportedAssetCreatePayloads = (
  payloads: any[] = [],
  options: { maxBatchSize?: number; maxPayloadSize?: number } = {}
) => {
  const maxBatchSize = Math.max(1, Number(options.maxBatchSize || 5))
  const maxPayloadSize = Math.max(1, Number(options.maxPayloadSize || 1_500_000))
  const batches: any[][] = []
  let currentBatch: any[] = []
  let currentPayloadSize = 2

  payloads.forEach((payload) => {
    const payloadSize = estimateImportedAssetPayloadSize(payload)
    const nextBatchSize = currentBatch.length + 1
    const nextPayloadSize = currentPayloadSize + payloadSize + (currentBatch.length ? 1 : 0)
    const shouldStartNewBatch =
      currentBatch.length > 0 && (nextBatchSize > maxBatchSize || nextPayloadSize > maxPayloadSize)

    if (shouldStartNewBatch) {
      batches.push(currentBatch)
      currentBatch = []
      currentPayloadSize = 2
    }

    currentBatch.push(payload)
    currentPayloadSize += payloadSize + (currentBatch.length > 1 ? 1 : 0)
  })

  if (currentBatch.length) {
    batches.push(currentBatch)
  }

  return batches
}

export const replaceImportedAssetPlaceholders = (target: any, replacements: Map<string, string>) => {
  if (!target || replacements.size === 0) return target

  const walk = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map((item) => walk(item))
    }

    if (typeof value === 'string') {
      return replaceStringByMap(value, replacements)
    }

    if (!value || typeof value !== 'object') {
      return value
    }

    Object.keys(value).forEach((key) => {
      value[key] = walk(value[key])
    })

    return value
  }

  return walk(target)
}

export const getImportedAssetResourceUrl = (resource: any) =>
  resource?.resourceUrl ||
  resource?.thumbnailUrl ||
  resource?.thumbnail_url ||
  resource?.url ||
  resource?.downloadUrl ||
  resource?.download_url ||
  resource?.resource_url ||
  ''

export const findImportedAssetResource = (resources: any[] = [], target: any) => {
  const normalizedName = String(target?.name || '')
  const normalizedDescription = String(target?.description || '')

  return (
    resources.find((item: any) => String(item?.name || '') === normalizedName) ||
    resources.find((item: any) => normalizedDescription && String(item?.description || '') === normalizedDescription) ||
    null
  )
}

export const normalizeImportedAssetResourceList = (response: any) => {
  if (Array.isArray(response)) return response

  const candidates = [response?.data, response?.data?.list, response?.data?.records, response?.list, response?.records]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}
