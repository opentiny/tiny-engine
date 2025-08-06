type ValidatorRule = () => void

/**
 * 参数校验类
 */
export class Validator {
  private value: any
  private label: string
  private rules: ValidatorRule[] = []

  private constructor(value: any, label: string) {
    this.value = value
    this.label = label
  }

  static check(value: any, label: string): Validator {
    return new Validator(value, label)
  }

  static batchRequired(fields: [any, string, string?][]): void {
    for (const [value, label, customMessage] of fields) {
      const msg = customMessage ?? `${label} is required.`
      new Validator(value, label).required(msg).run()
    }
  }

  // 检查是否为空
  required(message?: string): Validator {
    this.rules.push(() => {
      if (this.value === null || this.value === undefined || String(this.value).trim() === '' || !this.value) {
        throw new Error(message || `${this.label} is required`)
      }
    })
    return this
  }

  // 检查是否超过最大长度
  maxLength(max: number, message?: string): Validator {
    this.rules.push(() => {
      if (typeof this.value === 'string' && this.value.length > max) {
        throw new Error(message || `${this.label} must be at most ${max} characters long.`)
      }
    })
    return this
  }

  // 检查是否小于最小长度
  minLength(min: number, message?: string): Validator {
    this.rules.push(() => {
      if (typeof this.value === 'string' && this.value.length < min) {
        throw new Error(message || `${this.label} must be at least ${min} characters long.`)
      }
    })
    return this
  }

  // 是否是数字
  isNumber(message?: string): Validator {
    this.rules.push(() => {
      if (typeof this.value !== 'number' || isNaN(this.value)) {
        throw new Error(message || `${this.label} must be a valid number.`)
      }
    })
    return this
  }

  // 自定义
  custom(checkFn: (value: any) => boolean, message: string): Validator {
    this.rules.push(() => {
      if (!checkFn(this.value)) {
        throw new Error(message)
      }
    })
    return this
  }

  run(): void {
    for (const rule of this.rules) {
      rule()
    }
  }
}
