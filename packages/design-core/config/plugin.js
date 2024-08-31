import addons from './addons'

const plugin = {}
addons.plugins.forEach((item) => {
  plugin[item.id] = item
})

export const getPlugin = (pluginName) => {
  return plugin[pluginName] || null
}
