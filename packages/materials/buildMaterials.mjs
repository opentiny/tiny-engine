import fsExtra from 'fs-extra'
import path from 'node:path'
import chokidar from 'chokidar'
import fg from 'fast-glob'
import { fileURLToPath } from 'node:url'
import httpServer from 'http-server'
import portFinder from 'portfinder'
import Logger from '../../scripts/logger.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logger = new Logger('buildMaterials')

// 物料文件存放文件夹名称
const materialsDir = path.resolve(__dirname, './src')

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

const generateComponents = async (entry) => {
  const files = await fg('*.json', { cwd: entry })

  if (!files.length) {
    return
  }

  const bundle = {
    components: [],
    snippets: [],
    packages: []
  }
  const componentsMap = []

  const metaInfo = fsExtra.readJsonSync(path.resolve(entry, 'meta.json'), { throws: false })

  if (metaInfo?.package) {
    bundle.packages.push(metaInfo.package)
  }
  if (metaInfo?.snippets) {
    bundle.snippets = metaInfo.snippets
  }

  const componentFiles = files.filter((fileName) => {
    if (fileName === 'meta.json') {
      return false
    }

    // 下划线开头的组件文件不导出
    return !fileName.startsWith('_')
  })

  componentFiles.forEach((file) => {
    const material = fsExtra.readJsonSync(path.resolve(entry, file), { throws: false })

    if (!material) {
      const fileFullPath = path.join(process.cwd(), file)

      logger.error(`文件格式有误 (${fileFullPath})`)

      return
    }

    const valid = validateComponent(file, material)

    if (!valid) return

    const { snippets: componentSnippets, category, ...componentInfo } = material

    bundle.components.push(componentInfo)

    const snippet = bundle.snippets.find((item) => item.group === category)

    if (snippet) {
      if (!snippet.children) {
        snippet.children = []
      }

      if (componentSnippets) {
        snippet.children.push(...componentSnippets)
      }
    } else if (category && componentInfo && componentSnippets) {
      bundle.snippets.push({
        group: category,
        children: componentSnippets || []
      })
    }

    const npmInfo = componentInfo.npm
    const { package: packageName = '', exportName = '' } = npmInfo

    const mapItem = {
      componentName: componentInfo.component,
      package: packageName,
      exportName
    }

    if (typeof npmInfo.destructuring === 'boolean') {
      mapItem.destructuring = componentInfo.npm.destructuring
    }

    if (npmInfo.package) {
      componentsMap.push(mapItem)
    }
  })

  return {
    bundle,
    componentsMap
  }
}

const getFrameworkWithData = (data) => {
  return {
    framework: 'Vue',
    materials: data
  }
}

const buildComponents = async (config = {}) => {
  try {
    const entries = await fg('*/', {
      cwd: materialsDir,
      onlyDirectories: true,
      deep: 1
    })

    const { buildCombine = true } = config

    const allBundles = {
      components: [],
      snippets: [],
      packages: []
    }
    let allComponentsMap = []

    for (const entry of entries) {
      const res = await generateComponents(path.resolve(materialsDir, `${entry}`))

      if (!res) {
        continue
      }

      fsExtra.outputJSONSync(path.resolve(__dirname, `./dist/${entry}.json`), getFrameworkWithData(res.bundle), {
        spaces: 2
      })
      fsExtra.outputJSONSync(path.resolve(__dirname, `./dist/${entry}.compsMap.json`), res.componentsMap, { spaces: 2 })

      allBundles.components = allBundles.components.concat(res.bundle.components)
      allComponentsMap = allComponentsMap.concat(res.componentsMap)
      allBundles.packages = allBundles.packages.concat(res.bundle.packages)

      for (const snippetItem of res.bundle.snippets) {
        const snippet = allBundles.snippets.find((item) => item.group === snippetItem.group)

        if (snippet) {
          if (!snippet.children) {
            snippet.children = []
          }

          snippet.children.push(...(snippetItem.children || []))
        } else {
          allBundles.snippets.push(snippetItem)
        }
      }
    }

    if (buildCombine) {
      fsExtra.outputJSONSync(path.resolve(__dirname, `./dist/index.json`), getFrameworkWithData(allBundles), {
        spaces: 2
      })
      fsExtra.outputJSONSync(path.resolve(__dirname, `./dist/index.compsMap.json`), allComponentsMap, { spaces: 2 })
    }

    logger.success('物料资产包构建成功')
  } catch (error) {
    logger.error(`物料资产包构建失败：${error}`)
  }
}

// 持续构建
async function serve() {
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
    buildComponents()
  })

  // 第一次需要手动出发构建一遍
  await buildComponents()

  const staticServerPort = await portFinder.getPortPromise({ port: 4001 })

  const server = httpServer.createServer({
    caches: 1,
    cors: true,
    root: path.resolve(__dirname, './dist')
  })

  server.listen(staticServerPort, () => {
    logger.success(`物料服务已启动  http://127.0.0.1:${staticServerPort}`)
  })
}

// 单次构建，分组件库
function buildSplit() {
  buildComponents({ buildCombine: false })
}

// 单次构建，合并所有组件库
function build() {
  buildComponents()
}

function start() {
  const commandsMap = {
    serve: serve,
    build: build,
    'build:split': buildSplit
  }

  const command = process.argv.slice(2)

  if (!commandsMap[command]) {
    logger.error(`[@opentiny/tiny-engine-materials] 不支持${command}命令`)

    return
  }

  commandsMap[command]()
}

start()
