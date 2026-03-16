<template>
  <div class="toolbar-upload">
    <tiny-popover :visible-arrow="false" trigger="manual" :open-delay="OPEN_DELAY.Default" v-model="poperVisible">
      <template #reference>
        <toolbar-base
          content="导入"
          :icon="options.icon?.default || options?.icon"
          :options="options"
          @click-api="clickPopover"
        >
        </toolbar-base>
      </template>
      <div class="toolbar-upload-option">
        <div class="toolbar-upload-item" @click="() => triggerUpload('file')">Vue 文件</div>
        <div class="toolbar-upload-item" @click="() => triggerUpload('directory')">项目目录</div>
        <div class="toolbar-upload-item" @click="() => triggerUpload('zip')">项目压缩包</div>
      </div>
      <input ref="fileInputRef" type="file" accept=".vue" style="display: none" @change="handleFileChange" />
      <input ref="directoryInputRef" type="file" webkitdirectory style="display: none" @change="handleFileChange" />
      <input
        ref="zipInputRef"
        type="file"
        accept=".zip,application/zip"
        style="display: none"
        @change="handleFileChange"
      />
    </tiny-popover>
    <!-- 覆盖选择对话框 -->
    <overwrite-dialog
      :visible="state.showOverwriteDialog"
      :duplicates="state.duplicatePages.map((d) => ({ name: d.name }))"
      @update:visible="(v) => (state.showOverwriteDialog = v)"
      @confirm="handleOverwriteConfirm"
      @cancel="handleOverwriteCancel"
    />
  </div>
</template>

<script lang="ts">
/* metaService: engine.toolbars.upload.Main */
import { reactive, ref } from 'vue'
import {
  useNotify,
  useResource,
  usePage,
  useTranslate,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { fetchPageList } from './http'
import { VueToDslConverter } from '@opentiny/tiny-engine-vue-to-dsl'
import OverwriteDialog from './OverwriteDialog.vue'
import { TinyPopover } from '@opentiny/vue'
import { constants } from '@opentiny/tiny-engine-utils'

const { OPEN_DELAY } = constants

// @ts-ignore
export default {
  components: {
    ToolbarBase,
    OverwriteDialog,
    TinyPopover
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const state = reactive({
      showOverwriteDialog: false,
      duplicatePages: [] as Array<{ name: string; ps: any; existing: any }>,
      toCreatePages: [] as any[],
      pendingImportedPages: [] as any[],
      appId: '' as any
    })

    const poperVisible = ref(false)
    const clickPopover = () => {
      poperVisible.value = !poperVisible.value
    }

    const closePopover = () => {
      poperVisible.value = false
    }

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
    // 触发隐藏文件上传
    const triggerUpload = (type: 'file' | 'directory' | 'zip') => {
      closePopover()
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
          },
          message: 'Page auto save',
          isBody: false,
          isHome: false
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
      OPEN_DELAY,
      poperVisible,
      clickPopover,
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
.toolbar-upload-option {
  display: flex;
  justify-content: center;
  flex-direction: column;

  .toolbar-upload-item {
    cursor: pointer;
    line-height: 28px;
    margin: 0 -16px;
    padding: 0 16px;
    &:hover {
      background-color: var(--te-toolbars-upload-bg-color-hover);
    }
  }
}
</style>
