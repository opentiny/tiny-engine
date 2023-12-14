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

import * as path from 'path'
import * as fs from 'fs-extra'
import spawn from 'cross-spawn'
import config from '../config'
import logger from '../logger'
export default class VueBlockBuilder {
  base = config.buildground
  baseNpm = config.baseNpm
  framework = 'Vue'
  timeStamp = Date.now()
  buildGround = ''

  getBuildInfo(pkgNames) {
    try {
      return pkgNames.map((name, index) => {
        let pkgJson = {}
        if (!index) {
          pkgJson = require(path.join(this.getBuildGround(), 'package.json'))
        } else {
          pkgJson = require(path.join(this.getBuildGround(), 'node_modules', name, 'package.json'))
        }
        return `${name}@${pkgJson.version}`
      })
    } catch (error) {
      logger.error('read package version failed', error)
      return []
    }
  }

  async init() {
    const buildGround = this.getBuildGround()
    const baseNpm = this.baseNpm
    await fs.ensureDir(buildGround)
    await this.spawnCommand(['npm', 'set', 'progress=false'], {
      cwd: buildGround
    })
    await this.spawnCommand(['npm', 'init', '-y'], { cwd: buildGround })
    const registries = config.registryOptions
    await this.spawnCommand(['npm', 'pack', baseNpm, ...registries, '--strict-ssl=false'], {
      cwd: buildGround
    })
    const tgz = await this.findTgz(buildGround)
    // 解压tgz包
    await this.spawnCommand(['tar', '-xzvf', tgz], { cwd: buildGround })
    await fs.copy(path.join(buildGround, 'package'), buildGround)
    await this.spawnCommand(
      ['npm', 'install', ...registries, '--no-audit', '--no-fund', '--production=false', '--strict-ssl=false'],
      {
        cwd: buildGround
      }
    )
  }

  // 向构建脚手架工程中注入区块差异性代码
  async injectCodeFile(sourceCode, srcPath) {
    const sourceCodeDir = path.join(this.getBuildGround(), srcPath)
    for (const { panelName, panelValue, filePath } of sourceCode) {
      await fs.outputFile(path.join(sourceCodeDir, filePath, panelName), panelValue)
    }
  }

  // 设置环境变量
  async setEnv(key, value) {
    await fs.outputFile(path.join(this.getBuildGround(), '.env'), `${key}=${value}`)
  }

  // 执行构建方法
  async build() {
    await this.spawnCommand(['npm', 'run', 'build:block'], { cwd: this.getBuildGround() })
  }

  // 获取dist目录
  getDist() {
    return path.join(this.getBuildGround(), 'dist')
  }

  // 清理dist目录
  clearDist() {
    const distPath = this.getDist()
    fs.removeSync(distPath)
    fs.ensureDirSync(distPath)
  }

  // 清理构建目录
  async clear() {
    await fs.remove(this.getBuildGround())
  }

  // 获取构建产物目录
  async readConfig() {
    return { path: path.join('src', 'block', 'generated') }
  }

  // 保存bundle.json
  parseConfig(distPath) {
    const configPath = path.join(distPath, 'config.umd.min.js')
    const bundlePath = path.join(distPath, 'bundle.json')
    if (fs.existsSync(bundlePath) || !fs.existsSync(configPath)) {
      return
    }
    const config = require(configPath)
    const bundleJson = {
      data: {
        framework: this.framework,
        materials: {
          blocks: [config]
        }
      }
    }
    fs.writeJSONSync(path.join(distPath, 'bundle.json'), bundleJson)
  }

  // 获取tgz路径
  async findTgz(dir) {
    const fileList = await fs.readdir(dir)
    return fileList.find((file) => /^tiny-engine-blockToWebComponentTemplate.*\.tgz$/.test(file)) || '' //TODO 这里匹配的是包tgz文件的名称，择机替换为opentiny的
  }

  // 执行命令
  async spawnCommand(command, options) {
    const [cmd, ...params] = command
    return new Promise((resolve, reject) => {
      const task = spawn(cmd, params, { ...options })
      let stderr = ''
      task.on('close', (code) => {
        if (code === 0) {
          return resolve({ success: true })
        }
        return reject(new Error(stderr.trim()))
      })
      task.on('error', reject)
      task.stderr?.on('data', (chunk) => {
        stderr += chunk
      })
      task.stdout?.pipe(process.stdout)
      task.stderr?.pipe(process.stderr)
    })
  }

  // 获取构建目录
  getBuildGround() {
    if (!this.buildGround) {
      this.buildGround = path.join(this.base, 'buildground_' + Date.now())
    }
    return this.buildGround
  }

  writeConfig(content) {
    return fs.writeFile(path.join(this.getBuildGround(), 'webcomps-block.config.json'), content, 'utf8')
  }

  /**
   * 生成区块入口文件，覆写原有文件
   * @param {any} dataInfo 参与渲染入口文件的数据信息
   * @param {string} srcPath 保存文件的项目内地址
   * @param {string} version 区块版本信息
   * @return { Promise<any> }
   */
  writeEntryFile(blockInfo, srcPath, version) {
    const { label: blockName, id: blockId } = blockInfo
    const styles = blockInfo.content?.dependencies?.styles?.map((style) => `'${style}'`)
    const content = `import { hyphenate } from '@vue/shared'
import { defineCustomElement } from '@opentiny/tiny-engine-webcomponent-core'  
import block from './components/${blockName}.vue'

window.TinyLowcodeResource = window.TinyLowcodeResource || {}

const blockName = hyphenate('${blockName}')

block.blockId = ${blockId};
block.blockVersion = '${version}';

if (customElements.get(blockName)) {
  if (window.TinyLowcodeResource[blockName]) {
    Object.assign(window.TinyLowcodeResource[blockName], block)
  }
} else {
  block.links = process.env.VUE_APP_UI_LIB_FULL_STYLE_FILE_URL
  ${styles ? `block.links.push(${styles})` : ''}
  block.styles = ['svg { width: 10px; height: 10px; }', ...(block.styles || [])]
  window.TinyLowcodeResource[blockName] = block
  customElements.define(blockName, defineCustomElement(block))
}

export default block`
    return fs.writeFile(path.join(this.getBuildGround(), srcPath, 'lib.js'), content, 'utf8')
  }
}
