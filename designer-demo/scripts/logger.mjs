class Logger {
  constructor(command = 'default') {
    this.command = command
    this.hasColors = this.checkColorSupport()
  }

  checkColorSupport() {
    try {
      require('colors')
      return true
    } catch (e) {
      console.warn('colors package not found, using basic logging')
      return false
    }
  }

  output(type, ...args) {  // 支持多个参数
    const time = new Date().toLocaleTimeString()
    const prefix = `[${this.command}] [${time}]`

    // 将所有参数合并为一个字符串
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2)
      }
      return String(arg)
    }).join(' ')

    if (this.hasColors) {
      const colors = require('colors')
      const colorMap = {
        info: colors.cyan,
        warn: colors.yellow,
        error: colors.red,
        success: colors.green
      }

      const coloredType = colorMap[type] ? colorMap[type](type.toUpperCase()) : type.toUpperCase()
      console.log(`${prefix} ${coloredType} ${message}`)
    } else {
      const emojiMap = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        success: '✅'
      }
      console.log(`${prefix} ${emojiMap[type] || ''} ${message}`)
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
