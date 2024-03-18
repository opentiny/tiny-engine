import { templateMap } from '../templates'

function genTemplatePlugin() {
  return {
    name: 'tinyEngine-generateCode-plugin-template',
    description: 'generate template code',
    run(schema, context) {
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
