class CodeGenerator {
  config = {}
  genResult = []
  plugins = []
  genLogs = []
  schema = {}
  context = {}
  // 是否允许插件报错
  tolerateError = true
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
      ...this.context
    }
  }
  /**
   * 写入 log
   * @param {*} log
   */
  addGenLogs(log) {
    this.genLogs.push(log)
  }
  /**
   * 覆写 config
   * @param {*} newConfig
   */
  overrideConfig(newConfig) {
    this.config = newConfig
  }
  /**
   * 覆写 schema
   * @param {*} newSchema
   */
  overrideSchema(newSchema) {
    this.schema = newSchema
  }
  getPluginsByHook(hookName) {
    const res = []

    for (const pluginItem of this.plugins) {
      if (typeof pluginItem[hookName] === 'function') {
        res.push(pluginItem[hookName])
      }
    }

    return res
  }
  async generate(schema) {
    const hooks = ['transformStart', 'transform', 'transformEnd']

    this.schema = this.parseSchema(schema)

    let err = []
    let curHookName = ''

    try {
      for (const hookItem of hooks) {
        curHookName = hookItem
        const plugins = this.getPluginsByHook(hookItem)

        await this[hookItem](plugins)
      }
    } catch (error) {
      err.push(error)

      if (!this.tolerateError) {
        throw new Error(
          `[codeGenerator][generate] get error when running hook: ${curHookName}. error message: ${JSON.stringify(
            error
          )}`
        )
      }
    } finally {
      const plugins = this.getPluginsByHook('transformEnd')
      await this.transformEnd(plugins, err)
    }

    return {
      genResult: this.genResult,
      genLogs: this.genLogs
    }
  }
  /**
   * 转换开始的钩子，在正式开始转换前，用户可以做一些预处理的动作
   * @param {*} plugins
   */
  async transformStart(plugins) {
    for (const pluginItem of plugins) {
      await pluginItem(this.config, this.getContext())
    }
  }
  async transform(plugins) {
    for (const pluginItem of plugins) {
      const transformRes = await pluginItem(this.schema, this.getContext())

      if (!transformRes) {
        return
      }

      if (Array.isArray(transformRes)) {
        this.genResult.push(...transformRes)
      } else {
        this.genResult.push(transformRes)
      }
    }
  }
  async transformEnd(plugins, err) {
    for (const pluginItem of plugins) {
      await pluginItem(err)
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
  replaceGenResult(resultItem) {
    const { path, fileName } = resultItem

    const index = this.genResult.findIndex((item) => item.path === path && item.fileName === fileName)

    if (index === -1) {
      return
    }

    this.genResult.splice(index, 1, resultItem)
  }
}

export default CodeGenerator
