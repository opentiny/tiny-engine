import replace from '@rollup/plugin-replace'

export function treeShakingPlugin(removedRegistry) {
  const envReplace = {}
  Object.entries(removedRegistry).forEach(([key, value]) => {
    envReplace[`__TINY_ENGINE_REMOVED_REGISTRY["${key}"]`] = value
  })
  return replace({
    values: {
      ...envReplace
    },
    delimiters: ['', '']
  })
}
