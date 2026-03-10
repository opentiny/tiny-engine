<template>
  <div class="toolbar-helpGuid">
    <toolbar-base content="出码" :icon="options.icon.download || options.icon" :options="options" @click-api="generate">
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
    <tiny-popover placement="bottom" trigger="hover" popper-class="option-popper">
      <template #reference>
        <toolbar-base class="ml-8" content="导入" :icon="options.icon?.upload || options?.icon" :options="options" />
      </template>
      <div class="option-list">
        <div class="option-item" @click="() => triggerUpload('file')">Vue 文件</div>
        <div class="option-item" @click="() => triggerUpload('directory')">项目目录</div>
        <div class="option-item" @click="() => triggerUpload('zip')">项目压缩包</div>
      </div>
    </tiny-popover>
    <input ref="fileInputRef" type="file" accept=".vue" style="display: none" @change="handleFileChange" />
    <input ref="directoryInputRef" type="file" webkitdirectory style="display: none" @change="handleFileChange" />
    <input
      ref="zipInputRef"
      type="file"
      accept=".zip,application/zip"
      style="display: none"
      @change="handleFileChange"
    />
    <!-- 覆盖选择对话框 -->
    <overwrite-dialog
      :visible="state.showOverwriteDialog"
      :duplicates="state.duplicatePages.map((d) => ({ name: d.name }))"
      @update:visible="(v:any)=> (state.showOverwriteDialog = v)"
      @confirm="handleOverwriteConfirm"
      @cancel="handleOverwriteCancel"
    />
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
import OverwriteDialog from './OverwriteDialog.vue'
import { TinyPopover } from '@opentiny/vue'

