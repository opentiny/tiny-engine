import { callEntry as _callEntry, useCompile as _useCompile } from '@opentiny/tiny-engine-meta-register'
import _metaData from '../meta.js'
/* metaService */
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

import { reactive, onMounted, onBeforeMount as beforeMount } from 'vue'
import { deepCopy } from 'lodash-es'
export const useRenderless = _callEntry(
  ({ props }) => {
    const state = reactive({
      tableData: props.data || props.op.data || []
    })
    const last1 = useLayout(last1)
    beforeMount(
      _callEntry(() => {}, {
        metaData: {
          id: `${_metaData.id}.onBeforeMount[0]`
        },
        ctx: () => ({
          props,
          state,
          last1,
          logMessage,
          aaa,
          bbb,
          handleClick,
          sendMessage,
          ccc,
          deepCopy,
          useRenderless
        })
      })
    )
    const logMessage = _callEntry(
      () => {
        console.log('我是纯函数我不需要闭包参数')
      },
      {
        metaData: {
          id: `${_metaData.id}.logMessage`
        },
        ctx: () => ({
          props,
          state,
          last1,
          logMessage,
          aaa,
          bbb,
          handleClick,
          sendMessage,
          ccc,
          deepCopy,
          useRenderless
        })
      }
    )
    const aaa = 'aaa',
      bbb = 'bbb'
    const handleClick = _callEntry(
      (e) => {
        state.tableData.push({
          key: 'TinyEngine',
          zhCN: '低代码引擎',
          enUS: 'TinyEngine'
        })
      },
      {
        metaData: {
          id: `${_metaData.id}.handleClick`
        },
        ctx: () => ({
          props,
          state,
          last1,
          logMessage,
          aaa,
          bbb,
          handleClick,
          sendMessage,
          ccc,
          deepCopy,
          useRenderless
        })
      }
    )
    const sendMessage = _callEntry(
      () => {
        logMessage('自定义是的范德萨')
      },
      {
        metaData: {
          id: `${_metaData.id}.sendMessage`
        },
        ctx: () => ({
          props,
          state,
          last1,
          logMessage,
          aaa,
          bbb,
          handleClick,
          deepCopy,
          useRenderless
        })
      }
    )
    sendMessage()
    const ccc = 111
    return {
      state,
      aa,
      handleClick,
      sendMessage
    }
  },
  {
    metaData: {
      id: `${_metaData.id}.useRenderless`
    },
    ctx: () => ({
      deepCopy,
      useRenderless
    })
  }
)
