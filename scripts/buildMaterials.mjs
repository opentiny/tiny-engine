import fsExtra from 'fs-extra'
import path from 'node:path'
import chokidar from 'chokidar'
import fg from 'fast-glob'
import MysqlConnection from './connection.mjs'
import logger from './logger.mjs'

// 物料资产包
const bundlePath = path.join(process.cwd(), '/packages/design-core/public/mock/bundle.json')
// mockServer应用数据
const appInfoPath = path.join(process.cwd(), '/mockServer/src/services/appinfo.json')
const appInfo = fsExtra.readJSONSync(appInfoPath)
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
const connection = new MysqlConnection()

const write = () => {
  fsExtra.outputJSONSync(bundlePath, bundle, { spaces: 2 })
  fsExtra.outputJSONSync(appInfoPath, appInfo, { spaces: 2 })
}

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

const generateComponents = () => {
  try {
    fg(['materials/**/*.json']).then((files) => {
      const { components = [], snippets = [], blocks = [] } = bundle.data.materials
      const componentsMap = []
      const appInfoBlocksLabels = appInfo.blockHistories.map((item) => item.label)

      files.forEach((file) => {
        const material = fsExtra.readJsonSync(file, { throws: false })

        if (!material) {
          logger.error(`读取物料文件 ${file} 失败`)

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
      })

      appInfo.materialHistory.components = componentsMap

      write()
    })

    logger.success('构建物料资产包成功')
  } catch (error) {
    logger.error(`构建物料资产包失败：${error}`)
  }
}

const watcher = chokidar.watch('materials/**/*.json', { ignoreInitial: true })

watcher.on('all', (event, file) => {
  const eventMap = {
    add: '新增',
    change: '更新',
    unlink: '删除'
  }

  logger.info(`${eventMap[event]}组件文件 ${file}`)

  // 监听物料文件变化，更新物料资产包
  generateComponents()

  if (!connection.connected || event === 'unlink') return

  const component = fsExtra.readJsonSync(path.join(process.cwd(), file))

  if (event === 'change') {
    connection.updateComponent(component)
  } else if (event === 'add') {
    connection.insertComponent(component)
  }
})

connection
  .connect()
  .then(() => {
    connection.initUserComponentsTable().finally(() => {
      generateComponents()
    })
  })
  .catch(() => {
    generateComponents()
  })
