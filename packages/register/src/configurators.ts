const configuratorsMap = new Map()

export const addConfigurator = (components: { name: string; component: any }[]) => {
  // TODO: 数据结构校验&错误抛出
  if (Array.isArray(components)) {
    for (const { name, component } of components) {
      configuratorsMap.set(name, component)
    }
  }
}

export const getConfigurator = (name: string) => {
  return configuratorsMap.get(name)
}
