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
    // logger.warn('物料文件夹为空，请先执行`pnpm splitMaterials`命令拆分物料资产包')
    return
  }

  const bundle = {
    componentsMap: [],
    components: [],
    snippets: []
  }

  files.forEach((file) => {
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
      componentSnippets && snippet.children.push(componentSnippets[0])
    } else if (category && componentInfo) {
      bundle.snippets.push({
        group: category,
        children: componentSnippets || []
      })
    }

    const npmInfo = componentInfo.npm
    const { package: packageName = '', version = '', exportName = '' } = npmInfo

    const mapItem = {
      componentName: componentInfo.component,
      package: packageName,
      version,
      exportName
    }

    if (typeof npmInfo.destructuring === 'boolean') {
      mapItem.destructuring = componentInfo.npm.destructuring
    }

    if (npmInfo.package) {
      bundle.componentsMap.push(mapItem)
    }
  })

  return bundle
}

const getFrameworkWithData = (data) => {
  return {
    data: {
      framework: 'Vue',
      materials: data
    }
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
      componentsMap: []
    }

    for (const entry of entries) {
      const res = await generateComponents(path.resolve(materialsDir, `${entry}`))

      if (res) {
        fsExtra.outputJSONSync(path.resolve(__dirname, `./dist/${entry}.json`), getFrameworkWithData(res), { spaces: 2 })

        allBundles.components = allBundles.components.concat(res.components)
        allBundles.snippets = allBundles.snippets.concat(res.snippets)
        allBundles.componentsMap = allBundles.componentsMap.concat(res.componentsMap)
      }
    }

    if (buildCombine) {
      fsExtra.outputJSONSync(path.resolve(__dirname, `./dist/all.json`), getFrameworkWithData(allBundles), { spaces: 2 })
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
