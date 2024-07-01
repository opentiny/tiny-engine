/**
 * Copyright (c) 2024 - present TinyEngine Authors.
 * Copyright (c) 2024 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import template from '@babel/template'
import path from 'node:path'
import fs from 'node:fs'

export const CALLENTRY = 'callEntry'
export const BEFORE_CALLENTRY = 'beforeCallEntry'
export const AFTER_CALLENTRY = 'afterCallEntry'
export const USE_COMPILE = 'useCompile'
export const METADATANAME = 'metaData'
export const COMMON_PACKAGE_NAME = '@opentiny/tiny-engine-meta-register'
export const vueLifeHook = [
  'onMounted',
  'onUpdated',
  'onUnmounted',
  'onBeforeMount',
  'onBeforeUpdate',
  'onBeforeUnmount',
  'onActivated',
  'onDeactivated'
]
const callEntryExp = /\/\*\s*metaService/
const compileExp = /\/\*\s*metaComponent/

const statement = (code) => template.statement(code, { placeholderPattern: false })

export const isCallEntryFile = (code) => {
  return callEntryExp.test(code)
}

export const isCompileFile = (code) => {
  return compileExp.test(code)
}

export const getModuleId = (str) => {
  const [, moduleId = ''] = str.match(/\/\*\s*metaService: \s*(.+?)\s*\*\//) || []
  return moduleId
}

// 将注释中的参数提取出来，并组合成目前参数格式
export const getEntryParam = ({ functionName = '', syncVars, asyncVars, state }) => {
  const { varName, moduleId, noUseVars } = state
  const metaData = varName[METADATANAME]
  const id = moduleId ? `'${moduleId}.${functionName}'` : `\`\${${metaData}.id}.${functionName}\``
  const syncVarsKey = Object.keys(syncVars).filter((key) => !noUseVars.includes(key))
  const asyncVarsKey = Object.keys(asyncVars).filter((key) => !noUseVars.includes(key) && !syncVarsKey.includes(key))
  const ctx = ` () => {
    let asyncVars = {}
    const syncVars = {${syncVarsKey.join(',')}}
    try {
      asyncVars = { ${asyncVarsKey.join(',')} }
    } catch {
      return syncVars
    }
    return { ...syncVars, ...asyncVars }
  }`
  if (functionName) {
    return `{ ${METADATANAME}: { id: ${id} }, ctx: ${ctx}}`
  }

  return `{ ${METADATANAME}: ${metaData} }`
}

const getParentVariableDeclaration = (path) => {
  if (!path) {
    return
  }

  if (path.type === 'VariableDeclaration' && path.parentPath.type !== 'ExportNamedDeclaration') {
    return path
  } else {
    return getParentVariableDeclaration(path?.parentPath)
  }
}

const generateBeforeAfterEntry = ({ path, beforeEntryAst, afterEntryAst }) => {
  const parent = getParentVariableDeclaration(path)
  if (parent) {
    parent.insertBefore(beforeEntryAst)
    parent.insertAfter(afterEntryAst)
  }
}

export const getOuterBingdings = (path) => {
  const outerBindings = {}
  const allBindings = path.scope.getAllBindings()
  const selfBindings = path.scope.bindings
  Object.keys(allBindings).forEach((key) => {
    if (allBindings[key] && !selfBindings[key]) {
      outerBindings[key] = allBindings[key]
    }
  })
  return outerBindings
}

// 获取当前上下文已经可以使用的scope变量
export const getValidBingdinngs = ({ path, state, functionName }) => {
  const validBindings = {}
  const { varDeclartion } = state
  let varArr = []
  let parentPath = path.parentPath
  let block
  while (parentPath) {
    const newBlock = parentPath.scope.block
    parentPath = parentPath.parentPath
    if (newBlock === block) {
      continue
    }
    block = newBlock
    varArr = varArr.concat(varDeclartion.get(block))
  }

  const allBindings = path.scope.getAllBindings()
  const selfBindings = path.scope.bindings
  Object.keys(allBindings).forEach((key) => {
    if (selfBindings[key]) {
      return
    }
    const value = allBindings[key]
    // 如果是变量定义，并且此时还没有初始化，则过滤掉
    if ((['var', 'const', 'let'].includes(value.kind) && !varArr.includes(key)) || key === functionName) {
      return
    }
    validBindings[key] = value
  })
  return validBindings
}

export const getModuleBindings = (path) => {
  const moduleBindings = {}
  const allBindings = path.scope.getAllBindings()
  Object.keys(allBindings).forEach((key) => {
    if (allBindings[key].kind === 'module') {
      moduleBindings[key] = allBindings[key]
    }
  })
  return moduleBindings
}

// 生成callEntry表达式并包裹当前函数，如果有参与还需要处理参数
export const wrapEntryFuncNode = ({ path, functionName = '', varName, state }) => {
  const syncVars = getValidBingdinngs({ path, state, functionName })
  const asyncVars = getOuterBingdings(path)
  const entryParam = getEntryParam({
    functionName,
    syncVars,
    asyncVars,
    varName,
    state
  })
  const callEntry = varName[CALLENTRY]
  const beforeCallEntry = varName[BEFORE_CALLENTRY]
  const afterCallEntry = varName[AFTER_CALLENTRY]
  const entryAst = statement(`${callEntry}(${entryParam})`)()
  const beforeEntryAst = statement(`${beforeCallEntry}(${entryParam})`)()
  const afterEntryAst = statement(`${afterCallEntry}(${entryParam})`)()

  const resultNode = path.node
  generateBeforeAfterEntry({ path, beforeEntryAst, afterEntryAst })

  entryAst.expression.arguments.unshift(JSON.parse(JSON.stringify(resultNode)))
  // 替换整个节点
  path.replaceWith(entryAst)
}

// 获取两个文件路径的相对路径，入参为两个文件绝对路径
export const getRelFilePath = (path1, path2) => {
  const dir1 = path.join(path1, '..')
  const dir2 = path.join(path2, '..')
  const relPath = path.relative(dir1, dir2) || '.'
  return `${relPath}/${path.basename(path2)}`.replaceAll('\\', '/')
}

// 向上获取meta.js的相对路径
export const getMeataPath = (id) => {
  let tempPath = path.join(id, '../meta.js')

  const endCondition = () => {
    // 找到了meta.js
    const findMeta = fs.existsSync(tempPath)
    // 发现了package.json说明到达子包根目录
    const isSubRoot = fs.existsSync(path.join(tempPath, '../package.json'))
    // 到达系统根节点，防止死循环
    const isRoot = tempPath === path.join(tempPath, '../../meta.js')
    return findMeta || isSubRoot || isRoot
  }

  while (!endCondition()) {
    tempPath = path.join(tempPath, '../../meta.js')
  }
  if (fs.existsSync(tempPath)) {
    return getRelFilePath(id, tempPath)
  }
  return null
}

export const wrapExportComp = ({ path, varName }) => {
  const properties = path.node.declaration?.properties || []
  const metaData = varName[METADATANAME]
  const useCompile = varName[USE_COMPILE]

  // 对键值为component属性包一层useCompile
  properties.forEach((prop) => {
    if (prop.key?.name === 'component') {
      const val = prop.value
      const compileAst = statement(`${useCompile}({ component: null, ${METADATANAME}: ${metaData} });`)()
      compileAst.expression.arguments[0].properties[0].value = val
      path.traverse({
        enter(subPath) {
          if (subPath.node === val) {
            subPath.replaceWith(compileAst)
            subPath.skip()
          }
        }
      })
    }
  })
}

export const wrapHookCall = ({ path, varName, functionName, callName, state }) => {
  // vue的生命周期hook只有一个参数
  const argument = path.node.expression.arguments[0]
  const callEntry = varName[CALLENTRY]
  const syncVars = getValidBingdinngs({ path, state, functionName })
  const asyncVars = path.scope.getAllBindings()
  const entryParam = getEntryParam({
    functionName,
    syncVars,
    asyncVars,
    varName,
    state
  })
  const wrapAst = statement(`${callName}(${callEntry}(${entryParam}))`)()
  wrapAst.expression.arguments[0].arguments.unshift(argument)
  path.replaceWith(wrapAst)
  path.skip()
}
