import fsExtra from 'fs-extra'
import path from 'node:path'
import chokidar from 'chokidar'
import fg from 'fast-glob'
import MysqlConnection from './connection.mjs'
import Logger from './logger.mjs'

const logger = new Logger('buildMaterials')
// 物料文件存放文件夹名称
const materialsDir = 'materials'
// 物料资产包
const bundlePath = path.join(process.cwd(), '/packages/design-core/public/mock/bundle.json')
// mockServer应用数据
const appInfoPath = path.join(process.cwd(), '/mockServer/src/services/appinfo.json')
const appSchemaPath = path.join(process.cwd(), 'mockServer/src/mock/get/app-center/v1/apps/schema/918.json')

const appInfo = fsExtra.readJSONSync(appInfoPath)
const appSchema = fsExtra.readJSONSync(appSchemaPath)

const connection = new MysqlConnection()

/**
 * 更新物料资产包和应用mock数据
 */
const write = (bundle) => {
  fsExtra.outputJSONSync(bundlePath, bundle, { spaces: 2 })
  fsExtra.outputJSONSync(appInfoPath, appInfo, { spaces: 2 })
  fsExtra.outputJSONSync(appSchemaPath, appSchema, { spaces: 2 })
}

/**
 * 校验组件文件数据
 * @param {string} file 组件文件路径
 * @param {object} component 组件数据
 * @returns
 */
const validateComponent = (file, component) => {
  const requiredFields = ['component']
  const fields = Object.keys(component)
  const requiredList = requiredFields.filter((field) => !fields.includes(field))

  if (requiredList.length) {
    logger.error(`组件文件 ${file} 缺少必要字段：${requiredList.join('、')}。`)

    return false
  }

  if (!component.npm) {
    logger.warn(`组件文件 ${file} 缺少 npm 字段，出码时将不能通过import语句导入组件。`)

    return false
  }

  return true
}

/**
 * 校验区块文件数据
 * @param {string} file 区块文件路径
 * @param {object} block 区块数据
 * @returns
 */
const validateBlock = (file, block) => {
  const requiredFields = ['label', 'assets']
  const fields = Object.keys(block)
  const requiredList = requiredFields.filter((field) => !fields.includes(field))

  if (requiredList.length) {
    logger.error(`区块文件 ${file} 缺少必要字段：${requiredList.join('、')}。`)

    return false
  }

  return true
}

/**
 * 读取materials目录下的json文件，执行下列操作
 * 1. 合并生成物料资产包
 * 2. 更新应用的组件数据componentsMap
 * 3. 连接上数据库后，将组件数据写入数据库（新增或更新）
 */
const generateComponents = () => {
  try {
    fg([`${materialsDir}/**/*.json`]).then((files) => {
      if (!files.length) {
        logger.warn('物料文件夹为空，请先执行`pnpm splitMaterials`命令拆分物料资产包')
      }

      const bundle = {
        data: {
          framework: 'Vue',
          materials: {
            components: [],
            blocks: [],
            snippets: []
          }
        }
      }
      const { components = [], snippets = [], blocks = [] } = bundle.data.materials
      const componentsMap = []
      const packagesMap = []
      const appInfoBlocksLabels = appInfo.blockHistories.map((item) => item.label)

      files.forEach((file) => {
        const material = fsExtra.readJsonSync(file, { throws: false })

        if (!material) {
          const fileFullPath = path.join(process.cwd(), file)

          logger.error(`文件格式有误 (${fileFullPath})`)

          return
        }

        if (file.includes('/blocks/')) {
          const valid = validateBlock(file, material)

          if (!valid) return

          blocks.push(material)

          if (!appInfoBlocksLabels.includes(material.label)) {
            appInfo.blockHistories.push(material)
          }

          return
        }

        const valid = validateComponent(file, material)

        if (!valid) return

        const { snippets: componentSnippets, category, ...componentInfo } = material

        components.push(componentInfo)

        const snippet = snippets.find((item) => item.group === category)

        if (snippet) {
          componentSnippets && snippet.children.push(componentSnippets[0])
        } else if (category && componentInfo) {
          snippets.push({
            group: category,
            children: componentSnippets || []
          })
        }

        const { component, npm = {} } = componentInfo

        componentsMap.push({ component, npm })

        if (connection.connected) {
          connection.initDB(material)
        }

        appInfo.materialHistory.components = componentsMap

        const { package: packageName = '', version = '', exportName = '' } = npm || {}

        const mapItem = {
          componentName: component,
          package: packageName,
          version,
          exportName
        }

        if (typeof npm.destructuring === 'boolean') {
          mapItem.destructuring = npm.destructuring
        }

        if (npm.package) {
          packagesMap.push(mapItem)
        }
      })

      appSchema.data.componentsMap = packagesMap
      write(bundle)
    })

    logger.success('物料资产包构建成功')
  } catch (error) {
    logger.error(`物料资产包构建失败：${error}`)
  }
}

// 监听materials下json文件的变化
const watcher = chokidar.watch(`${materialsDir}/**/*.json`, { ignoreInitial: true })

watcher.on('all', (event, file) => {
  const eventMap = {
    add: '新增',
    change: '更新',
    unlink: '删除'
  }
  const fileFullPath = path.join(process.cwd(), file)

  logger.info(`${eventMap[event]}组件文件 (${fileFullPath})`)

  // 监听物料文件变化，更新物料资产包
  generateComponents()

  if (!connection.connected || event === 'unlink') return

  const component = fsExtra.readJsonSync(fileFullPath)

  if (event === 'change') {
    connection.updateComponent(component, fileFullPath)
  } else if (event === 'add') {
    connection.insertComponent(component, fileFullPath)
  }
})

// 连接数据库
connection
  .connect()
  .then(() => {
    connection.initUserComponentsTable().finally(() => {
      generateComponents()
    })
  })
  .catch(() => {
    // 未能连接数据库也可以执行更新本地mock数据
    generateComponents()
  })
