/**
 * Used for visit ast
 */

import { Python3Visitor } from 'dt-python-parser'
/**
 * @type {Set<string>}
 */
const classNames = new Set()

/**
 * @type {Map<string, Map<string, [string,string][]>}
 */
const clazzFnMemberRecord = new Map()
const visitor = (children, _that) => {
  for (const child of children) {
    if (child.children && child.children.length) {
      child.accept(_that)
    }
  }
}
export class Visitor extends Python3Visitor {
  activeClass = ''
  activeFn = ''
  /**
   * @type {[string,string][]}
   */
  activeArgs = []
  visitClassdef(ctx) {
    if (!ctx.children) {
      return []
    }
    const clazzIdentifierIdx = ctx.children
      .map((child, idx) => {
        if (child.children && child.children.length) {
          return child.accept(this)
        }
        return child.getText() === 'class' ? idx : -1
      })
      .flat(Infinity)
      .filter((idx) => idx > -1 && idx !== undefined)
    if (!clazzIdentifierIdx.length) {
      return []
    }
    for (const idx of clazzIdentifierIdx) {
      /**
       * @type {string|undefined}
       */
      const clazzName = ctx.children[idx + 1].getText()
      if (!classNames.has(ctx.children[idx + 1]) && classNames !== undefined) {
        classNames.add(clazzName)
      }
    }
  }
  visitFuncdef(ctx) {
    const name = ctx.children[1]?.getText()
    this.activeFn = name
    visitor(ctx.children, this)
    while (ctx.parentCtx) {
      ctx = ctx.parentCtx
      if (ctx.ruleIndex === 77) {
        break
      }
    }
    const className = ctx.children[1]?.getText?.()
    if (className) {
      let fnMember = clazzFnMemberRecord.get(className)
      if (!clazzFnMemberRecord.get(className)) {
        clazzFnMemberRecord.set(className, new Map())
        fnMember = clazzFnMemberRecord.get(className)
      }
      fnMember.set(this.activeFn, [...this.activeArgs])
      this.activeArgs = []
    }
  }
  visitParameters(ctx) {
    visitor(ctx.children, this)
  }
  visitTfpdef(ctx) {
    const types = ctx.getText().split(':')
    const name = types[0]
    const type = types[1] ?? 'any'
    this.activeArgs.push([name, type])
  }
}

/**
 * @description
 * 例如 `{direction:'left'}|{getDirection:()=>string}` 是和类型
 *
 * 但 `{direction:'left'}&{getDirection:()=>string}` 不是和类型，因为是积类型
 * @param {string} typeString
 * @returns {boolean}
 */
const isSumType = (typeString) => typeString.includes('|')
/**
 * @description
 * 例如 `{direction:'left'}&{getDirection:()=>string}` 是积类型
 *
 * 但 `{direction:'left'}|{getDirection:()=>string}` 不是, 它是和类型
 * @param {string} typeString
 * @returns boolean
 */
const isProductType = (typeString) => typeString.includes('&')

const levelType = {
  any: 1000000,
  string: 9,
  object: 9,
  ParamAttr: 9,
  number: 8,
  boolean: 7
}

/**
 *
 * @param {string} type
 * @returns {string}
 */
const standardizationType = (type) => {
  /**
   * @param {string} type
   */
  const standardizationTypeName = (type) => {
    if (type === 'ParamAttr') {
      return type
    }
    let _type = type.toLowerCase()
    if (_type === 'any') {
      return 'any'
    }
    if (_type.startsWith('str')) {
      return 'string'
    }
    if (_type === 'int' || _type === 'float') {
      return 'number'
    }
    if (_type.startsWith('obj')) {
      return 'object'
    }
  }
  if (!isSumType(type) && !isProductType(type)) {
    return standardizationTypeName(type)
  }
  const typeStack = type
    .split('&')
    .map((v) => v.split('|'))
    .flat(Infinity)
  const typeLevelTable = typeStack.map((type) => {
    return {
      coin: levelType[type] ?? 0,
      val: type
    }
  })
  return typeLevelTable.sort((a, b) => a.coin - b.coin)[0]
}

/**
 * @param {[string,string][]} args
 */
const toProperty = (args) => {
  return args.map(
    /**
     *
     * @param {[string, strig]} param0
     * @returns {import('./useX6').Property}
     */
    ([argName, argType]) => {
      return {
        id: argName,
        label: {
          zh_CN: argName,
          en_US: argName
        },
        type: standardizationType(argType),
        default: ''
      }
    }
  )
}

const v = new Visitor()
export const useVisitor = () => {
  const getClassNames = () => {
    return classNames
  }
  /**
   *
   * @param {string} className
   * @returns {import('./useX6').Property[]}
   */
  const getProperty = (className) => {
    const args = clazzFnMemberRecord.get(className)?.get('__init__')
    if (!args.length) {
      return []
    }
    return toProperty(args)
  }
  return {
    visitor: v,
    getClassNames,
    toProperty,
    getProperty
  }
}
