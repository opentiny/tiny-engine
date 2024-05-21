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
import { cwd } from 'node:process'
import path from 'node:path'
import fs from 'fs-extra'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

export default function (name) {
  const sourcePath = path.join(__dirname, '../../template')
  const destPath = path.join(cwd(), name)
  fs.copySync(sourcePath, destPath)
  console.log(
    chalk.green(`create finish, run the follow command to start project: \ncd ${name} && npm install && npm run dev`)
  )
}
