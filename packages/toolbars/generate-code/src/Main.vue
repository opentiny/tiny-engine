<template>
  <div class="toolbar-helpGuid">
    <toolbar-base content="出码" :icon="options.icon.default || options.icon" :options="options" @click-api="generate">
      <template #default>
        <generate-file-selector
          :visible="state.showDialogbox"
          :tree-data="state.saveFilesTree"
          :data="state.saveFilesInfo"
          @confirm="confirm"
          @cancel="cancel"
        ></generate-file-selector>
      </template>
    </toolbar-base>
  </div>
</template>

<script lang="ts">
/* metaService: engine.toolbars.generate-code.Main */
import { reactive } from 'vue'
import {
  useBlock,
  useCanvas,
  useNotify,
  useLayout,
  getMetaApi,
  META_APP,
  getMergeMeta,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { fs } from '@opentiny/tiny-engine-utils'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { fetchMetaData, fetchPageList, fetchBlockSchema } from './http'
import FileSelector from './FileSelector.vue'
// @ts-ignore
export default {
  components: {
    GenerateFileSelector: FileSelector,
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const { isBlock, getCurrentPage } = useCanvas()
    const { getCurrentBlock } = useBlock()

    const state = reactive({
      dirHandle: null,
      generating: false,
      showDialogbox: false,
      saveFilesInfo: [],
      saveFilesTree: []
    })

    const getParams = () => {
      const { getSchema } = useCanvas()
      const params = {
        framework: getMergeMeta('engine.config')?.dslMode,
        platform: getMergeMeta('engine.config')?.platformId,
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

    const { getAllNestedBlocksSchema, generateAppCode } = getMetaApi('engine.service.generateCode')

    const getAllPageDetails = async (pageList) => {
      const detailPromise = pageList.map(({ id }) => getMetaApi(META_APP.AppManage).getPageById(id))
      const detailList = await Promise.allSettled(detailPromise)

      return detailList
        .map((item) => {
          if (item.status === 'fulfilled' && item.value) {
            return item.value
          }
        })
        .filter((item) => Boolean(item))
    }

    const validateDirHandle = async () => {
      if (!state.dirHandle) {
        return false
      }

      try {
        for await (const _entry of state.dirHandle.values()) {
          break
        }
        return true
      } catch (error) {
        return false
      }
    }

    const getPathDepth = (file, tree, index = 0) => {
      if (!tree[file.pathArray[index]]) {
        tree[file.pathArray[index]] = {}
      }
      if (index === file.pathArray.length - 1) {
        tree[file.pathArray[index]][file.fileName] = file
        return
      }
      getPathDepth(file, tree[file.pathArray[index]], index + 1)
    }

    const treeObjectToArray = (treeObj: any, treeArray: any[], checkedData: string[]) => {
      Object.entries(treeObj).forEach(([key, value]: [string, any]) => {
        checkedData.push(key)
        if (value.path) {
          treeArray.push({
            id: key,
            label: value.fileName,
            originData: {
              fileName: value.fileName,
              filePath: value.filePath,
              fileContent: value?.fileContent,
              fileType: value?.fileType
            }
          })
        } else {
          treeArray.push({
            id: key,
            label: key,
            children: []
          })
          treeObjectToArray(treeObj[key], treeArray[treeArray.length - 1].children, checkedData)
        }
      })
    }

    const sortTreeArray = (treeArray) => {
      treeArray.sort((a, b) => {
        return (a.children ? -1 : 0) - (b.children ? -1 : 0)
      })

      treeArray.forEach((item) => {
        if (item.children && item.children.length > 0) {
          sortTreeArray(item.children)
        }
      })
      return treeArray
    }

    const fileListToTreeObject = (fileList: any[]) => {
      const directTree: any = {}
      fileList.forEach((fileItem) => {
        let pathArray = fileItem.path.split('/')
        pathArray.shift()
        pathArray = pathArray.filter((item: any) => item)
        fileItem.filePath = `${pathArray.join('/')}${pathArray.length ? '/' : ''}${fileItem.fileName}`
        if (fileItem.path === '.') {
          directTree[fileItem.fileName] = fileItem
        } else {
          getPathDepth({ pathArray, ...fileItem }, directTree)
        }
      })
      const treeArray: any[] = []
      const checkedTreeData: string[] = []
      treeObjectToArray(directTree, treeArray, checkedTreeData)
      sortTreeArray(treeArray)
      return { treeArray, checkedTreeData }
    }

    const getPreGenerateInfo = async () => {
      const params = getParams()
      const { id } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
      const promises = [
        getMetaApi(META_SERVICE.Http).get(`/app-center/v1/api/apps/schema/${id}`),
        fetchMetaData(params),
        fetchPageList(params.app)
      ]

      const [appData, metaData, pageList] = await Promise.all(promises)
      const pageDetailList = await getAllPageDetails(pageList)

      // 这里需要手动传入 blockSet 的原因是多页面可能会存在重复的区块
      const blockSet = new Set()
      const list = pageDetailList.map((page) => getAllNestedBlocksSchema(page.page_content, fetchBlockSchema, blockSet))
      const blocks = await Promise.allSettled(list)

      const blockSchema = []
      blocks.forEach((item) => {
        if (item.status === 'fulfilled' && Array.isArray(item.value)) {
          blockSchema.push(...item.value)
        }
      })

      // 处理 i18n 对象中可能为 null 的情况
      if (metaData.i18n) {
        Object.keys(metaData.i18n).forEach((langKey) => {
          metaData.i18n[langKey] = metaData.i18n[langKey] || {}
        })
      } else {
        metaData.i18n = {}
      }

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
        // 物料依赖
        packages: [...(appData.packages || [])],
        meta: {
          ...(appData.meta || {})
        }
      }

      const res = await generateAppCode(appSchema)

      const { genResult = [] } = res || {}
      // 将文件目录处理成树状结构
      const fileTreeInfo = fileListToTreeObject(genResult)

      return [fileTreeInfo, genResult]
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
        state.generating = true
      }

      try {
        // 保存代码前置任务：调用接口生成代码并获取用户本地文件夹授权
        const [fileTreeInfo, genResult] = await getPreGenerateInfo()

        // 暂存待生成代码文件树
        state.saveFilesTree = fileTreeInfo
        state.saveFilesInfo = genResult

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
      const isDirHandleValid = await validateDirHandle()
      if (!isDirHandleValid) {
        const dirHandle = await fs.getUserBaseDirHandle()
        // 保存用户授权的文件夹句柄
        initDirHandle(dirHandle)
        useNotify({ type: 'info', title: '代码保存中...' })
        state.showDialogbox = false
      }

      try {
        // 生成代码到本地
        await saveCodeToLocal(saveData)

        useNotify({
          type: 'success',
          title: '代码文件保存成功',
          message: `已保存${saveData.length}个文件到 ${state?.dirHandle?.name || ''}`
        })
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
      state.saveFilesTree = []
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
<style lang="less" scoped>
.toolbar-generate {
  .toolbar-generate-btn {
    display: flex;
    align-items: center;
  }
  :deep(.tiny-button--default) {
    min-width: 58px;
    height: 26px;
    padding: 0 8px;
    border-radius: 4px;
    background-color: var(--te-toolbars-generate-code-button-bg-color);
    border: none;
    &:not(.disabled):hover {
      background-color: var(--te-toolbars-generate-code-button-bg-color);
    }
    .button-title {
      margin-left: 4px;
    }
  }
}
</style>
