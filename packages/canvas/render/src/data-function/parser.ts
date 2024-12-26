import babelPluginJSX from '@vue/babel-plugin-jsx'
import { transformSync } from '@babel/core'
import i18nHost from '@opentiny/tiny-engine-i18n-host'

import { globalNotify } from '../canvas-function'
import { collectionMethodsMap, customElements, getComponent, getIcon } from '../material-function'
import { newFn } from '../data-utils'
import { renderDefault } from '../render'

interface ITypeParserDef {
  type: (data) => boolean
  parseFunc: (data: unknown, scope: Record<string, any>, ctx: Record<string, any>) => unknown
}

const parseList: Array<ITypeParserDef> = []

const isI18nData = (data) => {
  return data && data.type === 'i18n'
}

const isJSSlot = (data) => {
  return data && data.type === 'JSSlot'
}

const isJSExpression = (data) => {
  return data && data.type === 'JSExpression'
}

const isJSFunction = (data) => {
  return data && data.type === 'JSFunction'
}

const isJSResource = (data) => {
  return data && data.type === 'JSResource'
}

const isString = (data) => {
  return typeof data === 'string'
}

const isArray = (data) => {
  return Array.isArray(data)
}

const isFunction = (data) => {
  return typeof data === 'function'
}
const isIcon = (data) => {
  return data?.componentName === 'Icon'
}
const isObject = (data) => {
  return typeof data === 'object'
}
// 判断是否是状态访问器
export const isStateAccessor = (stateData) =>
  stateData?.accessor?.getter?.type === 'JSFunction' || stateData?.accessor?.setter?.type === 'JSFunction'

const transformJSX = (code) => {
  const res = transformSync(code, {
    plugins: [
      [
        babelPluginJSX,
        {
          pragma: 'h',
          isCustomElement: (name) => customElements[name]
        }
      ]
    ]
  })
  return (res.code || '')
    .replace(/import \{.+\} from 'vue';/, '')
    .replace(/h\(_?resolveComponent\((.*?)\)/g, `h(this.getComponent($1)`)
    .replace(/_?resolveComponent/g, 'h')
    .replace(/_?createTextVNode\((.*?)\)/g, '$1')
    .trim()
}

const parseExpression = (data, scope, ctx, isJsx = false) => {
  try {
    if (data.value.indexOf('this.i18n') > -1) {
      ctx.i18n = i18nHost.global.t
    } else if (data.value.indexOf('t(') > -1) {
      ctx.t = i18nHost.global.t
    }

    const expression = isJsx ? transformJSX(data.value) : data.value
    return newFn('$scope', `with($scope || {}) { return ${expression} }`).call(ctx, {
      ...ctx,
      ...scope,
      slotScope: scope
    })
  } catch (err) {
    // 解析抛出异常，则再尝试解析 JSX 语法。如果解析 JSX 语法仍然出现错误，isJsx 变量会确保不会再次递归执行解析
    if (!isJsx) {
      return parseExpression(data, scope, ctx, true)
    }
    return undefined
  }
}

const parseI18n = (i18n, scope, ctx) => {
  return parseExpression(
    {
      type: 'JSExpression',
      value: `this.i18n('${i18n.key}', ${JSON.stringify(i18n.params)})`
    },
    scope,
    { i18n: i18nHost.global.t, ...ctx }
  )
}

// 解析函数字符串结构
const parseFunctionString = (fnStr) => {
  const fnRegexp = /(async)?.*?(\w+) *\(([\s\S]*?)\) *\{([\s\S]*)\}/
  const result = fnRegexp.exec(fnStr)
  if (result) {
    return {
      type: result[1] || '',
      name: result[2],
      params: result[3]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => Boolean(item)),
      body: result[4]
    }
  }
  return null
}

// 解析JSX字符串为可执行函数
const parseJSXFunction = (data, _scope, ctx) => {
  try {
    const newValue = transformJSX(data.value)
    const fnInfo = parseFunctionString(newValue)
    if (!fnInfo) throw Error('函数解析失败，请检查格式。示例：function fnName() { }')

    return newFn(...fnInfo.params, fnInfo.body).bind({
      ...ctx,
      getComponent
    })
  } catch (error) {
    globalNotify({
      type: 'warning',
      title: '函数声明解析报错',
      message: error?.message || '函数声明解析报错，请检查语法'
    })

    return newFn()
  }
}

