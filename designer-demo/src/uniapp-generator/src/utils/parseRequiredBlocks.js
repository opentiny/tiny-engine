export const parseRequiredBlocks = (schema) => {
  const res = []

  if (!Array.isArray(schema?.children)) {
    return res
  }

  for (const item of schema.children) {
    if (item.componentType === 'Block') {
      res.push(item.componentName)
    }
    if (Array.isArray(item.children)) {
      res.push(...parseRequiredBlocks(item))
    }
  }

  return res
}
