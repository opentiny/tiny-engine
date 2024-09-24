/**
 * Copyright (c) 2024 - present TinyEngine Authors.
 * Copyright (c) 2024 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { cwd } from 'node:process'
import path from 'node:path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { generateConfig, generateJSON, generatePackageJson, generateText } from './generateConfig'

const logger = console

function checkDirNameValid(name) {
  if (fs.pathExistsSync(path.join(cwd(), name))) {
    logger.log(chalk.red(`create failed, because the ${name} folder already exists. 创建失败，${name} 文件夹已存在。`))
    return false
  }

  return true
}

const defaultOptions = {
  theme: 'light',
  platformId: 918,
  material: ['/mock/bundle.json'],
  scripts: [],
  styles: []
}

export function createPlatform(name, options = {}) {
  if (!checkDirNameValid(name)) {
    return
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options
  }

  const templatePath = path.join(__dirname, '../template/designer/')
  const destPath = path.join(cwd(), name)

  fs.copySync(templatePath, destPath)

  const configContent = generateConfig(mergedOptions)
  const pkgContent = generatePackageJson(name, mergedOptions, templatePath)
  const readmePath = path.join(destPath, 'README.md')
  const readmeContent = generateText(readmePath, [{ find: '#PROJECT_NAME#', replacement: name }])

  fs.outputFileSync(path.resolve(destPath, 'engine.config.js'), configContent)
  fs.outputJSONSync(path.resolve(destPath, 'package.json'), pkgContent)
  fs.outputFileSync(readmePath, readmeContent)

  logger.log(
    chalk.green(`create finish, run the follow command to start project: \ncd ${name} && npm install && npm run dev`)
  )
}

function validatePluginOptions(options) {
  const { type, align } = options

  if (type === 'plugins' && !['top', 'bottom'].includes(align)) {
    logger.log(chalk.red(`plugins can only align to top or bottom`))
    return false
  }

  if (type === 'toolbars' && !['left', 'center', 'right'].includes(align)) {
    logger.log(chalk.red(`toolbars can only align to left, center or right`))
    return false
  }

  return true
}

export function createPlugin(name, options) {
  if (!checkDirNameValid(name)) {
    return
  }

  if (!validatePluginOptions(options)) {
    return
  }

  const templatePath = path.join(__dirname, '../template/plugin/')
  const destPath = path.join(cwd(), name)
  fs.copySync(templatePath, destPath)

  const pkgPath = path.resolve(destPath, 'package.json')
  const pkgContent = generateJSON(pkgPath, [{ find: 'name', replacement: name }])
  fs.outputJSONSync(pkgPath, pkgContent, { spaces: 2 })

  const metaPath = path.resolve(destPath, 'meta.js')
  const metaContent = generateText(metaPath, [
    { find: '#PLUGIN_ID#', replacement: name.toLowerCase() },
    { find: '#PLUGIN_TYPE#', replacement: options.type },
    { find: '#PLUGIN_ALIGN#', replacement: options.align }
  ])
  fs.outputFileSync(metaPath, metaContent)

  logger.log(chalk.green(`create finish, run the follow command to start project: \ncd ${name} && npm install`))
}

/**
 *
 * @param {string} dirpath
 * @returns
 */
function findDir(dirpath) {
  try {
    const files = fs.readdirSync(dirpath)

    if (!dirpath.includes(path.sep)) {
      return null
    }

    if (
      ['engine.config.js', 'registry.js'].every((n) => files.includes(n)) &&
      fs.statSync(path.join(dirpath, 'src/configurators/index.js')).isFile()
    ) {
      return path.join(dirpath, 'src/configurators')
    }
    return findDir(dirpath.slice(0, dirpath.lastIndexOf(path.sep)))
  } catch {
    return null
  }
}

export function createConfigurator(name) {
  name = name.endsWith('.vue') ? name : `${name}.vue`

  const configuratorDir = findDir(cwd())

  if (!configuratorDir) {
    logger.log(chalk.red(`current path is not in the low-code project directory. 当前路径不在低代码项目目录下`))
    return
  }

  const destPath = path.join(configuratorDir, name)
  if (fs.pathExistsSync(path.join(configuratorDir, name))) {
    logger.log(chalk.red(`create failed, because the ${name} file already exists. 创建失败，${name} 文件已存在。`))
    return
  }

  const templateConfiguratorPath = path.join(
    __dirname,
    '../template/designer/src/configurators/MyInputConfigurator.vue'
  )
  const configuratorContent = generateText(templateConfiguratorPath, [
    { find: 'MyInputConfigurator', replacement: name.replace(/.vue$/, '') }
  ])
  fs.outputFileSync(destPath, configuratorContent)
  logger.log(`file created: ${destPath}`)
}
