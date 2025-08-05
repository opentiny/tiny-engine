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

import template from '@babel/template'
import path from 'node:path'
import fs from 'node:fs'

// 定义各种常量，用于标识不同的入口点和编译选项
export const CALLENTRY = 'callEntry' // 主入口点
export const USE_COMPILE = 'useCompile' // 编译选项
export const METADATANAME = 'metaData' // 元数据名称
export const COMMON_PACKAGE_NAME = '@opentiny/tiny-engine-meta-register' // 公共包名

// Vue生命周期钩子列表
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

// 用于匹配metaService和metaComponent注释的正则表达式
const callEntryExp = /\/\*\s*metaService/
const compileExp = /\/\*\s*metaComponent/

// 创建Babel模板语句的辅助函数
const statement = (code) => template.statement(code, { placeholderPattern: false })

/**
 * 检查文件是否包含metaService注释
 * @param {string} code - 文件内容
 * @returns {boolean} 是否包含metaService注释
 */
export const isCallEntryFile = (code) => {
  return callEntryExp.test(code) || compileExp.test(code)
}

/**
 * 检查文件是否包含metaComponent注释
 * @param {string} code - 文件内容
 * @returns {boolean} 是否包含metaComponent注释
 */
export const isCompileFile = (code) => {
  return compileExp.test(code)
}

/**
 * 从注释中提取模块ID
 * @param {string} str - 包含metaService注释的字符串
 * @returns {string} 提取的模块ID
 */
