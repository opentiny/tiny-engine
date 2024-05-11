<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    content="生成当前页面/区块的Vue代码到本地文件"
  >
    <template #reference>
      <span class="icon" @click="generate">
        <svg-icon :name="icon"></svg-icon>
      </span>
    </template>
  </tiny-popover>
  <generate-file-selector
    :visible="state.showDialogbox"
    :data="state.saveFilesInfo"
    @confirm="confirm"
    @cancel="cancel"
  ></generate-file-selector>
</template>

<script>
import { reactive } from 'vue'
import { Popover } from '@opentiny/vue'
import { getGlobalConfig, useBlock, useCanvas, useNotify, useLayout } from '@opentiny/tiny-engine-controller'
import { fs } from '@opentiny/tiny-engine-utils'
import { getSchema } from '@opentiny/tiny-engine-canvas'
import { generateVuePage, generateVueBlock } from './generateCode'
import { fetchCode, fetchMetaData, fetchPageList } from './http'
import FileSelector from './FileSelector.vue'

export default {
  components: {
    TinyPopover: Popover,
    GenerateFileSelector: FileSelector
  },
  props: {
    icon: {
      type: String,
      default: 'generate-code'
    }
  },
  setup() {
    const { isBlock, getCurrentPage } = useCanvas()
    const { getCurrentBlock } = useBlock()

    const state = reactive({
      dirHandle: null,
      generating: false,
      showDialogbox: false,
      saveFilesInfo: []
    })

    const getParams = () => {
      const params = {
        framework: getGlobalConfig()?.dslMode,
        platform: getGlobalConfig()?.platformId,
        pageInfo: {
          schema: getSchema()
        }
      }
      const paramsMap = new URLSearchParams(location.search)
      params.app = paramsMap.get('id')
      params.tenant = paramsMap.get('tenant')

      if (isBlock()) {
        const block = getCurrentBlock()
        params.id = block?.id
        params.pageInfo.name = block?.label
        params.type = 'Block'
      } else {
        const page = getCurrentPage()
        params.id = page?.id
        params.pageInfo.name = page?.name
        params.type = 'Page'
      }

      return params
    }

    const initDirHandle = (dirHandle) => {
      if (!state.dirHandle && dirHandle) {
        state.dirHandle = dirHandle
      }
    }

    const getPreGenerateInfo = async () => {
      const params = getParams()
      const promises = [fetchCode(params), fetchMetaData(params), fetchPageList(params.app)]

      if (!state.dirHandle) {
        promises.push(fs.getUserBaseDirHandle())
      }

      const [codeList, metaData, pageList, dirHandle] = await Promise.all(promises)

      return [params, codeList, metaData, pageList, dirHandle]
    }

    const getToSaveFilesInfo = ({ params, codeList, metaData, pageList }) => {
      const handlers = {
        Block: generateVueBlock,
        Page: generateVuePage
      }
      const filesInfo = handlers[params.type]({ params, codeList, metaData, pageList })

      return filesInfo
    }

    const saveCodeToLocal = async (filesInfo) => {
      if (filesInfo.length && state.dirHandle) {
        await fs.writeFiles(state.dirHandle, filesInfo)
      }
    }

    const generate = async () => {
      const { isEmptyPage } = useLayout()

      if (isEmptyPage()) {
        useNotify({ type: 'warning', message: '请先创建页面' })

        return
      }

      if (state.generating) {
        useNotify({ type: 'info', title: '代码生成中, 请稍后...' })
        return
      } else {
        useNotify({ type: 'info', title: '代码生成中...' })
        state.generating = true
      }

      try {
        // 保存代码前置任务：调用接口生成代码并获取用户本地文件夹授权
        const [params, codeList, metaData, pageList, dirHandle] = await getPreGenerateInfo()

        // 暂存待生成代码文件信息
        state.saveFilesInfo = getToSaveFilesInfo({ params, codeList, metaData, pageList })

        // 保存用户授权的文件夹句柄
        initDirHandle(dirHandle)

        // 打开弹窗选中待生成文件
        state.showDialogbox = true
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        useNotify({ type: 'error', title: '代码生成失败', message: error?.message || error })
        state.generating = false
      }
    }

    const confirm = async (saveData) => {
      useNotify({ type: 'info', title: '代码保存中...' })
      state.showDialogbox = false

      try {
        // 生成代码到本地
        await saveCodeToLocal(saveData)

        useNotify({ type: 'success', title: '代码文件保存成功', message: `已保存${saveData.length}个文件` })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        useNotify({ type: 'error', title: '代码保存失败', message: error?.message || error })
      } finally {
        state.generating = false
      }
    }

    const cancel = () => {
      state.showDialogbox = false
      state.generating = false
      state.saveFilesInfo = []
    }

    return {
      state,
      generate,
      confirm,
      cancel
    }
  }
}
</script>
<style lang="less" scoped></style>