// @ts-ignore
export default {
  components: {
    GenerateFileSelector: FileSelector as any,
    ToolbarBase: ToolbarBase as any,
    OverwriteDialog: OverwriteDialog as any,
    TinyPopover: TinyPopover as any
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
      saveFilesTree: [],
      showOverwriteDialog: false,
      duplicatePages: [] as Array<{ name: string; ps: any; existing: any }>,
      toCreatePages: [] as any[],
      pendingImportedPages: [] as any[],
      appId: '' as any
    })

    // 文件上传引用
    const fileInputRef = ref<HTMLInputElement | null>(null)
    // 目录上传引用
    const directoryInputRef = ref<HTMLInputElement | null>(null)
    // zip压缩包上传引用
    const zipInputRef = ref<HTMLInputElement | null>(null)

    // 按页面ID切换到对应页面，确保 currentPage 与渲染一致
    const switchToPageByName = async (name?: string) => {
      if (!name) return
      // 优先使用已缓存的 appId
      const appId = state.appId || getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
      try {
        const list: any[] = await fetchPageList(appId)
        const target = list?.find?.((p: any) => String(p?.name) === String(name))
        if (target?.id) {
          await usePage().switchPageWithConfirm?.(target.id, true)
        }
      } catch (e) {
        // ignore
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

    // 触发隐藏文件上传
    const triggerUpload = (type: 'file' | 'directory' | 'zip') => {
      if (type === 'file') {
        fileInputRef.value?.click()
      } else if (type === 'directory') {
        directoryInputRef.value?.click()
      } else if (type === 'zip') {
        zipInputRef.value?.click()
      }
    }

    const processAppSchema = async (appSchema: any) => {
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
      // 保存 appId 供覆盖选择确认/取消时使用
      state.appId = appId
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
        // 检查是否存在与现有页面重名（按 meta.name/fileName 比较）
        try {
          const existingList: any[] = await fetchPageList(appId)
          const mapByName = new Map<string, any>()
          existingList?.forEach?.((p: any) => {
            if (p?.name) mapByName.set(String(p.name), p)
          })

          const getRawName = (ps: any) => (ps?.meta?.name || ps?.fileName || 'Page') as string
          const pagesToUpdate: Array<{ ps: any; existing: any; name: string }> = []
          const pagesToCreate: any[] = []
          const duplicateNames: string[] = []

          for (const ps of pages) {
            const rawName = getRawName(ps)
            const existing = mapByName.get(rawName)
            if (existing) {
              pagesToUpdate.push({ ps, existing, name: rawName })
              duplicateNames.push(rawName)
            } else {
              pagesToCreate.push(ps)
            }
          }

          if (duplicateNames.length) {
            // 打开覆盖选择对话框并缓存数据，等待用户选择
            state.duplicatePages = pagesToUpdate
            state.toCreatePages = pagesToCreate
            state.pendingImportedPages = pages
            state.showOverwriteDialog = true
          } else {
            // 无重名，直接创建
            await Promise.allSettled(
              pagesToCreate.map((ps: any) =>
                getMetaApi(META_SERVICE.Http).post('/app-center/api/pages/create', buildCreateParams(ps))
              )
            )
            const { pageSettingState } = usePage()
            await pageSettingState.updateTreeData?.()
          }
        } catch (e) {
          // 若校验失败，则回退为原始创建逻辑
          await Promise.allSettled(
            pages.map((ps: any) =>
              getMetaApi(META_SERVICE.Http).post('/app-center/api/pages/create', buildCreateParams(ps))
            )
          )
          const { pageSettingState } = usePage()
          await pageSettingState.updateTreeData?.()
        }
      }

      // 若弹出覆盖选择对话框，则先不立即渲染，等用户选择后再渲染
      if (!state.showOverwriteDialog) {
        const chosen = pages.find((p: any) => p?.meta?.isHome) || pages[0]
        if (!chosen) {
          useNotify({ type: 'success', title: '导入成功', message: `已更新全局配置（未检测到页面）` })
        } else {
          await switchToPageByName(chosen?.meta?.name || chosen?.fileName)
          useNotify({
            type: 'success',
            title: '导入成功',
            message: `已创建页面并加载：${chosen?.meta?.name || '页面'}`
          })
        }
      }
    }

    const processSingleFile = async (file: File, converter: VueToDslConverter) => {
      const text = await file.text()
      const result = await converter.convertFromString(text, file.name)

      // 解析单文件页面信息
      const rawName = (result?.schema?.meta?.name || file.name).replace(/\.(vue|jsx|tsx)$/i, '')
      const safeRoute = `${rawName.replace(/\s+/g, '-').toLowerCase()}`
      const fileName = result?.schema?.fileName || rawName
      const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

      // 检查是否与现有页面重名
      try {
        const existingList: any[] = await fetchPageList(appId)
        const existing = existingList?.find?.((p: any) => String(p?.name) === rawName)

        // 将待导入的 schema 作为 ps（与 zip 流程保持一致的数据形态）
        const ps: any = {
          ...result.schema,
          meta: { ...(result?.schema?.meta || {}), name: rawName },
          fileName
        }

        if (existing) {
          // 重名：弹出覆盖对话框
          state.appId = appId
          state.duplicatePages = [{ ps, existing, name: rawName }]
          state.toCreatePages = []
          state.pendingImportedPages = [ps]
          state.showOverwriteDialog = true
        } else {
          // 不重名：直接创建
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
          const { pageSettingState } = usePage()
          await pageSettingState.updateTreeData?.()
          useNotify({ type: 'success', title: '导入成功', message: `已创建新页面：${rawName}` })
        }
      } catch (e: any) {
        // 兜底：如果列表获取失败，按原逻辑创建
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
        const { pageSettingState } = usePage()
        await pageSettingState.updateTreeData?.()
        useNotify({ type: 'success', title: '导入成功', message: `已创建新页面：${rawName}` })
      }
    }

    // 处理上传的 .vue 或 .zip 文件
    const handleFileChange = async (e: Event) => {
      const input = e.target as HTMLInputElement
      const files = input?.files
      if (!files || files.length === 0) return

      try {
        // 转换器实例
        const converter = new VueToDslConverter()

        // 检查是目录上传还是文件上传
        const isDirectory = files[0].webkitRelativePath !== ''

        if (isDirectory) {
          const appSchema: any = await converter.convertAppFromDirectory(files)
          // 后续处理与 zip 包导入类似
          await processAppSchema(appSchema)
        } else {
          const file = files[0]
          // zip：转换整个应用；vue：转换单文件
          const isZip = /\.zip$/i.test(file.name)
          if (isZip) {
            const buffer = await file.arrayBuffer()
            const appSchema: any = await converter.convertAppFromZip(buffer)
            await processAppSchema(appSchema)
          } else {
            // 单个 vue 文件导入
            await processSingleFile(file, converter)
          }
        }
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(error)
        useNotify({ type: 'error', title: '加载失败', message: error?.message || String(error) })
      } finally {
        // 清空 input 以便可重复选择同一文件
        if (fileInputRef.value) fileInputRef.value.value = ''
        if (directoryInputRef.value) directoryInputRef.value.value = ''
        if (zipInputRef.value) zipInputRef.value.value = ''
      }
    }

    // 覆盖选择：确认
    const handleOverwriteConfirm = async (selectedNames: string[]) => {
      const { pageSettingState } = usePage()
      try {
        const appId = state.appId
        const requests: Promise<any>[] = []
        // 更新选中的重名项
        for (const item of state.duplicatePages) {
          if (!selectedNames.includes(item.name)) continue
          const ps = item.ps
          const existing = item.existing
          const rawName = item.name
          const safeRoute = `/${rawName.replace(/\s+/g, '-').toLowerCase()}`
          const updateParams: any = {
            ...existing,
            name: rawName,
            route: ps?.meta?.router || existing?.route || safeRoute,
            isPage: true,
            app: appId,
            page_content: { ...ps, fileName: ps?.fileName || rawName }
          }
          requests.push(getMetaApi(META_SERVICE.Http).post(`/app-center/api/pages/update/${existing.id}`, updateParams))
        }
        // 创建不重名项
        for (const ps of state.toCreatePages) {
          requests.push(
            getMetaApi(META_SERVICE.Http).post('/app-center/api/pages/create', {
              name: ps?.meta?.name || ps?.fileName || 'Page',
              route:
                ps?.meta?.router || `/${(ps?.meta?.name || ps?.fileName || 'Page').replace(/\s+/g, '-').toLowerCase()}`,
              group: 'staticPages',
              parentId: '0',
              isPage: true,
              app: appId,
              page_content: { ...ps, fileName: ps?.fileName || ps?.meta?.name || 'Page' }
            })
          )
        }
        if (requests.length) {
          await Promise.allSettled(requests)
        }
        const hasOps = requests.length > 0
        if (hasOps) {
          await pageSettingState.updateTreeData?.()
          // 用户选择后进行渲染
          const pages = state.pendingImportedPages
          const chosen = pages.find((p: any) => p?.meta?.isHome) || pages[0]
          if (chosen) {
            await switchToPageByName(chosen?.meta?.name || chosen?.fileName)
            useNotify({
              type: 'success',
              title: '导入成功',
              message: `已创建/覆盖页面并加载：${chosen?.meta?.name || '页面'}`
            })
          } else {
            useNotify({ type: 'success', title: '导入成功', message: `已更新全局配置（未检测到页面）` })
          }
        } else {
          // 无任何选择且无不重名项：直接跳过
          useNotify({ type: 'info', title: '已跳过导入', message: '未选择覆盖任何页面' })
        }
      } finally {
        state.showOverwriteDialog = false
        state.duplicatePages = []
        state.toCreatePages = []
        state.pendingImportedPages = []
      }
    }

    // 覆盖选择：取消
    const handleOverwriteCancel = async () => {
      state.showOverwriteDialog = false
      state.duplicatePages = []
      state.toCreatePages = []
      state.pendingImportedPages = []
      useNotify({ type: 'info', title: '已取消导入', message: '未创建或覆盖任何页面' })
    }

    return {
      state,
      generate,
      confirm,
      cancel,
      triggerUpload,
      handleFileChange,
      fileInputRef,
      directoryInputRef,
      zipInputRef,
      handleOverwriteConfirm,
      handleOverwriteCancel
    }
  }
}
</script>
<style lang="less" scoped>
.toolbar-helpGuid {
  display: inline-flex;
  align-items: center;
}

.option-popper {
  background-color: var(--ti-lowcode-toolbar-bg, #fff);
  border: 1px solid var(--ti-lowcode-toolbar-border-color, #e5e7eb);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;

  .option-list {
    display: flex;
    flex-direction: column;

    .option-item {
      padding: 8px 8px;
      cursor: pointer;
      border-radius: 4px;
      color: var(--ti-lowcode-toolbar-icon-color, #333);
      transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

      &:hover {
        background-color: var(--ti-lowcode-toolbar-hover-bg, #f3f4f6);
        color: var(--ti-lowcode-toolbar-icon-color-hover, #1989fa);
      }
    }
  }
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
