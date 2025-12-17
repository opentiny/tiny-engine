import type { BlockItem, IBlockItem } from '../types'

export async function fetchAppSchema(id: string | number) {
  let appSchema = {}
  try {
    const res: any = await fetch(`/app-center/v1/api/apps/schema/${id}`)
    appSchema = (await res?.json()?.data) || {}
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('获取应用Schema信息错误:', error)
  }
  return appSchema
}

export async function fetchAppPackages(pkgUrl: string) {
  let packages = []
  try {
    const res = await fetch(pkgUrl)
    const bundleJson: any = await res.json()
    packages = bundleJson?.data?.materials?.packages || []
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('获取应用物料包错误:', error)
  }
  return packages
}

export async function fetchAppPages(id: string | number) {
  let pages = []
  try {
    const res: any = await fetch(`/app-center/api/pages/list/${id}`)
    pages = (await res.json()?.data) || []
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('获取应用页面错误:', error)
  }
  return pages
}
export async function fetchAllBlocks() {
  const blocksMap: Record<string, IBlockItem> = {}
  try {
    const res: any = await fetch('/material-center/api/blocks')
    const blocks: BlockItem[] = await res.json()?.data
    blocks.forEach((block) => {
      if (block.content) {
        blocksMap[block.label] = {
          schema: block.content,
          meta: {
            id: block.id,
            label: block.label,
            framework: block.framework,
            version: block.version
          }
        }
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('获取所有区块错误:', error)
  }
  return blocksMap
}

export async function fetchBlockByName(name: string) {
  let block = {}
  try {
    const res: any = await fetch(`/material-center/api/block?label=${name}`)
    block = await res.json()?.data?.[0]
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`获取区块[${name}]错误:`, error)
  }
  return block
}
