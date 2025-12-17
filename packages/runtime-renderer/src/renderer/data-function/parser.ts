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

import * as vue from 'vue'
import babelPluginJSX from '@vue/babel-plugin-jsx'
import { transformSync } from '@babel/core'
import { Notify } from '@opentiny/vue'
import { renderDefault } from '../render'
import { getComponent, getIcon } from '../material-function'
import i18nHost from '@opentiny/tiny-engine-common/js/i18n'

interface ITypeParserDef {
  type: (data: any) => boolean
  parseFunc: (data: unknown, scope: Record<string, any>, ctx: Record<string, any>) => unknown
}

const parseList: Array<ITypeParserDef> = []

const isI18nData = (data: { type: string }) => {
  return data && data.type === 'i18n'
}

const isJSSlot = (data: { type: string }) => {
  return data && data.type === 'JSSlot'
}

const isJSExpression = (data: { type: string }) => {
  return data && data.type === 'JSExpression'
}

const isJSFunction = (data: { type: string }) => {
  return data && data.type === 'JSFunction'
}

const isJSResource = (data: { type: string }) => {
  return data && data.type === 'JSResource'
}

const isString = (data: any) => {
  return typeof data === 'string'
}

const isArray = (data: any) => {
  return Array.isArray(data)
}

const isFunction = (data: any) => {
  return typeof data === 'function'
}

const isIcon = (data: { componentName: string }) => {
  return data?.componentName === 'Icon'
}

const isObject = (data: any) => {
  return typeof data === 'object'
}

// 判断是否是状态访问器
export const isStateAccessor = (stateData: { accessor: { getter: { type: string }; setter: { type: string } } }) =>
  stateData?.accessor?.getter?.type === 'JSFunction' || stateData?.accessor?.setter?.type === 'JSFunction'

// 规避创建function eslint报错
export const newFn = (...args: any) => new Function(...args)