export const generateFn = (innerFn, context?) => {
  return (...args) => {
    // 如果有数据源标识，则表格的fetchData返回数据源的静态数据
    const sourceId = collectionMethodsMap[innerFn.realName || innerFn.name]
    if (sourceId) {
      return innerFn.call(context, ...args)
    } else {
      let result = null

      // 这里是为了兼容用户写法报错导致画布异常，但无法捕获promise内部的异常
      try {
        result = innerFn.call(context, ...args)
      } catch (error) {
        globalNotify({
          type: 'warning',
          title: `函数:${innerFn.name}执行报错`,
          message: error?.message || `函数:${innerFn.name}执行报错，请检查语法`
        })
      }

      // 这里注意如果innerFn返回的是一个promise则需要捕获异常，重新返回默认一条空数据
      if (result.then) {
        result = new Promise((resolve) => {
          result.then(resolve).catch((error) => {
            globalNotify({
              type: 'warning',
              title: '异步函数执行报错',
              message: error?.message || '异步函数执行报错，请检查语法'
            })
            // 这里需要至少返回一条空数据，方便用户使用表格默认插槽
            resolve({
              result: [{}],
              page: { total: 1 }
            })
          })
        })
      }

      return result
    }
  }
}
const parseJSFunction = (data, _scope, ctx) => {
  try {
    const innerFn = newFn(`return ${data.value}`).bind(ctx)()
    return generateFn(innerFn, ctx)
  } catch (error) {
    return parseJSXFunction(data, null, ctx)
  }
}

const parseJSSlot = (data, scope, _ctx) => {
  return ($scope) => renderDefault(data.value, { ...scope, ...$scope }, data)
}

export function parseData(data, scope, ctx) {
  const typeParser = parseList.find((item) => item.type(data))
  return typeParser ? typeParser.parseFunc(data, scope, ctx) : data
}

export const parseCondition = (condition, scope, ctx) => {
  // eslint-disable-next-line no-eq-null
  return condition == null ? true : parseData(condition, scope, ctx)
}

export const parseLoopArgs = (loop?: { item: unknown; index: number; loopArgs?: string[] }) => {
  if (!loop) {
    return undefined
  }
  const { item, index, loopArgs = [] } = loop
  const body = `return {${loopArgs[0] || 'item'}: item, ${loopArgs[1] || 'index'} : index }`
  return newFn('item,index', body)(item, index)
}

const parseIcon = (data, _scope, _ctx) => {
  return getIcon(data.props.name)
}

const parseStateAccessor = (data, _scope, ctx) => {
  return parseData(data.defaultValue, null, ctx)
}

const parseObjectData = (data, scope, ctx) => {
  if (!data) {
    return data
  }

  const res = {}
  Object.entries(data).forEach(([key, value]: [string, any]) => {
    // 如果是插槽则需要进行特殊处理
    if (key === 'slot' && value?.name) {
      res[key] = value.name
    } else {
      res[key] = parseData(value, scope, ctx)
    }
  })
  return res
}

const parseString = (data) => {
  return data.trim()
}

const parseArray = (data, scope, ctx) => {
  return data.map((item) => parseData(item, scope, ctx))
}

const parseFunction = (data, scope, ctx) => {
  return data.bind(ctx)
}

parseList.push(
  ...[
    {
      type: isJSExpression,
      parseFunc: parseExpression
    },
    {
      type: isI18nData,
      parseFunc: parseI18n
    },
    {
      type: isJSFunction,
      parseFunc: parseJSFunction
    },
    {
      type: isJSResource,
      parseFunc: parseExpression
    },
    {
      type: isJSSlot,
      parseFunc: parseJSSlot
    },
    {
      type: isIcon,
      parseFunc: parseIcon
    },
    {
      type: isStateAccessor,
      parseFunc: parseStateAccessor
    },
    {
      type: isString,
      parseFunc: parseString
    },
    {
      type: isArray,
      parseFunc: parseArray
    },
    {
      type: isFunction,
      parseFunc: parseFunction
    },
    {
      type: isObject,
      parseFunc: parseObjectData
    }
  ]
)
