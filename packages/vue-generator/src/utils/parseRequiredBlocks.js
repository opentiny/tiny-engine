export const parseRequiredBlocks = (schema) => {
  const res = []

  for (const item of schema?.children || []) {
    if (item.componentType === 'Block') {
      res.push(item.componentName)
    }
    if (Array.isArray(item.children)) {
      res.push(...parseRequiredBlocks(item))
    }
  }

  return res
}
