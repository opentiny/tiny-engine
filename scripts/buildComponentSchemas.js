/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

const { resolve } = require('path')
const { readdirSync, readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } = require('fs')

const dir = resolve(__dirname, '../packages/settings/design/src/assets/materials/ng-components')
const files = readdirSync(dir)
const schemas = []

files.forEach((fileName) => {
  if (/\.json$/.test(fileName)) {
    const content = readFileSync(resolve(dir, fileName)).toString()
    schemas.push(JSON.parse(content))
  }
})

const outDir = resolve(__dirname, '../dist')
const outFile = resolve(outDir, 'componentSchemas.json')

if (!existsSync(outDir)) {
  mkdirSync(outDir)
}

if (existsSync(outFile)) {
  rmSync(outFile)
}

writeFileSync(outFile, JSON.stringify(schemas, null, 2))
