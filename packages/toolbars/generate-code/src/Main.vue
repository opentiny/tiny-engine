<template>
  <div class="toolbar-helpGuid">
    <toolbar-base content="出码" :icon="options.icon.download || options.icon" :options="options" @click-api="generate">
      <template #default>
        <generate-file-selector
          :visible="state.showDialogbox"
          :data="state.saveFilesInfo"
          @confirm="confirm"
          @cancel="cancel"
        ></generate-file-selector>
      </template>
    </toolbar-base>
    <toolbar-base
      class="ml-8"
      content="导入"
      :icon="options.icon?.upload || options?.icon"
      :options="options"
      @click-api="triggerUpload"
    >
      <template #default>
        <input ref="fileInputRef" type="file" accept=".vue,.zip" style="display: none" @change="handleFileChange" />
      </template>
    </toolbar-base>
  </div>
</template>

<script lang="ts">
/* metaService: engine.toolbars.generate-code.Main */
import { reactive, ref } from 'vue'
import {
  useBlock,
  useCanvas,
  useNotify,
  useLayout,
  useResource,
  usePage,
  useTranslate,
  getMetaApi,
  META_APP,
  getMergeMeta,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { fs } from '@opentiny/tiny-engine-utils'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { fetchMetaData, fetchPageList, fetchBlockSchema } from './http'
import FileSelector from './FileSelector.vue'
import { VueToDslConverter } from '@opentiny/tiny-engine-vue-to-dsl'

// @ts-ignore
export default {
  components: {
    GenerateFileSelector: FileSelector as any,
    ToolbarBase: ToolbarBase as any
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
      saveFilesInfo: []
    })

    // 文件上传引用
    const fileInputRef = ref<HTMLInputElement | null>(null)

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

    const getPreGenerateInfo = async () => {
      const params = getParams()
      const { id } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
      const promises = [
        getMetaApi(META_SERVICE.Http).get(`/app-center/v1/api/apps/schema/${id}`),
        fetchMetaData(params),
        fetchPageList(params.app)
      ]

      if (!state.dirHandle) {
        promises.push(fs.getUserBaseDirHandle())
      }

      const [appData, metaData, pageList, dirHandle] = await Promise.all(promises)
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

    // 触发隐藏文件上传
    const triggerUpload = () => {
      fileInputRef.value?.click()
    }

    // 处理上传的 .vue 或 .zip 文件
    const handleFileChange = async (e: Event) => {
      const input = e.target as HTMLInputElement
      const file = input?.files?.[0]
      if (!file) return

      try {
        // 转换器实例
        const converter = new VueToDslConverter()

        // zip：转换整个应用；vue：转换单文件
        const isZip = /\.zip$/i.test(file.name)
        if (isZip) {
          const buffer = await file.arrayBuffer()
          const appSchema: any = await converter.convertAppFromZip(buffer)
          // 将 appSchema 应用到全局
          const { appSchemaState } = useResource()
          // 1) 全局元数据（i18n/utils/dataSource/globalState/componentsMap）
          const i18n = appSchema?.i18n || {}
          const locales = Object.keys(i18n).length
            ? Object.keys(i18n).map((key) => ({ lang: key, label: key }))
            : [
                { lang: 'zh_CN', label: 'zh_CN' },
                { lang: 'en_US', label: 'en_US' }
              ]
          appSchemaState.langs = {
            locales,
            messages: i18n
          }
          appSchemaState.utils = appSchema?.utils || []
          appSchemaState.dataSource = appSchema?.dataSource?.list || []
          appSchemaState.globalState = appSchema?.globalState || []
          appSchemaState.componentsMap = appSchema?.componentsMap || appSchemaState.componentsMap

          // 同步刷新 i18n 到画布/设计器
          const { id, type } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
          await useTranslate().initI18n({ host: id, hostType: type, init: true })

          // 2) 创建静态页面（批量）并刷新页面树
          const pages = Array.isArray(appSchema?.pageSchema) ? appSchema.pageSchema : []
          // 将应用级 schema 归一化并持久化，便于 Http 拦截器统一返回
          try {
            const componentsTree = pages.map((ps: any) => ({
              name: ps?.meta?.name || ps?.fileName || 'Page',
              meta: { ...(ps?.meta || {}), isPage: true },
              page_content: ps
            }))
            if (!componentsTree.some((p: any) => p?.meta?.isHome) && componentsTree[0]) {
              componentsTree[0].meta.isHome = true
            }
            const normalizedAppData = {
              ...appSchema,
              componentsTree,
              pageSchema: pages,
              meta: {
                ...(appSchema.meta || {}),
                globalState: (appSchema.meta && appSchema.meta.globalState) || appSchema.globalState || []
              }
            }
            localStorage.setItem('TE_LOCAL_APPSCHEMA', JSON.stringify(normalizedAppData))
          } catch (e) {
            // ignore persistence errors
          }
          const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
          const buildCreateParams = (ps: any) => {
            const rawName = (ps?.meta?.name || ps?.fileName || 'Page') as string
            const safeRoute = `/${rawName.replace(/\s+/g, '-').toLowerCase()}`
            return {
              name: rawName,
              route: ps?.meta?.router || safeRoute,
              group: 'staticPages',
              parentId: '0',
              isPage: true,
              app: appId,
              page_content: {
                ...ps,
                fileName: ps?.fileName || rawName
              }
            }
          }

          if (pages.length) {
            // 并发创建，忽略失败项
            await Promise.allSettled(
              pages.map((ps: any) =>
                getMetaApi(META_SERVICE.Http).post('/app-center/api/pages/create', buildCreateParams(ps))
              )
            )

            // 刷新页面列表
            const { pageSettingState } = usePage()
            await pageSettingState.updateTreeData?.()
          }

          // 3) 渲染首页或第一个页面到画布
          const chosen = pages.find((p: any) => p?.meta?.isHome) || pages[0]
          if (!chosen) {
            useNotify({ type: 'success', title: '导入成功', message: `已更新全局配置（未检测到页面）` })
          } else {
            const { isBlock, pageState, resetBlockCanvasState, resetPageCanvasState } = useCanvas()
            if (isBlock()) {
              resetBlockCanvasState({ ...pageState, pageSchema: chosen })
            } else {
              resetPageCanvasState({ ...pageState, pageSchema: chosen })
            }
            useNotify({
              type: 'success',
              title: '导入成功',
              message: `已创建页面并加载：${chosen?.meta?.name || '页面'}`
            })
          }
        } else {
          const text = await file.text()
          const result = await converter.convertFromString(text, file.name)

          // 不直接应用到画布：创建一个新的静态页面
          const rawName = (result?.schema?.meta?.name || file.name).replace(/\.(vue|jsx|tsx)$/i, '')
          const safeRoute = `${rawName.replace(/\s+/g, '-').toLowerCase()}`
          const fileName = result?.schema?.fileName || rawName
          const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

          const createParams: any = {
            name: rawName,
            route: result?.schema?.meta?.router || safeRoute,
            group: 'staticPages',
            parentId: '0',
            isPage: true,
            app: appId,
            page_content: {
              ...result.schema,
              fileName
            }
          }

          await getMetaApi(META_SERVICE.Http).post('/app-center/api/pages/create', createParams)

          // 刷新页面列表
          const { pageSettingState } = usePage()
          await pageSettingState.updateTreeData?.()

          useNotify({ type: 'success', title: '导入成功', message: `已创建新页面：${rawName}` })
        }
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(error)
        useNotify({ type: 'error', title: '加载失败', message: error?.message || String(error) })
      } finally {
        // 清空 input 以便可重复选择同一文件
        if (fileInputRef.value) fileInputRef.value.value = ''
      }
    }

    return {
      state,
      generate,
      confirm,
      cancel,
      triggerUpload,
      handleFileChange,
      fileInputRef
    }
  }
}
</script>
<style lang="less" scoped>
.toolbar-helpGuid {
  display: inline-flex;
  align-items: center;
}

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
