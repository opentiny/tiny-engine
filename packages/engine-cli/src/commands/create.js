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
import { generateConfig, generatePackageJson } from './generateConfig'

const logger = console

const defaultOptions = {
  theme: 'light',
  platformId: 918,
  material: ['/mock/bundle.json'],
  scripts: [],
  styles: []
}

export function createPlatform(name, options = {}) {
  if (fs.pathExistsSync(path.join(cwd(), name))) {
    logger.log(chalk.red(`create failed, because the ${name} folder already exists. 创建失败，${name} 文件夹已存在。`))
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

  fs.outputFileSync(path.resolve(destPath, 'engine.config.js'), configContent)
  fs.outputJSONSync(path.resolve(destPath, 'package.json'), pkgContent, { spaces: 2 })

  logger.log(
    chalk.green(`create finish, run the follow command to start project: \ncd ${name} && npm install && npm run dev`)
  )
}

export function createPlugin(name) {
  const sourcePath = path.join(__dirname, '../template/plugin/')
  const destPath = path.join(cwd(), name)
  fs.copySync(sourcePath, destPath)

  logger.log(
    chalk.green(`create finish, run the follow command to start project: \ncd ${name} && npm install && npm run dev`)
  )
}
