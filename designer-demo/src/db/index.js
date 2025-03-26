import Dexie from "dexie"
import user from '../mock/user.json'
import appDetail from '../mock/appDetail.json'
import appSchema from '../mock/appSchema.json'
import pageList from '../mock/pageList.json'
import blockList from '../mock/blocks.json'
import blockGroup from '../mock/block-groups.json'
import utilsList from '../mock/utilsList.json'
import blockHistories from '../mock/blockHistories.json'
import { schema } from './schema'

export const db = new Dexie('tiny-engine-demo-indexdb')

// 声明数据库表
export const createDB = async () => {
  return db.version(1).stores({
    ...schema
  })
}

// 初始化注入数据
const initData = async () => {
  // 添加用户
  await db.user.add(user)
  await db.appDetail.add(appDetail)
  await db.appSchema.add(appSchema)
  await db.page.bulkPut(pageList)
  await db.block.bulkPut(blockList)
  await db.blockGroup.bulkPut(blockGroup)
  await db.blockHistories.bulkPut(blockHistories)
  await db.utils.bulkPut(utilsList)
}
// 初始化 indexdb
export const initIndexDB = async () => {
  await createDB()
  await db.open()

  const userCount = await db.user.count()

  // 如果有数据了，那就不初始化数据了
  if (userCount > 0) {
    return
  }

  await initData()
}

// 重置表数据
export const resetDataBase = async () => {
  await Promise.all(
    db.tables.map(table => table.clear())
  )

  await initData()
}
