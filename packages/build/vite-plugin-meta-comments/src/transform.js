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

import { parse } from '@babel/parser'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import template from '@babel/template'
import {
  wrapEntryFuncNode,
  COMMON_PACKAGE_NAME,
  CALLENTRY,
  BEFORE_CALLENTRY,
  AFTER_CALLENTRY,
  USE_COMPILE,
  METADATANAME,
  isCallEntryFile,
  isCompileFile,
  getMeataPath,
  wrapExportComp,
  vueLifeHook,
  wrapHookCall,
  getModuleId
} from './utils.js'

const generateTraverse = traverse.default

function handleFunctionExpression(state) {
  return function (path) {
    const parentNode = path.parentPath || {}
    const functionName = parentNode.node?.id?.name

    // 只有拿到函数的名称才可以被复写
    if (functionName) {
      wrapEntryFuncNode({
        path,
        functionName,
        varName: state.varName,
        state
      })
    }
  }
}

function handleImportDeclaration(state) {
  return function (path) {
    // 解析vue的引入
    const depName = path.node?.source?.value
    if (depName === 'vue') {
      const specifiers = path.node.specifiers
      specifiers?.forEach((importSpecifier) => {
        const { imported, local } = importSpecifier
        const hookName = vueLifeHook.find((name) => imported.name === name)
        if (hookName) {
          state.hooksName[local.name] = hookName
        }
        state.noUseVars.push(local.name)
      })
    } else if (depName === '@opentiny/vue') {
      const specifiers = path.node.specifiers
      specifiers?.forEach((importSpecifier) => {
        const { local } = importSpecifier
        state.noUseVars.push(local.name)
      })
    }
  }
}

function handleVariableDeclaration(state) {
  return function (path) {
    path.node.declarations?.forEach((val) => {
      const name = val.id.name
      const block = path.scope.block
      if (!state.varDeclartion.has(block)) {
        const arr = [name]
        state.varDeclartion.set(block, arr)
      } else {
        const arr = state.varDeclartion.get(block)
        arr.push(name)
      }
    })
  }
}

function handleExpressionStatement(state) {
  return function (path) {
    const { hooksName, varName, hooksIndex } = state
    const callName = path.node.expression?.callee?.name
    const hookName = hooksName[callName]
    if (!hookName) {
      return
    }
    let hookIndex
    if (hooksIndex[hookName]) {
      hookIndex = hooksIndex[hookName]
      hooksIndex[hookName] = hookIndex + 1
    } else {
      hooksIndex[hookName] = 1
      hookIndex = 0
    }
    const functionName = `${hookName}[${hookIndex}]`
    wrapHookCall({
      path,
      varName,
      hooksName,
      functionName,
      callName,
      state
    })
  }
}

function handleProgram(state, metaPath) {
  return function (path) {
    const code = path.toString()
    state.moduleId = getModuleId(code)
    const metaData = path.scope.generateUid(METADATANAME)
    state.varName[METADATANAME] = metaData
    path.node.body.unshift(template.statement(`import ${metaData} from '${metaPath}'`)())

    const callEntry = path.scope.generateUid(CALLENTRY)
    const beforeCallEntry = path.scope.generateUid(BEFORE_CALLENTRY)
    const afterCallEntry = path.scope.generateUid(AFTER_CALLENTRY)
    const useCompile = path.scope.generateUid(USE_COMPILE)
    state.varName[CALLENTRY] = callEntry
    state.varName[BEFORE_CALLENTRY] = beforeCallEntry
    state.varName[AFTER_CALLENTRY] = afterCallEntry
    state.varName[USE_COMPILE] = useCompile
    path.node.body.unshift(
      template.statement(
        `import { 
          ${CALLENTRY} as ${callEntry},
          ${BEFORE_CALLENTRY} as ${beforeCallEntry},
          ${AFTER_CALLENTRY} as ${afterCallEntry},
          ${USE_COMPILE} as ${useCompile} 
        } from '${COMMON_PACKAGE_NAME}'`
      )()
    )
  }
}

function handleExportDefaultDeclaration(state) {
  return function (path) {
    const comment = path.node.leadingComments
    if (!comment) {
      return
    }
    const lastComment = comment[comment.length - 1].value
    // 只判断最接近export default的注释节点
    if (lastComment.includes('metaComponent')) {
      wrapExportComp({ path, varName: state.varName })
      path.skip()
    }
  }
}

export const transform = (code, id) => {
  // 如果不包含metaService或者metaComponent的文件直接退出
  const isCallEntry = isCallEntryFile(code)
  const isCompile = isCompileFile(code)
  if (!isCallEntry && !isCompile) {
    return
  }

  // 本次转换保存的状态
  const state = {
    varName: {}, // 变量名对应的映射表
    hooksName: {},
    hooksIndex: {},
    varDeclartion: new Map(),
    moduleId: '', // 自定义的模块ID，用于区分元服务中不同文件,
    noUseVars: []
  }

  // 找不到meta.js告警并返回
  const metaPath = getMeataPath(id)
  if (!metaPath) {
    // eslint-disable-next-line no-console
    console.log('找不到对应的meta.js')
    return
  }

  // 将源码解析为ast语法数
  const resultAst = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  })

  generateTraverse(resultAst, {
    // 使用特定的类型回调处理、函数表达式、箭头函数、带导出的函数
    'ArrowFunctionExpression|FunctionExpression': handleFunctionExpression(state),
    ImportDeclaration: handleImportDeclaration(state),
    VariableDeclaration: handleVariableDeclaration(state),
    ExpressionStatement: handleExpressionStatement(state),
    Program: handleProgram(state, metaPath),
    ExportDefaultDeclaration: handleExportDefaultDeclaration(state)
  })

  return generate.default(resultAst).code || ''
}
