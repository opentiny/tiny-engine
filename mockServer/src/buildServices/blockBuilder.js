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
import { promisify } from 'util'
import fs from 'fs-extra'
import logger from '../logger'
import config from '../config'
import VueBlockBuilder from './vueBlockBuilder'
import { findAllContentBlocks } from '../tool/manageContentBlocks'
import { E_TASK_STATUS } from '../tool/constants'

const { glob } = require('glob')
const globPromise = promisify(glob)
export default class BlockBuilder {
  unpkgBaseUrl = 'https://registry.npmmirror.com'
  pkgName
  failedMessage
  // 将服务分为两种，一种是BuildService , 一种是操作数据库的DataService
  constructor(injectServices) {
    this.config = config
    this.injectServices = injectServices
  }
  async start(blockId, taskId, body) {
    logger.info('开始区块构建', blockId, taskId)
    const { blockService, taskService } = this.injectServices
    // 查询区块数据
    const { data: block } = await blockService.detail(blockId)
    await taskService.update({
      id: taskId,
      progress: 'generating code',
      taskStatus: E_TASK_STATUS.RUNNING
    })

    const {
      message,
      block: { content, ...others },
      version: blockVersion,
      needToSave
    } = body

    await taskService.update({
      id: taskId,
      progress: 'generating code',
      taskStatus: E_TASK_STATUS.RUNNING
    })

    const modifiedBlock = { ...block, ...others, id: blockId, version: blockVersion }

    try {
      // 调用DSL转换方法生成代码
      const sourceCode = await this.translate(modifiedBlock, { content })
      await taskService.update({
        id: taskId,
        progress: 'generating code completed',
        progress_percent: 10
      })
      // 执行构建并根据构建结果更新区块状态以及任务信息
      const { filesPath, versions } = await this.buildWebComponent(sourceCode, modifiedBlock, taskId, blockVersion)
      if (!filesPath) {
        // 上传unpkg 失败
        throw new Error(`Failed to publish "${this.pkgName}" to registry, detial: ${this.failedMessage}`)
      }
      const buildResult = { result: true, versions, endTime: new Date().toLocaleString() }

      const buildInfo = {
        buildResult,
        message,
        filesPath,
        taskId
      }

      await this.afterBuildSuccess(buildInfo, modifiedBlock, needToSave)
    } catch (error) {
      await this.afterBuildFailed(blockId, taskId, error)
    }
  }
  // 构建成功处理的方法
  async afterBuildSuccess(buildInfo, blockInfo, needToSave = false) {
    const {
      content,
      screenshot,
      path: blockPath,
      id: blockId,
      version: blockVersion,
      label,
      i18n = null,
      created_app
    } = blockInfo

    const { blockBuildService, blockHistory } = this.injectServices

    const { message, filesPath, buildResult, taskId } = buildInfo

    // 查询当前区块及其全部子区块的content_blocks
    const blockContentBlocks = await findAllContentBlocks(blockId)
    const { data: history } = await blockHistory.create({
      message,
      content,
      screenshot,
      path: blockPath,
      assets: filesPath,
      build_info: buildResult,
      block_id: Number(blockId),
      version: blockVersion,
      label,
      npm_name: this.pkgName,
      i18n,
      created_app,
      content_blocks: blockContentBlocks?.content_blocks ?? null
    })

    const { data: histories } = await this.injectServices.blockHistoryService.find({ block: blockId })
    const blockData = {
      ...blockInfo,
      id: blockId,
      assets: filesPath,
      // histories: [...histories.map(({ id }) => id), history.id], // 更新区块关联的历史记录
      current_history: history.id,
      last_build_info: buildInfo,
      npm_name: this.pkgName
    }

    if (needToSave) {
      blockData.content = content
    }

    await this.injectServices.blockService.update(blockData)
    await this.injectServices.taskService.update({
      id: taskId,
      progress_percent: 100,
      taskResult: JSON.stringify({ result: 'block building completed' }),
      taskStatus: E_TASK_STATUS.FINISHED
    })
  }

  // 错误处理统一方法
  async afterBuildFailed(blockId, taskId, error) {
    logger.error(`build block ${blockId} error:`, error)
    const { blockService, taskService } = this.injectServices
    const buildInfo = { result: false, message: error.message, endTime: new Date().toLocaleString() }
    await blockService.update({
      id: blockId,
      last_build_info: buildInfo
    })
    await taskService.update({
      id: taskId,
      taskStatus: E_TASK_STATUS.STOPPED,
      taskResult: JSON.stringify({ result: error.message })
    })
  }

