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

const path = require('path')
const fse = require('fs-extra')

const removeDir = (dir) => {
  if (fse.existsSync(dir)) {
    fse.removeSync(dir)
  }
}

const moveDir = (src, dest) => {
  if (fse.existsSync(src)) {
    fse.moveSync(src, dest, {
      overwrite: true
    })
  }
}

const copyDir = (src, dest) => {
  if (fse.existsSync(src)) {
    fse.copySync(src, dest, {
      overwrite: true
    })
  }
}

const run = () => {
  const vscodeDir = path.resolve('/Tiny/lowcode-vscode/packages/vsix-crm/project/public/editor')

  moveDir(path.join(__dirname, '../dist/editor/monaco-workers'), path.join(__dirname, '../dist/monaco-workers'))
  removeDir(path.join(__dirname, '../dist/angular'))
  removeDir(path.join(__dirname, '../dist/editor'))
  removeDir(path.join(__dirname, '../dist/img-crm'))
  removeDir(path.join(__dirname, '../dist/mock'))
  removeDir(vscodeDir)
  copyDir(path.join(__dirname, '../dist'), vscodeDir)
}

run()
