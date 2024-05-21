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
import { defineConfig } from 'vite'

const resolveViteConfig = async () => {
  const configPath = path.join(cwd(), 'engine.config.js')
  let config = {}
  try {
    const allConfig = (await import(`file://${configPath}`)).default
    config = allConfig?.viteConfig || {}
  } catch (err) {
    console.log(err)
  }
  return defineConfig(config)
}

export { resolveViteConfig }
