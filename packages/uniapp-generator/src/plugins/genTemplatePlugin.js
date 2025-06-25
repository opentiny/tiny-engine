import { getTemplate } from '../templates/uniapp-template'

/**
 * 生成UniApp项目模板的插件
 * @param {Object} options 配置项
 * @returns {Function} 插件函数
 */
export function genTemplatePlugin(options = {}) {
  return {
    name: 'genTemplatePlugin',
    transform(schema, { addFile }) {
      const template = getTemplate(schema)
      
      // 添加基础配置文件
      Object.keys(template).forEach(filePath => {
        addFile(filePath, template[filePath])
      })
    }
  }
}