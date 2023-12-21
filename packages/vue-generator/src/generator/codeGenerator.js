class CodeGenerator {
  config = {}
  genResult = []
  plugins = []
  genLogs = []
  schema = {}
  parsedSchema = {}
  context = {}
  constructor(config) {
    this.config = config
    this.plugins = config.plugins
  }
  getContext() {
    return {
      config: this.config,
      genResult: this.genResult,
      plugins: this.plugins,
      genLogs: this.genLogs,
      schema: this.schema,
      parsedSchema: this.parsedSchema,
      ...this.context
    }
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
    const hooks = ['transformStart', 'parseConfig', 'parseSchema', 'transform', 'transformEnd']
    let err = null

    this.schema = schema

    try {
      for (const hookItem of hooks) {
        const plugins = this.getPluginsByHook(hookItem)

        await this[hookItem](plugins)
      }
    } catch (error) {
      err = error
    } finally {
      const plugins = this.getPluginsByHook('transformEnd')
      await this.transformEnd(plugins, err)
    }

    return {
      genResult: this.genResult,
      genLogs: this.genLogs
    }
  }
  async transformStart(plugins) {
    for (const pluginItem of plugins) {
      await pluginItem.apply(this, [this.config])
    }
  }
  async parseConfig(plugins) {
    for (const pluginItem of plugins) {
      const newConfig = await pluginItem.apply(this, [this.config])

      if (newConfig) {
        this.config = newConfig
      }
    }
  }

  async parseSchema(plugins) {
    for (const pluginItem of plugins) {
      const parseResult = await pluginItem.apply(this, [this.schema])

      if (!parseResult?.id || !parseResult?.result) {
        continue
      }

      this.parsedSchema[parseResult.id] = parseResult.result
    }
  }
  async transform(plugins) {
    for (const pluginItem of plugins) {
      const transformRes = await pluginItem.apply(this, [this.parsedSchema])

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
      await pluginItem.apply(this, [err])
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
