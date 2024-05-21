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

import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
import * as globby from 'globby'
import { Command } from 'commander'
import * as path from 'path'
import chalk from 'chalk'
import create from './commands/create.js'
import serve from './commands/serve.js'
import build from './commands/build.js'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)
const program = new Command()

let commandsPath = []
let pkgVersion = ''
let pkgName = ''

// 获取当前包的信息
const getPkgInfo = () => {
  const jsonPath = path.join(__dirname, '../package.json')
  const jsonResult = fs.readJSONSync(jsonPath)
  pkgVersion = jsonResult.version
  return pkgVersion
}

program
  .command('create <name>')
  .description('创建一个新工程')
  .action((name) => {
    create(name)
  })

program
  .command('serve')
  .description('开启服务')
  .action(() => {
    serve()
  })

program
  .command('build')
  .description('构建')
  .action(() => {
    build()
  })

program.parse(process.argv)
