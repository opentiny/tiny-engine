const metaComponentsMap = new Map()

export const addMetaComponents = (components) => {
  if (Array.isArray(components)) {
    for (const { name, component } of components) {
      metaComponentsMap.set(name, component)
    }
  }
}

export const getMetaComponent = (name) => {
  return metaComponentsMap.get(name)
}
