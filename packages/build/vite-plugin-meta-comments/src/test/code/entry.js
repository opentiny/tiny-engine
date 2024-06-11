/* metaService */
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

import { reactive, onMounted, onBeforeMount as beforeMount } from 'vue'
import { deepCopy } from 'loash-es'
export const useRenderless = ({ props }) => {
  const state = reactive({
    tableData: props.data || props.op.data || []
  })

  onMounted(() => {})
  onMounted(() => {})
  onMounted(() => {})

  beforeMount(() => {})

  const logMessage = () => {
    console.log('我是纯函数我不需要闭包参数')
  }

  const aaa = 'aaa',
    bbb = 'bbb'

  const handleClick = (e) => {
    console.log(e.target, aaa)
    state.tableData.push({
      key: 'TinyEngine',
      zhCN: '低代码引擎',
      enUS: 'TinyEngine'
    })
  }

  const ccc = 111

  const sendMessage = () => {
    logMessage('自定义是的范德萨')
  }

  function last() {}

  return {
    state,
    aa,
    handleClick,
    sendMessage
  }
}
