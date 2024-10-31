// 需要选择性为文件注入 scope
export const fileScope = {
  'App.jsx': ['Main.jsx'],
  'dataSourceMap.js': ['dataSources.js'],
  'lowcode.js': ['dataSourceMap.js', 'utils.js', 'bridge.js', 'storesHelper.js'],
  'storesHelper.js': ['stores.js']
}
