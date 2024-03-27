import { templateMap } from '../templates'

function genTemplatePlugin(options = {}) {
  return {
    name: 'tinyEngine-generateCode-plugin-template',
    description: 'generate template code',
    run(schema, context) {
      if (typeof options?.template === 'function') {
        const res = options.template(schema, context)
        if (Array.isArray(res)) {
          return res
        }

        if (res?.fileContent && res?.fileName) {
          return res
        }

        return
      }

      const template = context?.template || 'default'

      if (!template) {
        return
      }

      if (typeof template === 'function') {
        context.genResult.push(...(template(schema) || []))
        return
      }

      if (templateMap[template]) {
        context.genResult.push(...templateMap[template](schema))
      }
    }
  }
}

export default genTemplatePlugin
