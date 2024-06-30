import {
  callEntry as _callEntry,
  beforeCallEntry as _beforeCallEntry,
  afterCallEntry as _afterCallEntry,
  useCompile as _useCompile
} from '@opentiny/tiny-engine-meta-register'
import _metaData from '../meta.js'
/* metaService */
import { reactive, onMounted, onBeforeMount as beforeMount } from 'vue'
import { deepCopy } from 'loash-es'
export const useRenderless = _callEntry(
  ({ props }) => {
    const state = reactive({
      tableData: props.data || props.op.data || []
    })
    onMounted(
      _callEntry(() => {}, {
        metaData: {
          id: `${_metaData.id}.onMounted[0]`
        },
        ctx: () => {
          let asyncVars = {}
          try {
            asyncVars = {
              props,
              state,
              logMessage,
              aaa,
              bbb,
              handleClick,
              ccc,
              sendMessage,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          } catch (e) {
            return {
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          }
          return asyncVars
        }
      })
    )
    onMounted(
      _callEntry(() => {}, {
        metaData: {
          id: `${_metaData.id}.onMounted[1]`
        },
        ctx: () => {
          let asyncVars = {}
          try {
            asyncVars = {
              props,
              state,
              logMessage,
              aaa,
              bbb,
              handleClick,
              ccc,
              sendMessage,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          } catch (e) {
            return {
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          }
          return asyncVars
        }
      })
    )
    onMounted(
      _callEntry(() => {}, {
        metaData: {
          id: `${_metaData.id}.onMounted[2]`
        },
        ctx: () => {
          let asyncVars = {}
          try {
            asyncVars = {
              props,
              state,
              logMessage,
              aaa,
              bbb,
              handleClick,
              ccc,
              sendMessage,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          } catch (e) {
            return {
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          }
          return asyncVars
        }
      })
    )
    beforeMount(
      _callEntry(() => {}, {
        metaData: {
          id: `${_metaData.id}.onBeforeMount[0]`
        },
        ctx: () => {
          let asyncVars = {}
          try {
            asyncVars = {
              props,
              state,
              logMessage,
              aaa,
              bbb,
              handleClick,
              ccc,
              sendMessage,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          } catch (e) {
            return {
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          }
          return asyncVars
        }
      })
    )
    _beforeCallEntry({
      metaData: {
        id: `${_metaData.id}.logMessage`
      },
      ctx: () => {
        let asyncVars = {}
        try {
          asyncVars = {
            props,
            state,
            logMessage,
            aaa,
            bbb,
            handleClick,
            ccc,
            sendMessage,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        } catch (e) {
          return {
            props,
            state,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        }
        return asyncVars
      }
    })
    const logMessage = _callEntry(
      () => {
        console.log('我是纯函数我不需要闭包参数')
      },
      {
        metaData: {
          id: `${_metaData.id}.logMessage`
        },
        ctx: () => {
          let asyncVars = {}
          try {
            asyncVars = {
              props,
              state,
              logMessage,
              aaa,
              bbb,
              handleClick,
              ccc,
              sendMessage,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          } catch (e) {
            return {
              props,
              state,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          }
          return asyncVars
        }
      }
    )
    _afterCallEntry({
      metaData: {
        id: `${_metaData.id}.logMessage`
      },
      ctx: () => {
        let asyncVars = {}
        try {
          asyncVars = {
            props,
            state,
            logMessage,
            aaa,
            bbb,
            handleClick,
            ccc,
            sendMessage,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        } catch (e) {
          return {
            props,
            state,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        }
        return asyncVars
      }
    })
    const aaa = 'aaa',
      bbb = 'bbb'
    _beforeCallEntry({
      metaData: {
        id: `${_metaData.id}.handleClick`
      },
      ctx: () => {
        let asyncVars = {}
        try {
          asyncVars = {
            e,
            props,
            state,
            logMessage,
            aaa,
            bbb,
            handleClick,
            ccc,
            sendMessage,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        } catch (e) {
          return {
            props,
            state,
            logMessage,
            aaa,
            bbb,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        }
        return asyncVars
      }
    })
    const handleClick = _callEntry(
      (e) => {
        console.log(e.target, aaa)
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
        ctx: () => {
          let asyncVars = {}
          try {
            asyncVars = {
              e,
              props,
              state,
              logMessage,
              aaa,
              bbb,
              handleClick,
              ccc,
              sendMessage,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          } catch (e) {
            return {
              props,
              state,
              logMessage,
              aaa,
              bbb,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          }
          return asyncVars
        }
      }
    )
    _afterCallEntry({
      metaData: {
        id: `${_metaData.id}.handleClick`
      },
      ctx: () => {
        let asyncVars = {}
        try {
          asyncVars = {
            e,
            props,
            state,
            logMessage,
            aaa,
            bbb,
            handleClick,
            ccc,
            sendMessage,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        } catch (e) {
          return {
            props,
            state,
            logMessage,
            aaa,
            bbb,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        }
        return asyncVars
      }
    })
    const ccc = 111
    _beforeCallEntry({
      metaData: {
        id: `${_metaData.id}.sendMessage`
      },
      ctx: () => {
        let asyncVars = {}
        try {
          asyncVars = {
            props,
            state,
            logMessage,
            aaa,
            bbb,
            handleClick,
            ccc,
            sendMessage,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        } catch (e) {
          return {
            props,
            state,
            logMessage,
            aaa,
            bbb,
            handleClick,
            ccc,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        }
        return asyncVars
      }
    })
    const sendMessage = _callEntry(
      () => {
        logMessage('自定义是的范德萨')
      },
      {
        metaData: {
          id: `${_metaData.id}.sendMessage`
        },
        ctx: () => {
          let asyncVars = {}
          try {
            asyncVars = {
              props,
              state,
              logMessage,
              aaa,
              bbb,
              handleClick,
              ccc,
              sendMessage,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          } catch (e) {
            return {
              props,
              state,
              logMessage,
              aaa,
              bbb,
              handleClick,
              ccc,
              last,
              reactive,
              onMounted,
              beforeMount,
              deepCopy,
              useRenderless
            }
          }
          return asyncVars
        }
      }
    )
    _afterCallEntry({
      metaData: {
        id: `${_metaData.id}.sendMessage`
      },
      ctx: () => {
        let asyncVars = {}
        try {
          asyncVars = {
            props,
            state,
            logMessage,
            aaa,
            bbb,
            handleClick,
            ccc,
            sendMessage,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        } catch (e) {
          return {
            props,
            state,
            logMessage,
            aaa,
            bbb,
            handleClick,
            ccc,
            last,
            reactive,
            onMounted,
            beforeMount,
            deepCopy,
            useRenderless
          }
        }
        return asyncVars
      }
    })
    function last() {}
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
    ctx: () => {
      let asyncVars = {}
      try {
        asyncVars = {
          props,
          state,
          logMessage,
          aaa,
          bbb,
          handleClick,
          ccc,
          sendMessage,
          last,
          reactive,
          onMounted,
          beforeMount,
          deepCopy,
          useRenderless
        }
      } catch (e) {
        return {
          reactive,
          onMounted,
          beforeMount,
          deepCopy
        }
      }
      return asyncVars
    }
  }
)
