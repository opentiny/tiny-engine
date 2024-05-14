<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    content="生成当前应用代码到本地文件"
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
import {
  getGlobalConfig,
  useBlock,
  useCanvas,
  useNotify,
  useLayout,
  useEditorInfo
} from '@opentiny/tiny-engine-controller'
import { fs } from '@opentiny/tiny-engine-utils'
import { useHttp } from '@opentiny/tiny-engine-http'
import { generateApp, parseRequiredBlocks } from '@opentiny/tiny-engine-dsl-vue'
import { fetchMetaData, fetchPageList, fetchBlockSchema } from './http'
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
      const { getSchema } = useCanvas().canvasApi.value
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

    const getBlocksSchema = async (pageSchema, blockSet = new Set()) => {
      let res = []

      const blockNames = parseRequiredBlocks(pageSchema)
      const promiseList = blockNames
        .filter((name) => {
          if (blockSet.has(name)) {
            return false
          }

          blockSet.add(name)

          return true
        })
        .map((name) => fetchBlockSchema(name))
      const schemaList = await Promise.allSettled(promiseList)
      const extraList = []

      schemaList.forEach((item) => {
        if (item.status === 'fulfilled' && item.value?.[0]?.content) {
          res.push(item.value[0].content)
          extraList.push(getBlocksSchema(item.value[0].content, blockSet))
        }
      })
      ;(await Promise.allSettled(extraList)).forEach((item) => {
        if (item.status === 'fulfilled' && item.value) {
          res.push(...item.value)
        }
      })

      return res
    }

    const instance = generateApp()

    const getAllPageDetails = async (pageList) => {
      const detailPromise = pageList.map(({ id }) => useLayout().getPluginApi('AppManage').getPageById(id))
      const detailList = await Promise.allSettled(detailPromise)

      return detailList
        .map((item) => {
          if (item.status === 'fulfilled' && item.value) {
            return item.value
          }
        })
        .filter((item) => Boolean(item))
    }

    const getPreGenerateInfo = async () => {
      const params = getParams()
      const { id } = useEditorInfo().useInfo()
      const promises = [
        useHttp().get(`/app-center/v1/api/apps/schema/${id}`),
        fetchMetaData(params),
        fetchPageList(params.app)
      ]

      if (!state.dirHandle) {
        promises.push(fs.getUserBaseDirHandle())
      }

      const [appData, metaData, pageList, dirHandle] = await Promise.all(promises)
      const pageDetailList = await getAllPageDetails(pageList)

      const blockSet = new Set()
      const list = pageDetailList.map((page) => getBlocksSchema(page.page_content, blockSet))
      const blocks = await Promise.allSettled(list)

      const blockSchema = []
      blocks.forEach((item) => {
        if (item.status === 'fulfilled' && Array.isArray(item.value)) {
          blockSchema.push(...item.value)
        }
      })

      const appSchema = {
        // metaData 包含dataSource、utils、i18n、globalState
        ...metaData,
        // 页面 schema
        pageSchema: pageDetailList.map((item) => {
          const { page_content, ...meta } = item

          return {
            ...page_content,
            meta: {
              ...meta,
              router: meta.route
            }
          }
        }),
        blockSchema,
        // 物料数据
        componentsMap: [...(appData.componentsMap || [])],

        meta: {
          ...(appData.meta || {})
        }
      }

      const res = await instance.generate(appSchema)

      const { genResult = [] } = res || {}
      const fileRes = genResult.map(({ fileContent, fileName, path, fileType }) => {
        const slash = path.endsWith('/') || path === '.' ? '' : '/'
        let filePath = `${path}${slash}`
        if (filePath.startsWith('./')) {
          filePath = filePath.slice(2)
        }
        if (filePath.startsWith('.')) {
          filePath = filePath.slice(1)
        }

        if (filePath.startsWith('/')) {
          filePath = filePath.slice(1)
        }

        return {
          fileContent,
          filePath: `${filePath}${fileName}`,
          fileType
        }
      })

      return [dirHandle, fileRes]
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
        const [dirHandle, fileRes] = await getPreGenerateInfo()

        // 暂存待生成代码文件信息
        state.saveFilesInfo = fileRes

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
