import colors from 'picocolors'

const logger = {}
const loggerTypes = ['info', 'warn', 'error', 'success']

const output = (type, msg) => {
  const format = () => {
    const colorMap = {
      info: 'cyan',
      warn: 'yellow',
      error: 'red',
      success: 'green'
    }
    const time = new Date().toLocaleTimeString()
    const colorMsg = colors[colorMap[type]](msg)

    return `${colors.dim(time)} ${colorMsg}`
  }

  // eslint-disable-next-line no-console
  return console.log(format())
}

loggerTypes.forEach((type) => {
  logger[type] = (msg) => output(type, msg)
})

export default logger
