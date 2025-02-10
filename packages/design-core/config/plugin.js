import addons from './addons'

const plugin = {}
addons.plugins.forEach((item) => {
  plugin[item.id] = item
})

export const getPlugin = (pluginName) => {
  return plugin[pluginName] || null
}
export const getPluginById = (pluginId) => {
  return Object.values(plugin).find((item) => item.id === pluginId) || null
}
