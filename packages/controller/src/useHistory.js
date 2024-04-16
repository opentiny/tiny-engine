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

import { reactive, isProxy, toRaw, watch } from 'vue'
import useCanvas from './useCanvas'

const schema2String = (schema) => {
  if (isProxy(schema)) {
    schema = toRaw(schema)
  }

  return JSON.stringify(schema)
}

const string2Schema = (string) => {
  let schema

  try {
    schema = JSON.parse(string)
  } catch (error) {
    schema = {}
  }

  return schema
}

const list = []
const maxLength = 5
const historyState = reactive({
  index: 0,
  back: false,
  forward: false
})

const push = (schema) => {
  let length = list.length

  // 处于撤销中，又修改了 schema ，需要将后面的历史记录清除
  if (historyState.index < length - 1) {
    list.splice(historyState.index + 1)
    length = list.length
  }

  // 历史记录超过限制，删除前面的记录
  if (length >= maxLength) {
    list.splice(0, length - maxLength + 1)
  }

  list.push(schema2String(schema))
  historyState.index = list.length - 1
}

const go = (addend, valid) => {
  historyState.index = historyState.index + addend
  useCanvas().canvasApi.value?.setSchema(string2Schema(list[historyState.index]))

  // 不是锁定状态，撤销操作后，传递第二个标识位，将 list 的长度减一，置灰 undoredo 操作按钮
  if (typeof valid === 'boolean') {
    list.splice(1, 1)
  }
}

const back = () => {
  if (historyState.back) {
    go(-1)
    useCanvas().setSaved(false)
  }
}

const forward = () => {
  if (historyState.forward) {
    go(1)
    useCanvas().setSaved(historyState.index === list.length - 1)
  }
}

const clear = () => {
  list.splice(0)
  Object.assign(historyState, {
    index: 0,
    back: false,
    forward: false
  })
}

const addHistory = (schema) => {
  if (!schema) {
    useCanvas().setSaved(false)
    push(useCanvas().canvasApi.value?.getSchema())
  } else {
    clear()
    // 初始 schema 需要设置为第一条历史记录
    push(schema)
  }
}

// 监控下标，判断是否允许前进后退标志
watch(
  () => historyState.index,
  (value) => {
    historyState.back = value > 0
    historyState.forward = value < list.length - 1
  }
)

export default () => {
  return {
    historyState,
    back,
    forward,
    go,
    addHistory
  }
}
