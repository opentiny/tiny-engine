const configuratorsMap = new Map()

export const addConfigurator = (components) => {
  if (Array.isArray(components)) {
    for (const { name, component } of components) {
      configuratorsMap.set(name, component)
    }
  }
}

export const getConfigurator = (name) => {
  return configuratorsMap.get(name)
}