const transformJSX = (code: any) => {
  const res = transformSync(code, {
    plugins: [
      [
        babelPluginJSX,
        {
          pragma: 'h'
        }
      ]
    ]
  })
  return (res?.code || '')
    .replace(/import \{.+\} from "vue";/, '')
    .replace(/h\(_?resolveComponent\((.*?)\)/g, `h(this.getComponent($1)`)
    .replace(/_?resolveComponent/g, 'h')
    .replace(/_?createTextVNode\((.*?)\)/g, '$1')
    .trim()
}

const curriedFn = (innerFn: any, params: any) => {
  return (...args: any[]) => innerFn(...args, ...params)
}

const parseExpression = (data: any, scope: any, ctx: any, isJsx = false) => {
  try {
    if (data.value.indexOf('this.i18n') > -1) {
      ctx.i18n = i18nHost.global.t
    } else if (data.value.indexOf('t(') > -1) {
      ctx.t = i18nHost.global.t
    }

    const fnContext = { ...ctx, ...scope, slotScope: scope }
    const expression = isJsx ? transformJSX(data.value) : data.value
    const rs = newFn('$scope', `with($scope || {}) { return ${expression} }`).call(ctx, fnContext)
    if (data.params && data.params.length) {
      const params = data.params.map((param: string) => fnContext[param])
      return curriedFn(rs, params)
    } else {
      return rs
    }
  } catch (err) {
    // 解析抛出异常，则再尝试解析 JSX 语法。如果解析 JSX 语法仍然出现错误，isJsx 变量会确保不会再次递归执行解析
    if (!isJsx) {
      return parseExpression(data, scope, ctx, true)
    }
    // eslint-disable-next-line no-console
    console.error('parseExpression error', data, scope)
    return undefined
  }
}

const parseI18n = (i18n: any, scope: any, ctx: any) => {
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
const parseFunctionString = (fnStr: string) => {
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
const parseJSXFunction = (data: any, _scope: null, ctx: any) => {
  try {
    const newValue = transformJSX(data.value)
    const fnInfo = parseFunctionString(newValue)
    if (!fnInfo) throw Error('函数解析失败，请检查格式。示例：function fnName() { }')

    return newFn(...fnInfo.params, fnInfo.body).bind({
      ...ctx,
      getComponent
    })
  } catch (error) {
    Notify({
      type: 'warning',
      title: '函数声明解析报错',
      message: error?.message || '函数声明解析报错，请检查语法'
    })

    return newFn()
  }
}

export const generateFn = (innerFn: any, context: any) => {
  return (...args: any[]) => {
    // 如果有数据源标识，则表格的fetchData返回数据源的静态数据
    let result: any
    // 这里是为了兼容用户写法报错导致画布异常，但无法捕获promise内部的异常
    try {
      result = innerFn.call(context, ...args)
    } catch (error) {
      Notify({
        type: 'warning',
        title: `函数:${innerFn.name}执行报错`,
        message: error?.message || `函数:${innerFn.name}执行报错，请检查语法`
      })
    }
    // 这里注意如果innerFn返回的是一个promise则需要捕获异常，重新返回默认一条空数据
    if (result?.then && typeof result.then === 'function') {
      result = new Promise((resolve) => {
        result.then(resolve).catch((error: { message: any }) => {
          Notify({
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

const parseJSFunction = (data: any, _scope: any, ctx: any) => {
  try {
    const innerFn = newFn('$vue', `with($vue || {}) { return ${data.value} }`).call(ctx, { vue })
    return generateFn(innerFn, ctx)
  } catch (error) {
    return parseJSXFunction(data, null, ctx)
  }
}

const parseJSSlot = (data: any, _scope: Record<string, any>, _ctx: any) => {
  return ($scope: Record<string, any>) => renderDefault(data.value, { ..._scope, ...$scope }, data)
}

const parseIcon = (data: any, _scope: any, _ctx: any) => {
  return getIcon(data.props.name)
}

const parseData = (data: any, scope: any, ctx: any) => {
  const typeParser = parseList.find((item) => item.type(data))
  return typeParser ? typeParser.parseFunc(data, scope, ctx) : data
}

const parseStateAccessor = (data: any, _scope: any, ctx: any) => {
  return parseData(data.defaultValue, null, ctx)
}

const parseObjectData = (data: any, scope: any, ctx: any) => {
  if (!data) {
    return data
  }

  // 如果是状态访问器,则直接解析默认值
  if (isStateAccessor(data)) {
    return parseData(data.defaultValue, scope, ctx)
  }

  // 解析通过属性传递icon图标组件
  if (data.componentName === 'Icon') {
    return getIcon(data.props.name)
  }

  const res: any = {}
  Object.entries(data).forEach(([key, value]: [string, any]) => {
    // 如果是插槽则需要进行特殊处理
    if (key === 'slot' && value?.name) {
      res[key] = value.name
      // 特殊处理下ref
    } else if (key === 'ref' && value) {
      res[key] = (el: any) => ctx?.$ref(value, el)
    } else {
      res[key] = parseData(value, scope, ctx)
    }
  })

  // 处理 v-model 双向绑定
  const propsEntries = Object.entries(data)
  const modelValue = propsEntries.find(([_key, value]) => value?.type === 'JSExpression' && value?.model === true)
  const hasUpdateModelValue = propsEntries.find(
    ([key]) => /^on[A-Z]/.test(key) && key.startsWith(`onUpdate:${modelValue?.[0]}`)
  )

  if (modelValue && !hasUpdateModelValue) {
    // 添加 onUpdate:modelKey 事件
    res[`onUpdate:${modelValue?.[0]}`] = parseData(
      {
        type: 'JSFunction',
        value: `(value) => ${modelValue[1].value}=value`
      },
      scope,
      ctx
    )
  }

  return res
}

const parseString = (data: any) => {
  return data.trim()
}

const parseArray = (data: any, scope: any, ctx: any) => {
  return data.map((item: any) => parseData(item, scope, ctx))
}

const parseFunction = (data: any, _scope: any, ctx: any) => {
  return data.bind(ctx)
}

const parseCondition = (condition: any, scope: any, ctx: any) => {
  // eslint-disable-next-line no-eq-null
  return condition == null ? true : parseData(condition, scope, ctx)
}

const parseLoopArgs = (loop?: { item: unknown; index: number; loopArgs?: string[] }) => {
  if (!loop) {
    return undefined
  }
  const { item, index, loopArgs = [] } = loop
  const body = `return {${loopArgs[0] || 'item'}: item, ${loopArgs[1] || 'index'} : index }`
  return newFn('item, index', body)(item, index)
}

parseList.push(
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
)

export { parseData, parseCondition, parseLoopArgs }
