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
      let member = fnMember.get(this.activeFn)
      if (!member) {
        member = fnMember.set(this.activeFn, [...this.activeArgs])
      }
      this.activeArgs = []
    }
  }
  visitParameters(ctx) {
    visitor(ctx.children, this)
  }
  visitTfpdef(ctx) {
    const [name, type = 'any'] = ctx.getText().split(':')
    this.activeArgs.push([name, type])
  }
}
const v = new Visitor()
export const useVisitor = () => {
  const getClassNames = () => {
    return classNames
  }
  return {
    visitor: v,
    getClassNames
  }
}
