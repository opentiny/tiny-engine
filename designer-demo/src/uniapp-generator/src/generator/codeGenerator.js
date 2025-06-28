class CodeGenerator {
  config = {}
  genResult = []
  plugins = []
  genLogs = []
  schema = {}
  context = {}
  // 是否允许插件报错
  tolerateError = true
  error = []
  contextApi = {
    addLog: this.addLog.bind(this),
    addFile: this.addFile.bind(this),
    getFile: this.getFile.bind(this),
    replaceFile: this.replaceFile.bind(this)
  }
  constructor(config) {
    this.config = config
    this.plugins = config.plugins
    this.context = {
      ...this.context,
      ...(this.config.context || {})
    }

    if (typeof config.tolerateError === 'boolean') {
      this.tolerateError = config.tolerateError
    }
  }
  getContext() {
    return {
      config: this.config,
      genResult: this.genResult,
      genLogs: this.genLogs,
      error: this.error,
      ...this.context
    }
  }
  async generate(schema) {
    this.schema = this.parseSchema(schema)
    this.error = []
    this.genResult = []
    this.genLogs = []

    let curHookName = ''

    try {
      await this.transformStart()
      await this.transform()
    } catch (error) {
      this.error.push(error)

      if (!this.tolerateError) {
        throw new Error(
          `[codeGenerator][generate] get error when running hook: ${curHookName}. error message: ${JSON.stringify(
            error
          )}`
        )
      }
    } finally {
      await this.transformEnd()
    }

    return {
      errors: this.error,
      genResult: this.genResult,
      genLogs: this.genLogs
    }
  }
  /**
   * 转换开始的钩子，在正式开始转换前，用户可以做一些预处理的动作
   * @param {*} plugins
   */
  async transformStart() {
    for (const pluginItem of this.plugins.transformStart) {
      if (typeof pluginItem.run !== 'function') {
        continue
      }

      try {
        await pluginItem.run.apply(this.contextApi, [this.schema, this.getContext()])
      } catch (error) {
        const err = { message: error.message, stack: error.stack, plugin: pluginItem.name }
        this.error.push(err)

        if (!this.tolerateError) {
          throw new Error(`[${pluginItem.name}] throws error`, { cause: error })
        }
      }
    }
  }
  async transform() {
    for (const pluginItem of this.plugins.transform) {
      if (typeof pluginItem.run !== 'function') {
        continue
      }

      try {
        const transformRes = await pluginItem.run.apply(this.contextApi, [this.schema, this.getContext()])

        if (!transformRes) {
          continue
        }

        if (Array.isArray(transformRes)) {
          this.genResult.push(...transformRes)
        } else {
          this.genResult.push(transformRes)
        }
      } catch (error) {
        const err = { message: error.message, stack: error.stack, plugin: pluginItem.name }
        this.error.push(err)

        if (!this.tolerateError) {
          throw new Error(`[${pluginItem.name}] throws error`, { cause: error })
        }
      }
    }
  }
  async transformEnd() {
    for (const pluginItem of this.plugins.transformEnd) {
      if (typeof pluginItem.run !== 'function') {
        continue
      }

      try {
        await pluginItem.run.apply(this.contextApi, [this.schema, this.getContext()])
      } catch (error) {
        const err = { message: error.message, stack: error.stack, plugin: pluginItem.name }
        this.error.push(err)

        if (!this.tolerateError) {
          throw new Error(`[${pluginItem.name}] throws error`, { cause: error })
        }
      }
    }
  }
  parseSchema(schema) {
    if (!schema) {
      throw new Error(
        '[codeGenerator][generate] parseSchema error, schema is not valid, should be json object or json string.'
      )
    }

    try {
      return typeof schema === 'string' ? JSON.parse(schema) : schema
    } catch (error) {
      throw new Error(
        '[codeGenerator][generate] parseSchema error, schema is not valid, please check the input params.'
      )
    }
  }
  /**
   * 写入 log
   * @param {*} log
   */
  addLog(log) {
    this.genLogs.push(log)
  }
  getFile(path, fileName) {
    return this.genResult.find((item) => item.path === path && item.fileName === fileName)
  }
  addFile(file, override) {
    const { path, fileName } = file

    const isExist = this.getFile(path, fileName)

    if (isExist && !override) {
      return false
    }

    if (isExist) {
      this.replaceFile(file)

      return true
    }

    this.genResult.push(file)

    return true
  }
  deleteFile(file) {
    const { path, fileName } = file
    const index = this.genResult.findIndex((item) => item.path === path && item.fileName === fileName)

    if (index !== -1) {
      this.genResult.splice(index, 1)
      return true
    }

    return false
  }
  replaceFile(resultItem) {
    const { path, fileName } = resultItem

    const index = this.genResult.findIndex((item) => item.path === path && item.fileName === fileName)

    if (index === -1) {
      return false
    }

    this.genResult.splice(index, 1, resultItem)

    return true
  }
}

export default CodeGenerator