export const getModuleId = (str) => {
  const [, moduleId = ''] = str.match(/\/\*\s*metaService: \s*(.+?)\s*\*\//) || []
  return moduleId
}

export const getTemplateId = (str) => {
  const [, moduleId = ''] = str.match(/\s*metaComponent: \s*(.+)\s*/) || []
  return moduleId.trim()
}

/**
 * 从注释中提取参数并组合成标准格式
 * @param {Object} params - 参数对象
 * @param {string} params.functionName - 函数名
 * @param {Object} params.asyncVars - 异步变量
 * @param {Object} params.state - 状态对象
 * @returns {string} 格式化后的参数
 */
export const getEntryParam = ({ functionName = '', asyncVars, state }) => {
  const { varName, moduleId, noUseVars } = state
  const metaData = varName[METADATANAME]
  const id = moduleId ? `'${moduleId}.${functionName}'` : `\`\${${metaData}.id}.${functionName}\``
  const asyncVarsKey = Object.keys(asyncVars).filter((key) => !noUseVars.includes(key))
  const ctx = `() => ({${asyncVarsKey.join(',')}})`
  if (functionName) {
    return `{ ${METADATANAME}: { id: ${id} }, ctx: ${ctx}}`
  }

  return `{ ${METADATANAME}: ${metaData} }`
}

/**
 * 获取外部绑定变量
 * @param {Object} path - Babel路径对象
 * @returns {Object} 外部绑定变量对象
 */
export const getOuterBindings = (path) => {
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

/**
 * 获取模块级别的绑定变量
 * @param {Object} path - Babel路径对象
 * @returns {Object} 模块绑定变量对象
 */
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

// 获取当前上下文已经可以使用的scope变量
export const getValidBindings = ({ path, state, functionName }) => {
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

// 获取当前作用域 body 和变量名
function getCurrentScopeBodyAndVarId(path) {
  // 处理变量声明的函数表达式 (例如: const foo = () => {} 或 const foo = function() {})
  if (
    path.parentPath &&
    path.parentPath.isVariableDeclarator() && // 检查是否为 const/let/var 的声明符
    path.parentPath.parentPath &&
    path.parentPath.parentPath.isVariableDeclaration() && // 检查是否为变量声明语句
    path.parentPath.parentPath.parent &&
    Array.isArray(path.parentPath.parentPath.parent.body) // 确保父节点有函数体数组
  ) {
    return path.parentPath.parentPath.parent.body
  }

  return null
}

/**
 * 生成callEntry表达式并包裹当前函数
 * @param {Object} params - 参数对象
 * @param {Object} params.path - Babel路径对象
 * @param {string} params.functionName - 函数名
 * @param {Object} params.varName - 变量名对象
 * @param {Object} params.state - 状态对象
 */
export const wrapEntryFuncNode = ({ path, functionName = '', varName, state }) => {
  const asyncVars = getOuterBindings(path)
  const body = getCurrentScopeBodyAndVarId(path, functionName)

  // 判断是否为"直接调用"
  let isDirectlyCalled = false
  if (body) {
    isDirectlyCalled = body.some(
      (node) =>
        node.type === 'ExpressionStatement' &&
        node.expression.type === 'CallExpression' &&
        node.expression.callee.type === 'Identifier' &&
        node.expression.callee.name === functionName
    )
  }

  // 根据是否为直接调用，选择用 syncVars 还是 asyncVars 组装 ctx
  const entryParam = getEntryParam({
    functionName,
    asyncVars: isDirectlyCalled ? getValidBindings({ path, state, functionName }) : asyncVars, // 直接调用用 syncVars，否则用 asyncVars
    varName,
    state
  })

  const callEntry = varName[CALLENTRY]
  const entryAst = statement(`${callEntry}(${entryParam})`)()
  const resultNode = path.node

  entryAst.expression.arguments.unshift(JSON.parse(JSON.stringify(resultNode)))
  // 替换整个节点
  path.replaceWith(entryAst)
}

/**
 * 获取两个文件路径的相对路径
 * @param {string} path1 - 第一个文件的绝对路径
 * @param {string} path2 - 第二个文件的绝对路径
 * @returns {string} 相对路径
 */
export const getRelFilePath = (path1, path2) => {
  const dir1 = path.join(path1, '..')
  const dir2 = path.join(path2, '..')
  const relPath = path.relative(dir1, dir2) || '.'
  return `${relPath}/${path.basename(path2)}`.replaceAll('\\', '/')
}

/**
 * 向上查找meta.js的相对路径
 * @param {string} id - 文件ID
 * @returns {string|null} meta.js的相对路径或null
 */
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

/**
 * 包装导出组件
 * @param {Object} params - 参数对象
 * @param {Object} params.path - Babel路径对象
 * @param {Object} params.varName - 变量名对象
 */
/**
 * 包装导出组件,对组件进行useCompile包装处理
 * @param {Object} params - 参数对象
 * @param {Object} params.path - Babel路径对象,用于AST操作
 * @param {Object} params.varName - 变量名对象,包含元数据和编译函数名
 * @param {string} params.lastComment - 最后一个注释,用于生成模板ID
 */
export const wrapExportComp = ({ path, varName, lastComment }) => {
  // 获取导出对象的所有属性
  const properties = path.node.declaration?.properties || []
  // 获取元数据变量名
  const metaData = varName[METADATANAME]
  // 获取useCompile函数名
  const useCompile = varName[USE_COMPILE]
  // 从注释中获取模板ID
  const templateId = getTemplateId(lastComment)

  // 遍历导出对象的所有属性
  properties.forEach((prop) => {
    // 处理单个组件导出的情况
    if (prop.key?.name === 'component') {
      // 获取组件值
      const val = prop.value
      // 创建useCompile包装的AST节点
      const compileAst = statement(`${useCompile}({ component: null, ${METADATANAME}: ${metaData} });`)()
      // 将原组件值设置到useCompile的component参数中
      compileAst.expression.arguments[0].properties[0].value = val
      // 遍历AST,替换原组件节点
      path.traverse({
        enter(subPath) {
          if (subPath.node === val) {
            // 用useCompile包装后的节点替换原节点
            subPath.replaceWith(compileAst)
            // 跳过子节点遍历
            subPath.skip()
          }
        }
      })
    }
    // 处理多个组件导出的情况
    else if (prop.key?.name === 'components') {
      const val = prop.value
      // 确保components是一个对象
      if (val?.properties) {
        const properties = val.properties
        // 遍历所有子组件
        properties.forEach((item) => {
          const value = item.value
          // 生成元数据对象,如果有templateId则使用"templateId.组件名"作为id
          const metaObj = templateId ? `{id:'${templateId}.${value.name}'}` : metaData
          // 创建useCompile包装的AST节点
          const compileAst = statement(`${useCompile}({ component: null, ${METADATANAME}: ${metaObj} });`)()
          // 将原组件值设置到useCompile的component参数中
          compileAst.expression.arguments[0].properties[0].value = value
          // 遍历AST,替换原组件节点
          path.traverse({
            enter(subPath) {
              if (subPath.node === value) {
                // 用useCompile包装后的节点替换原节点
                subPath.replaceWith(compileAst)
                // 跳过子节点遍历
                subPath.skip()
              }
            }
          })
        })
      }
    }
  })
}

/**
 * 包装钩子调用
 * @param {Object} params - 参数对象
 * @param {Object} params.path - Babel路径对象
 * @param {Object} params.varName - 变量名对象
 * @param {string} params.functionName - 函数名
 * @param {string} params.callName - 调用名
 * @param {Object} params.state - 状态对象
 */
export const wrapHookCall = ({ path, varName, functionName, callName, state }) => {
  // vue的生命周期hook只有一个参数
  const argument = path.node.expression.arguments[0]
  const callEntry = varName[CALLENTRY]
  const asyncVars = path.scope.getAllBindings()
  const entryParam = getEntryParam({
    functionName,
    asyncVars,
    varName,
    state
  })
  const wrapAst = statement(`${callName}(${callEntry}(${entryParam}))`)()
  wrapAst.expression.arguments[0].arguments.unshift(argument)
  path.replaceWith(wrapAst)
  path.skip()
}
