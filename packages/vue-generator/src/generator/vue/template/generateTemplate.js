import { generateTag } from './generateTag'
import { generateAttribute, mergeDescription } from './generateAttribute'

const recursiveGenTemplate = (children) => {
  const effect = {
    description: {
      hasJSX: false,
      jsResource: { utils: false, bridge: false }
    },
    stateVariable: {}
  }

  const schemaChildren = children || []

  const resArr = schemaChildren.map((schemaItem) => {
    const { componentName, children } = schemaItem
    const { description, stateVariable, resultStr } = generateAttribute(schemaItem)

    mergeDescription(effect.description, description)
    effect.stateVariable = {
      ...effect.stateVariable,
      ...(stateVariable || {})
    }

    const startTag = generateTag(componentName, { attribute: resultStr })
    const endTag = generateTag(componentName, { isStartTag: false })
    const { description: childDesc, stateVariable: childStateVar, resStr } = recursiveGenTemplate(children)

    mergeDescription(effect.description, childDesc)

    effect.stateVariable = {
      ...effect.stateVariable,
      ...(childStateVar || {})
    }

    return `${startTag}${resStr}${endTag}`
  })

  return {
    ...effect,
    resStr: resArr.join('')
  }
}

export const genTemplate = (schema) => {
  const { description, stateVariable, resStr } = recursiveGenTemplate(schema.children)

  return {
    description,
    stateVariable,
    resStr: `<template>${resStr}</template>`
  }
}
