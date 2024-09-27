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

/**
 *
 * @param {Record<string,any>} obj
 * @param {string} path
 * @param {*} valueOrSetter
 * @returns
 */
const setObjectNestedValue = (obj, path, valueOrSetter) => {
  if (!path.includes('.')) {
    if (typeof valueOrSetter === 'function') {
      obj[path] = valueOrSetter(obj[path])
    } else {
      obj[path] = valueOrSetter
    }
    return
  }

  const [prop, restPath] = path.split('.', 2)

  if (obj[prop] === undefined) {
    obj[prop] = {}
  }

  if (obj[prop] && typeof obj[prop] === 'object') {
    setObjectNestedValue(obj[prop], restPath, valueOrSetter)
  }
}

/**
 *
 * @param {string} templatePath
 * @param {{find: string; replacement: any}[]} replacements
 */
export const generateJSON = (templatePath, replacements) => {
  const json = fs.readJSONSync(templatePath)

  for (const { find, replacement } of replacements) {
    setObjectNestedValue(json, find, replacement)
  }

  return json
}

/**
 *
 * @param {string} templatePath
 * @param {{find: string; replacement: any}[]} replacements
 */
export const generateText = (templatePath, replacements) => {
  let text = fs.readFileSync(templatePath).toString()

  for (const { find, replacement } of replacements) {
    text = text.replace(find, replacement)
  }

  return text
}

// 根据参数修改 package.json
export const generatePackageJson = (name, options, templatePath) => {
  const replacements = [
    {
      find: 'name',
      replacement: name
    },
    {
      find: 'scripts.serve:frontend',
      replacement: (s) => s.replace(/VITE_THEME=[^\s]+/, `VITE_THEME=${options.theme}`)
    },
    {
      find: 'scripts.build',
      replacement: (s) => s.replace(/VITE_THEME=[^\s]+/, `VITE_THEME=${options.theme}`)
    },
    {
      find: 'scripts.build:alpha',
      replacement: (s) => s.replace(/VITE_THEME=[^\s]+/, `VITE_THEME=${options.theme}`)
    }
  ]

  return generateJSON(path.resolve(templatePath, 'package.json'), replacements)
}
