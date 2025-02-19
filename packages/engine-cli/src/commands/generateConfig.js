import fs from 'fs-extra'
import path from 'path'

// 根据参数生成 config 文件内容
export const generateConfig = (options = {}) => {
  const { theme, platformId, material, scripts = [], styles = [] } = options

  const configContent = `
export default {
  id: 'engine.config',
  theme: '${theme}',
  material: ${JSON.stringify(material)},
  scripts: ${JSON.stringify(scripts)},
  styles: ${JSON.stringify(styles)},
  platformId: ${platformId}
}
`

  return configContent
}

// 根据参数修改 package.json
export const generatePackageJson = (name, options, templatePath) => {
  const templatePackageJson = fs.readJSONSync(path.resolve(templatePath, 'package.json'))

  templatePackageJson.name = name

  return templatePackageJson
}
