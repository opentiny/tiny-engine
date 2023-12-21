import { mergeOptions } from '../utils/mergeOptions'
import { templateMap } from '../templates'

const defaultOption = {}

function genTemplatePlugin(options = {}) {
  // 保留，用作拓展配置用途
  const realOptions = mergeOptions(defaultOption, options)

  return {
    name: 'tinyengine-plugin-generatecode-template',
    description: 'generate template code',
    transform() {
      const meta = this.schema.appMeta
      const { template } = meta

      if (!template) {
        return
      }

      if (typeof template === 'function') {
        return template(meta)
      }

      if (templateMap[template]) {
        return templateMap[template](meta)
      }
    }
  }
}

export default genTemplatePlugin
