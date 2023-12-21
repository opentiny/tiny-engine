function isObject(target) {
  return Object.prototype.toString.call(target) === '[object Object]'
}

export const mergeOptions = (originOptions, newOptions) => {
  if (!isObject(originOptions) || !isObject(newOptions)) {
    return originOptions
  }

  const res = {}

  for (const [key, value] of Object.entries(originOptions)) {
    if (!Object.prototype.hasOwnProperty.call(newOptions, key)) {
      res[key] = value
    }

    if (isObject(value) && isObject(newOptions[key])) {
      res[key] = mergeOptions(value, newOptions[key])
    }
  }

  for (const [key, value] of Object.entries(newOptions)) {
    if (!Object.prototype.hasOwnProperty.call(res, key)) {
      res[key] = value
    }
  }

  return res
}
