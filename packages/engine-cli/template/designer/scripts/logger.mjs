const log = (() => {
  return (...args) => {
    process.stdout.write(
      args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ') + '\n'
    )
  }
})()

const warn = (() => {
  return (...args) => {
    process.stderr.write(
      args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ') + '\n'
    )
  }
})()

class Logger {
  constructor(command = 'default') {
    this.command = command
    this.colors = null
    this.hasColors = false
    this.initColors()
  }

  async initColors() {
    try {
      const colorsModule = await import('colors')
      this.colors = colorsModule.default || colorsModule
      this.hasColors = true
    } catch (err) {
      warn('colors package not found, using basic logging')
      this.hasColors = false
    }
  }

  output(type, ...args) {
    const time = new Date().toLocaleTimeString()
    const prefix = `[${this.command}] [${time}]`
    const message = args
      .map((arg) => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2)
        }
        return String(arg)
      })
      .join(' ')

    const outputFn = type === 'error' || type === 'warn' ? warn : log

    if (this.hasColors && this.colors) {
      const colorMap = {
        info: this.colors.cyan,
        warn: this.colors.yellow,
        error: this.colors.red,
        success: this.colors.green
      }
      const coloredType = colorMap[type] ? colorMap[type](type.toUpperCase()) : type.toUpperCase()

      outputFn(`${prefix} ${coloredType} ${message}`)
    } else {
      const emojiMap = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        success: '✅'
      }
      outputFn(`${prefix} ${emojiMap[type] || ''} ${message}`)
    }
  }

  success(...args) {
    this.output('success', ...args)
  }

  info(...args) {
    this.output('info', ...args)
  }

  warn(...args) {
    this.output('warn', ...args)
  }

  error(...args) {
    this.output('error', ...args)
  }
}

export default Logger
