<template>
  <div class="toolbar-build">
    <toolbar-base content="构建" :icon="options.icon.default || options.icon" :options="options" @click-api="build">
      <template #default>
        <tiny-dialog-box :visible="state.showDialogbox" width="400" top="30%" :show-header="false" :append-to-body="true" destroy-on-close>
          <div class="build-dialog">
            <tiny-progress v-if="state.percentage !== 100" :percentage="state.percentage" :stroke-width="8" type="line"></tiny-progress>
            <div class="build-options" v-else>
              项目构建完成，请点击下载
            </div>
          </div>
          <template #footer v-if="state.percentage === 100">
            <tiny-button type="primary" @click="download">下载</tiny-button>
            <tiny-button @click="handleCancel">取消</tiny-button>
          </template>
        </tiny-dialog-box>
      </template>
    </toolbar-base>
  </div>
</template>

<script lang="ts">
import { reactive, ref } from 'vue'
import { ToolbarBase, useBlock, useCanvas, useNotify, getMetaApi, META_APP, getMergeMeta, META_SERVICE } from '@opentiny/tiny-engine'
import { TinyDialogBox, TinyProgress, TinyButton } from '@opentiny/vue'
import { fs } from '@opentiny/tiny-engine-utils'
import {generateAppCode} from '../../uniapp-generator/src'
import { fetchMetaData, fetchPageList, fetchBlockSchema, fetchTaskData } from './composable/http'
import JSZip from 'jszip'

export default {
  components: {
    ToolbarBase,
    TinyDialogBox,
    TinyProgress,
    TinyButton
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
    const process = ref(null)

    const state = reactive({
      showDialogbox: false,
      percentage: 0,
      fileUrl: '',
      uploadUrl: '/app-center/api/apps/harmonyCode'
    })

    const handleCancel = () => {
      state.percentage = 0
      state.showDialogbox = false
    }

    const download = () => {
      if (state.fileUrl) {
        handleCancel()
        window.open(state.fileUrl, '_blank')
      }
    }

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

    const { getAllNestedBlocksSchema } = getMetaApi('engine.service.generateCode')

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

      return [fileRes]
    }

    const getBuildProcess = async(data) => {
      process.value = setInterval(() => {
        const res = fetchTaskData(data.id)
        state.percentage = res.taskStatus
        if (state.percentage === 100) {
          useNotify({
            type: 'success',
            title: '构建成功',
            message: '项目已成功构建并上传'
          })
          clearTimeout(process.value)
          state.fileUrl = data.progress
        }
      }, 1000)
    }
    
    const build = async () => {
      try {
        state.showDialogbox = true
        // state.percentage = 10

        // 获取文件列表
        const [fileRes] = await getPreGenerateInfo()
        console.log('fileRes', fileRes)
        
        // state.percentage = 30

        // 创建zip实例
        const zip = new JSZip()
        
        // 将文件添加到zip中
        fileRes.forEach((file) => {
          zip.file(file.filePath, file.fileContent)
        })

        // state.percentage = 60

        // 生成zip文件
        const zipBlob = await zip.generateAsync({ type: 'blob' })

        console.log(zipBlob)

        // 创建FormData
        const formData = new FormData()
        formData.append('file', zipBlob, 'project.zip')

        // state.percentage = 80

        // 发送到后端
        const response = await fetch(state.uploadUrl, {
          method: 'POST',
          body: formData
        })

        if (!response.data) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`上传失败: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
        }

        getBuildProcess(response.data)

      } catch (error) {
        console.error('Build failed:', error)
        state.showDialogbox = false
        state.percentage = 0
        useNotify({
          type: 'error',
          title: '构建失败',
          message: error.message || '请稍后重试'
        })
      }
    }

    
    return {
      state,
      build,
      handleCancel,
      download
    }
  }
}
</script>
<style lang="less" scoped>
.build-dialog {
  padding: 10px;
}

.build-options {
}

.save-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.save-option input[type="checkbox"] {
  margin-right: 5px;
  cursor: pointer;
}
</style>