  async buildWebComponent(sourceCode, block, taskId, version) {
    const { framework = 'Vue', label } = block
    const BuildService = {
      Vue: VueBlockBuilder
    }
    const { taskService } = this.injectServices
    // 初始化构建目录
    const service = new BuildService[framework]()
    try {
      await taskService.update({ id: taskId, progress: 'installing deps' })
      await service.init()
      await taskService.update({ id: taskId, progress: 'deps installed', progress_percent: 40 })
      const config = await service.readConfig()
      // 写入口文件
      if (service.writeEntryFile) {
        await service.writeEntryFile(block, config.path, version)
      }
      // 注入代码
      await service.injectCodeFile(sourceCode, config.path)
      await taskService.update({ id: taskId, progress: 'code injected', progress_percent: 50 })
      // 写配置
      const className = this.kebabToPascalCase(label)
      config.data = {
        type: 'block',
        block: {
          name: label,
          selector: label,
          className,
          componentPath: sourceCode.find((c) => c.type === 'Block')?.filePath ?? '' // 指定block路径
        }
      }
      await this.injectServices.taskService.update({ id: taskId, progress: 'write config', progress_percent: 55 })
      await service.writeConfig(JSON.stringify(config, null, 2))
      await this.injectServices.taskService.update({ id: taskId, progress: 'building', progress_percent: 60 })
      // 清理dist目录
      service.clearDist()
      // 构建
      await service.build()
      await taskService.update({ id: taskId, progress: 'building completed', progress_percent: 80 })
      // 返回静态资源输出路径
      const distPath = service.getDist()
      // 转换config.umd.min.js配置文件为 bundle.json
      await service.parseConfig(distPath)
      // 发布区块到 cnpm
      const filesPath = await this.publish(distPath, block, version)
      // 获取构建原料版本
      const versions = service.getBuildInfo([BuildService[framework].baseNpm])
      return { filesPath, versions }
    } finally {
      await service.clear()
    }
  }

  async kebabToPascalCase(label) {
    return label.replace(/-(\w)/g, (_, char) => char.toUpperCase())
  }

  /**
   *
   * @param block 区块记录
   * @param history 区块关联的历史记录
   * @returns 转换后的代码
   */
  async translate(block, history) {
    if (!block) {
      throw new Error('block undefined, check block content format')
    }
    const { label } = block

    // 使用历史记录中的schema做转换
    const { content } = history
    if (!content) {
      throw new Error('unexpected history content')
    }

    // 获取嵌套的区块
    const innerBlocksLabel = []
    this.traverseBlocks(content, innerBlocksLabel)
    const innerBlocks = innerBlocksLabel.length
      ? await this.injectServices.blockService.find({ label_in: innerBlocksLabel })
      : { data: [] }
    let blocksData = []
    /* if (innerBlocks.error) {
      logger.error(innerBlocks.error.message)
      throw new Error('strapi query blocks by label failed')
    } else {
      blocksData = innerBlocks.data.map(({ content, label }) => ({ content, label })).filter((b) => b.label !== label)
    }*/

    const { generateCode } = require('@opentiny/tiny-engine-dsl-vue')
    const result = generateCode({ pageInfo: { schema: content, name: label }, blocksData })
    return result
  }

  isBlock(schema) {
    return schema && schema.componentType === 'Block'
  }

  traverseBlocks(schema, blocks) {
    if (Array.isArray(schema)) {
      schema.forEach((prop) => this.traverseBlocks(prop, blocks))
    } else if (typeof schema === 'object') {
      if (this.isBlock(schema) && !blocks.includes(schema.componentName)) {
        blocks.push(schema.componentName)
      }
      if (Array.isArray(schema.children)) {
        this.traverseBlocks(schema.children, blocks)
      }
    }
  }

  async publish(folder, blockInfo, version) {
    const { isSuccess, message } = await this.publishPackage(folder, blockInfo, version)
    if (!isSuccess) {
      this.failedMessage = message
      return null
    }
    const prefix = `${this.unpkgBaseUrl}/${this.pkgName}@${version}`
    const files = await globPromise(`**/*.*`, {
      cwd: folder
    })
    return this.filterFiles(files, prefix)
  }

  // 过滤文件
  filterFiles(files, baseUrl) {
    const filesPath = {
      material: [],
      scripts: [],
      styles: []
    }
    for (const file of files) {
      file.endsWith('.json') && !file.endsWith('package.json') && filesPath.material.push(`${baseUrl}/${file}`)
      file.endsWith('.js') && filesPath.scripts.push(`${baseUrl}/${file}`)
      file.endsWith('.css') && filesPath.styles.push(`${baseUrl}/${file}`)
    }
    return filesPath
  }

  // 将代码发布到registry
  async publishPackage(folder, blockInfo, version) {
    const pkgJson = this.generatePackageJson(blockInfo, version)
    const { cnpmService } = this.injectServices
    await fs.writeJson(path.resolve(folder, './package.json'), pkgJson)
    const loginInRes = await cnpmService.loginInNpm(folder)
    if (!loginInRes.isSuccess) {
      return loginInRes
    }
    return cnpmService.publishCnpm(folder)
  }

  // 生成npm 包的package.json
  generatePackageJson(blockInfo, version) {
    let { label, id } = blockInfo
    label = label.replace(/\W|_/g, '').toLocaleLowerCase() || 'default'
    const env = 'alpha' || 'dev'
    const name = `@opentiny/tinyengine-${env}-block-${label}-${id}` // TODO 发包的名称看情况更改
    this.pkgName = name
    return {
      name,
      version,
      description: '',
      main: '',
      keywords: [],
      author: '',
      license: 'ISC'
    }
  }
}
