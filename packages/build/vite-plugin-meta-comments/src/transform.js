/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { parse } from '@babel/parser'
import generateLib from '@babel/generator'
import traverseLib from '@babel/traverse'
import template from '@babel/template'
import {
  wrapEntryFuncNode,
  COMMON_PACKAGE_NAME,
  CALLENTRY,
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

// 在ESM模式中，traverse默认是以命名导出的形式提供
const traverse = traverseLib.default || traverseLib
const generate = generateLib.default || generateLib

function handleFunctionExpression(state) {
  return function (path) {
    const parentNode = path.parentPath || {}
    const functionName = parentNode.node?.id?.name

    // 只有拿到函数的名称才可以被复写
    if (functionName) {
      state.ArrowOrFunctionExpression.push(functionName)
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

/**
 * 处理变量声明节点
 * @param {Object} state - 状态对象,用于存储变量声明信息
 * @returns {Function} 返回处理变量声明的函数
 */
function handleVariableDeclaration(state) {
  return function (path) {
    // 遍历所有变量声明
    path.node.declarations?.forEach((val) => {
      // 获取变量名
      const name = val.id.name
      // 获取变量所在的作用域块
      const block = path.scope.block

      // 如果该作用域块还没有记录过变量,则创建新数组
      if (!state.varDeclartion.has(block)) {
        const arr = [name]
        state.varDeclartion.set(block, arr)
      } else {
        // 如果该作用域块已存在,则将变量名添加到数组中
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
    const useCompile = path.scope.generateUid(USE_COMPILE)
    state.varName[CALLENTRY] = callEntry
    state.varName[USE_COMPILE] = useCompile
    path.node.body.unshift(
      template.statement(
        `import { 
          ${CALLENTRY} as ${callEntry},
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
      wrapExportComp({ path, varName: state.varName, lastComment })
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
    noUseVars: [],
    fileId: id,
    ArrowOrFunctionExpression: []
  }

  // 找不到meta.js告警并返回
  const metaPath = getMeataPath(id)
  if (!metaPath) {
    // eslint-disable-next-line no-console
    console.log(`${id}: 找不到对应的meta.js`)
    return
  }

  // 将源码解析为ast语法数
  const resultAst = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  })

  traverse(resultAst, {
    // 使用特定的类型回调处理、函数表达式、箭头函数、带导出的函数
    'ArrowFunctionExpression|FunctionExpression': handleFunctionExpression(state),
    ImportDeclaration: handleImportDeclaration(state),
    VariableDeclaration: handleVariableDeclaration(state),
    ExpressionStatement: handleExpressionStatement(state),
    Program: handleProgram(state, metaPath),
    ExportDefaultDeclaration: handleExportDefaultDeclaration(state)
  })

  return generate(resultAst).code || ''
}
