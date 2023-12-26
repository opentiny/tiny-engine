import fsExtra from 'fs-extra'
import path from 'node:path'
import chokidar from 'chokidar'
import fg from 'fast-glob'
import MysqlConnection from './connection.mjs'

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

const write = () => {
  fsExtra.outputJSONSync(bundlePath, bundle, { spaces: 2 })
  fsExtra.outputJSONSync(appInfoPath, appInfo, { spaces: 2 })
}

const generateComponents = () => {
  try {
    fg(['materials/**/*.json']).then((files) => {
      const { components = [], snippets = [], blocks = [] } = bundle.data.materials
      const componentsMap = []
      const appInfoBlocksLabels = appInfo.blockHistories.map((item) => item.label)

      files.forEach((file) => {
        const material = fsExtra.readJsonSync(file)

        if (file.includes('/blocks/')) {
          blocks.push(material)

          if (!appInfoBlocksLabels.includes(material.label)) {
            appInfo.blockHistories.push(material)
          }

          return
        }

        const { snippet: componentSnippet, category, ...componentInfo } = material

        components.push(componentInfo)

        const snippet = snippets.find((item) => item.group === category)

        if (snippet) {
          componentSnippet && snippet.children.push(componentSnippet)
        } else if (category && componentInfo) {
          snippets.push({
            group: category,
            children: [componentSnippet]
          })
        }

        const { component, npm = {} } = componentInfo

        componentsMap.push({ component, npm })
      })

      appInfo.materialHistory.components = componentsMap

      write()
    })
  } catch (error) {
    throw new Error(`构建物料资产包失败：${error}`)
  }
}

const connection = new MysqlConnection()

const watcher = chokidar.watch('materials/**/*.json', { ignoreInitial: true })

watcher.on('all', (event, file) => {
  console.log('组件更新 =>', event, file)
  // 监听物料文件变化，更新物料资产包
  generateComponents()

  if (!connection.connected) return

  const component = fsExtra.readJsonSync(path.join(process.cwd(), file))

  if (event === 'change') {
    connection.updateComponent(component)
  } else if (event === 'add') {
    connection.insertComponent(component)
  }
})
