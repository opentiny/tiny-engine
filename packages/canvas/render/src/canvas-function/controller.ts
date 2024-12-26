const controller: Record<string, any> = {}

export const setController = (controllerData) => {
  Object.assign(controller, controllerData)
}

export const getController = () => controller
