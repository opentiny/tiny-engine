import fs from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Logger from './logger.mjs'
import pkg from '../packages/design-core/package.json' assert { type: 'json' }

const logger = new Logger('updateTemplate')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const templateSrcPath = path.resolve(__dirname, '../designer-demo')
const templateDistPath = path.resolve(__dirname, '../packages/engine-cli/template/designer')

const ignoreFolder = ['node_modules', 'dist', 'temp', 'tmp']

const filter = (src, _dest) => {
  if (ignoreFolder.some((item) => src.includes(item))) {
    return false
  }
  return true
}

async function copyTemplate() {
  const templateBackupPath = path.resolve(templateDistPath, '../designer_backup')
  if (await fs.pathExists(templateBackupPath)) {
    await fs.remove(templateBackupPath)
  }
  // 先备份原目录
  if (await fs.pathExists(templateDistPath)) {
    await fs.move(templateDistPath, templateBackupPath)
  }
  try {
    // 删除cli template内容
    if (await fs.pathExists(templateDistPath)) {
      await fs.remove(templateDistPath)
    }
    // 复制designer-demo
    await fs.copy(templateSrcPath, templateDistPath, { filter })
    await fs.remove(templateBackupPath)
  } catch (error) {
    logger.error(error)
    // 复制错误时恢复
    if (await fs.pathExists(templateBackupPath)) {
      await fs.move(templateBackupPath, templateDistPath)
    }
  } finally {
    if (await fs.pathExists(templateBackupPath)) {
      await fs.remove(templateBackupPath)
    }
  }
}

async function updatePkgJson() {
  const { version } = pkg
  const pkgJsonPath = path.resolve(templateDistPath, 'package.json')
  if ((await fs.pathExists(pkgJsonPath)) === false) {
    return
  }
  const pkgData = await fs.readJSON(pkgJsonPath)
  pkgData.version = '0.0.0'

  const defaultScripts = {
    dev: "concurrently 'pnpm:serve:mock' 'pnpm:serve:frontend'",
    'serve:frontend': 'cross-env VITE_THEME=light vite',
    'serve:mock': 'node node_modules/@opentiny/tiny-engine-mock/dist/app.js',
    'build:alpha': 'cross-env NODE_OPTIONS=--max-old-space-size=8192 VITE_THEME=light vite build --mode alpha',
    build: 'cross-env NODE_OPTIONS=--max-old-space-size=8192 VITE_THEME=light vite build --mode prod'
  }

  Object.entries(defaultScripts).forEach(([name, value]) => {
    pkgData.scripts[name] = value
  })

  pkgData.devDependencies['concurrently'] = '^8.2.0'

  const updateDependencyVersions = (deps) => {
    Object.keys(deps)
      .filter((name) => name.includes('@opentiny/tiny-engine'))
      .forEach((name) => {
        deps[name] = version
      })
  }
  updateDependencyVersions(pkgData.dependencies)
  updateDependencyVersions(pkgData.devDependencies)

  await fs.writeJSON(pkgJsonPath, pkgData, { spaces: 2 })
}

async function modifyViteConfig() {
  const viteConfigPath = path.resolve(templateDistPath, 'vite.config.js')
  if (await fs.exists(viteConfigPath)) {
    const fileContent = await fs.readFile(viteConfigPath, { encoding: 'utf-8' })
    const aliasRegexp = /useSourceAlias: *true/
    if (aliasRegexp.test(fileContent)) {
      const newFileContent = fileContent.replace(aliasRegexp, 'useSourceAlias: false')
      await fs.writeFile(viteConfigPath, newFileContent)
    }
  }
}

// 同步design-demo代码到CLI模板，避免模板未更新或版本号未修改
async function main() {
  await copyTemplate()
  await updatePkgJson()
  await modifyViteConfig()
}

main()
