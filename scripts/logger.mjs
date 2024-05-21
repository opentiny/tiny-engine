import colors from 'picocolors'

class Logger {
  constructor(command) {
    this.command = command
  }

  output(type, msg) {
    const format = () => {
      const colorMap = {
        info: 'cyan',
        warn: 'yellow',
        error: 'red',
        success: 'green'
      }
      const time = new Date().toLocaleTimeString()
      const colorMsg = colors[colorMap[type]](type)

      return `[${this.command}] [${colors.dim(time)}] ${colorMsg} ${msg}`
    }

    // eslint-disable-next-line no-console
    return console.log(format())
  }

  info(msg) {
    this.output('info', msg)
  }

  warn(msg) {
    this.output('warn', msg)
  }

  error(msg) {
    this.output('error', msg)
  }

  success(msg) {
    this.output('success', msg)
  }
}

export default Logger
