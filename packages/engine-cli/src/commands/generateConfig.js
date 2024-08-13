import fs from 'fs-extra'
import path from 'path'

// 根据参数生成 config 文件内容
export const generateConfig = (options = {}) => {
  const { theme, platformId, material, scripts = [], styles = [] } = options

  const configContent = `
export default {
  id: 'engine.config',
  theme: import.meta.env.VITE_THEME || '${theme}',
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
  templatePackageJson.scripts['serve:frontend'] = templatePackageJson.scripts['serve:frontend'].replace(
    /VITE_THEME=[^\s]+/,
    `VITE_THEME=${options.theme}`
  )
  templatePackageJson.scripts.build = templatePackageJson.scripts.build.replace(
    /VITE_THEME=[^\s]+/,
    `VITE_THEME=${options.theme}`
  )
  templatePackageJson.scripts['build:alpha'] = templatePackageJson.scripts['build:alpha'].replace(
    /VITE_THEME=[^\s]+/,
    `VITE_THEME=${options.theme}`
  )

  return templatePackageJson
}
