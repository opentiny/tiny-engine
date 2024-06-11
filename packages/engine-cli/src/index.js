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
import { Command } from 'commander'
import create from './commands/create.js'

const __filename = fileURLToPath(import.meta.url)

const program = new Command()

program
  .command('create <name>')
  .description('创建一个新工程')
  .action((name) => {
    create(name)
  })

program.parse(process.argv)
