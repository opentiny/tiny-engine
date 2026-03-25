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
import {
  fetchPageList,
  fetchBlockGroups,
  createBlockGroup,
  createBlock,
  fetchBlockByLabel,
  updateBlock,
  deployBlock,
  fetchUtilsResourceList,
  createUtilsResource,
  updateUtilsResource
} from './http'
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
      pendingAppSchema: null as any,
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

    const mergeUtilsByName = (base: any[] = [], incoming: any[] = []) => {
      const merged = new Map<string, any>()

      ;[...base, ...incoming].forEach((item) => {
        if (!item?.name) return
        merged.set(String(item.name), item)
      })

      return Array.from(merged.values())
    }

    const syncImportedUtils = async (appId: string, importedUtils: any[] = []) => {
      const normalizedUtils = Array.isArray(importedUtils)
        ? importedUtils.filter((item) => item?.name && item?.type)
        : []
      const useUtilsApi: any = getMetaApi(META_SERVICE.UseUtils)
      const mergedLocalUtils = mergeUtilsByName(useUtilsApi?.getUtils?.() || [], normalizedUtils)

      useUtilsApi?.setUtils?.(mergedLocalUtils)

      if (!normalizedUtils.length) {
        return
      }

      try {
        const existingRes: any = await fetchUtilsResourceList(appId)
        const existingList = Array.isArray(existingRes) ? existingRes : existingRes?.data || []
        const existingMap = new Map<string, any>()

        existingList?.forEach?.((item: any) => {
          if (!item?.name) return
          existingMap.set(String(item.name), item)
        })

        await Promise.allSettled(
          normalizedUtils.map((item: any) => {
            const existing = existingMap.get(String(item.name))
            const payload = {
              ...(existing || {}),
              app: appId,
              category: 'utils',
              name: item.name,
              type: item.type,
              content: item.content || {}
            }

            return existing?.id ? updateUtilsResource(payload) : createUtilsResource(payload)
          })
        )

        await useUtilsApi?.refreshUtils?.()
      } catch (e) {
        useUtilsApi?.setUtils?.(mergedLocalUtils)
      }
    }

    const getNextBlockVersion = (block: any) => {
      const backupList = Array.isArray(block?.histories) ? block.histories : []

      let latestVersion = block?.current_version || '1.0.0'
      let latestTime = 0

      backupList.forEach((item: { created_at?: string | number | Date; version?: string }) => {
        const itemTime = item?.created_at ? new Date(item.created_at).getTime() : 0
        if (itemTime > latestTime && item?.version) {
          latestTime = itemTime
          latestVersion = item.version
        }
      })

      return String(latestVersion || '1.0.0').replace(/\d+$/, (match) => String(Number(match) + 1))
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

    const applyImportedAppSchema = async (appSchema: any, appId: string, hostType: string) => {
      const { appSchemaState } = useResource()
      const importedUtils = Array.isArray(appSchema?.utils) ? appSchema.utils : []
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
      appSchemaState.utils = importedUtils
      appSchemaState.dataSource = appSchema?.dataSource?.list || []
      appSchemaState.globalState = appSchema?.globalState || []
      appSchemaState.componentsMap = appSchema?.componentsMap || appSchemaState.componentsMap

      await syncImportedUtils(appId, importedUtils)
      const pages = Array.isArray(appSchema?.pageSchema) ? appSchema.pageSchema : []

      try {
        const componentsTree = pages.map((ps: any) => ({
          name: ps?.meta?.name || ps?.fileName || 'Page',
          meta: { ...(ps?.meta || {}), isPage: true, message: 'Page auto save', isBody: false, isHome: false },
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

      await useTranslate().initI18n({ host: appId, hostType: hostType, init: true })
    }

    const createAndPublishBlocks = async (appSchema: any, appId: string) => {
      const blocks = Array.isArray(appSchema?.blockSchemas) ? appSchema.blockSchemas : []
      if (!blocks.length) {
        return { total: 0, created: 0, updated: 0 }
      }

      if (blocks.length) {
        try {
          // 查询或创建区块分组
          let groupId: string | null = null
          try {
            const groupsRes: any = await fetchBlockGroups({ app: appId })
            const groups = Array.isArray(groupsRes) ? groupsRes : groupsRes?.data || []

            if (groups.length > 0) {
              // 使用第一个分组
              groupId = groups[0].id
            } else {
              // 创建默认分组 "我的分组"
              const createGroupRes: any = await createBlockGroup({
                name: '我的分组',
                app: appId
              })
              groupId = createGroupRes?.id
            }
          } catch (e) {
            // 继续创建区块，即使分组创建失败
          }

          // 创建区块
          // 先从页面 schema 中收集父组件传给各区块的 props
          const pages = Array.isArray(appSchema?.pageSchema) ? appSchema.pageSchema : []
          const parentPropsMap: Record<string, Record<string, any>> = {}
          const collectParentProps = (node: any) => {
            if (!node || typeof node !== 'object') return
            if (node.componentType === 'Block' && node.componentName && node.props) {
              const name = node.componentName
              if (!parentPropsMap[name]) parentPropsMap[name] = {}
              Object.keys(node.props).forEach((key) => {
                if (key !== 'className' && key !== 'style' && key !== 'class') {
                  parentPropsMap[name][key] = node.props[key]
                }
              })
            }
            if (Array.isArray(node.children)) {
              node.children.forEach(collectParentProps)
            }
          }
          pages.forEach((ps: any) => {
            if (ps?.children) ps.children.forEach(collectParentProps)
          })

          let createdCount = 0
          let updatedCount = 0

          await Promise.allSettled(
            blocks.map(async (bs: any) => {
              const blockLabel = bs.fileName || bs.meta?.name || 'Block'

              // 类型对应的默认编辑器组件
              const META_COMPONENTS: Record<string, string> = {
                array: 'CodeConfigurator',
                string: 'InputConfigurator',
                number: 'NumberConfigurator',
                object: 'CodeConfigurator',
                boolean: 'SwitchConfigurator',
                function: 'CodeConfigurator'
              }

              // 推断值的类型
              const inferType = (val: any): string => {
                if (val === null || val === undefined) return 'string'
                if (typeof val === 'object' && val.type === 'JSExpression') return 'string'
                if (Array.isArray(val)) return 'array'
                return typeof val
              }

              // 获取默认值（JSExpression 取其原始值，其他直接用）
              const getDefaultValue = (val: any): any => {
                if (val === null || val === undefined) return ''
                if (typeof val === 'object' && val.type === 'JSExpression') return ''
                return val
              }

              // 合并两个来源的 props：
              // 1. 子组件自身声明的 props（bs.props）
              // 2. 父组件传递的 props（parentPropsMap）
              const declaredProps: Record<string, any> = {}
              if (Array.isArray(bs.props)) {
                bs.props.forEach((p: any) => {
                  declaredProps[p.name] = p
                })
              }
              const parentProps = parentPropsMap[blockLabel] || {}

              // 以父组件传递的 props 为主，合并子组件声明的 props
              const mergedPropNames = new Set([...Object.keys(declaredProps), ...Object.keys(parentProps)])

              const blockProperties: any[] = []
              mergedPropNames.forEach((propName) => {
                const declared = declaredProps[propName]
                const parentVal = parentProps[propName]

                const propType = declared?.type || inferType(parentVal)
                const defaultValue = declared?.default !== undefined ? declared.default : getDefaultValue(parentVal)

                blockProperties.push({
                  property: propName,
                  type: propType,
                  defaultValue: defaultValue,
                  label: {
                    text: {
                      zh_CN: propName
                    }
                  },
                  cols: 12,
                  rules: [],
                  accessor: {},
                  hidden: false,
                  required: declared?.required || false,
                  readOnly: false,
                  disabled: false,
                  widget: {
                    component: META_COMPONENTS[propType] || 'InputConfigurator',
                    props: {}
                  },
                  properties: [
                    {
                      label: {
                        zh_CN: '默认分组'
                      },
                      content: []
                    }
                  ]
                })
              })

              // 将子节点中引用 state 变量的地方转换为 this.props.xxx
              const propNames = new Set(blockProperties.map((p: any) => p.property))
              const rewriteChildrenProps = (node: any) => {
                if (!node || typeof node !== 'object') return
                if (node.props && typeof node.props === 'object') {
                  Object.keys(node.props).forEach((key) => {
                    const val = node.props[key]
                    // 将 state 引用转为 props 引用
                    if (typeof val === 'object' && val?.type === 'JSExpression' && typeof val.value === 'string') {
                      propNames.forEach((pn) => {
                        if (val.value.includes(`this.state.${pn}`)) {
                          val.value = val.value.replace(new RegExp(`this\\.state\\.${pn}`, 'g'), `this.props.${pn}`)
                        }
                      })
                    }
                  })
                }
                if (Array.isArray(node.children)) {
                  node.children.forEach(rewriteChildrenProps)
                }
              }
              const children = JSON.parse(JSON.stringify(bs.children || []))
              children.forEach(rewriteChildrenProps)

              const blockParams: any = {
                label: blockLabel,
                name_cn: blockLabel,
                public: 1,
                framework: 'Vue',
                created_app: appId,
                content: {
                  componentName: 'Block',
                  fileName: blockLabel,
                  css: bs.css || '',
                  props: {},
                  children: children,
                  schema: {
                    properties: [
                      {
                        label: {
                          zh_CN: '基础信息'
                        },
                        description: {
                          zh_CN: '基础信息'
                        },
                        collapse: {
                          number: 6,
                          text: {
                            zh_CN: '显示更多'
                          }
                        },
                        content: blockProperties
                      }
                    ],
                    events: {},
                    slots: {}
                  },
                  state: {},
                  methods: bs.methods || {},
                  dataSource: bs.dataSource || {},
                  dependencies: bs.dependencies || { scripts: [], styles: [] },
                  id: 'body'
                }
              }

              // 添加分组ID（如果成功获取或创建）
              if (groupId) {
                blockParams.groups = [groupId]
              } else {
                // 备选方案：使用空分类数组
                blockParams.categories = []
              }

              const existingRes: any = await fetchBlockByLabel(blockLabel).catch(() => [])
              const existingList = Array.isArray(existingRes) ? existingRes : existingRes?.data || []
              const existing =
                existingList.find?.(
                  (item: any) =>
                    String(item?.label) === String(blockLabel) &&
                    String(item?.created_app || item?.app || '') === String(appId)
                ) ||
                existingList.find?.((item: any) => String(item?.label) === String(blockLabel)) ||
                existingList?.[0]

              let blockData: any = null

              if (existing?.id) {
                const existingGroups = Array.isArray(existing.groups)
                  ? existing.groups.map((item: any) => item?.id || item).filter(Boolean)
                  : []
                const existingCategories = Array.isArray(existing.categories)
                  ? existing.categories.map((item: any) => item?.id || item).filter(Boolean)
                  : []
                const updateParams = {
                  name_cn: blockParams.name_cn,
                  label: blockParams.label,
                  content: blockParams.content,
                  screenshot: existing.screenshot,
                  public: existing.public ?? blockParams.public,
                  public_scope_tenants: existing.public_scope_tenants || [],
                  tags: existing.tags || [],
                  description: existing.description || '',
                  ...(groupId
                    ? { groups: [groupId] }
                    : existingGroups.length
                    ? { groups: existingGroups }
                    : { categories: existingCategories.length ? existingCategories : blockParams.categories || [] })
                }

                blockData = await updateBlock(existing.id, updateParams, appId)
                if (blockData?.id) {
                  updatedCount += 1
                }
              } else {
                blockData = await createBlock(blockParams)
                if (blockData?.id) {
                  createdCount += 1
                }
              }

              if (blockData?.id) {
                const publishVersion = existing?.id
                  ? getNextBlockVersion(existing)
                  : blockData?.current_version || '1.0.1'
                const params = {
                  block: blockData,
                  is_compile: true,
                  deploy_info: '导入项目自动发布',
                  version: publishVersion,
                  needToSave: true
                }
                await deployBlock(params)
              }
            })
          )

          return {
            total: blocks.length,
            created: createdCount,
            updated: updatedCount
          }
        } catch (e) {
          // 区块创建失败不阻塞页面导入流程
        }
      }

      return { total: blocks.length, created: 0, updated: 0 }
    }

    const processAppSchema = async (appSchema: any) => {
      const { id: appId, type } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
      const pages = Array.isArray(appSchema?.pageSchema) ? appSchema.pageSchema : []

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
            state.duplicatePages = pagesToUpdate
            state.toCreatePages = pagesToCreate
            state.pendingImportedPages = pages
            state.pendingAppSchema = appSchema
            state.showOverwriteDialog = true
            return
          }

          await Promise.allSettled(
            pagesToCreate.map((ps: any) =>
              getMetaApi(META_SERVICE.Http).post('/app-center/api/pages/create', buildCreateParams(ps))
            )
          )
          const { pageSettingState } = usePage()
          await pageSettingState.updateTreeData?.()
        } catch (e) {
          await Promise.allSettled(
            pages.map((ps: any) =>
              getMetaApi(META_SERVICE.Http).post('/app-center/api/pages/create', buildCreateParams(ps))
            )
          )
          const { pageSettingState } = usePage()
          await pageSettingState.updateTreeData?.()
        }
      }

      await applyImportedAppSchema(appSchema, appId, type)
      const blockResult = await createAndPublishBlocks(appSchema, appId)

      const chosen = pages.find((p: any) => p?.meta?.isHome) || pages[0]
      const blockMsg = blockResult?.total
        ? `，已处理 ${blockResult.total} 个区块${blockResult.updated ? `（更新 ${blockResult.updated}）` : ''}`
        : ''
      if (!chosen) {
        useNotify({ type: 'success', title: '导入成功', message: `已更新全局配置（未检测到页面）${blockMsg}` })
      } else {
        await switchToPageByName(chosen?.meta?.name || chosen?.fileName)
        useNotify({
          type: 'success',
          title: '导入成功',
          message: `已创建页面并加载：${chosen?.meta?.name || '页面'}${blockMsg}`
        })
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
            },
            message: 'Page auto save',
            isBody: false,
            isHome: false
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
          },
          message: 'Page auto save',
          isBody: false,
          isHome: false
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
        const converter = new VueToDslConverter({ computed_flag: true })

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
        const { type } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
        const pendingAppSchema = state.pendingAppSchema
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
            page_content: { ...ps, fileName: ps?.fileName || rawName },
            message: 'Page auto save',
            isBody: false,
            isHome: false
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
              page_content: { ...ps, fileName: ps?.fileName || ps?.meta?.name || 'Page' },
              message: 'Page auto save',
              isBody: false,
              isHome: false
            })
          )
        }
        if (requests.length) {
          await Promise.allSettled(requests)
        }
        const hasOps = requests.length > 0
        if (hasOps) {
          await pageSettingState.updateTreeData?.()
          if (pendingAppSchema) {
            await applyImportedAppSchema(pendingAppSchema, appId, type)
          }
          const blockResult = pendingAppSchema
            ? await createAndPublishBlocks(pendingAppSchema, appId)
            : { total: 0, created: 0, updated: 0 }
          // 用户选择后进行渲染
          const pages = state.pendingImportedPages
          const chosen = pages.find((p: any) => p?.meta?.isHome) || pages[0]
          const blockMsg = blockResult?.total
            ? `，已处理 ${blockResult.total} 个区块${blockResult.updated ? `（更新 ${blockResult.updated}）` : ''}`
            : ''
          if (chosen) {
            await switchToPageByName(chosen?.meta?.name || chosen?.fileName)
            useNotify({
              type: 'success',
              title: '导入成功',
              message: `已创建/覆盖页面并加载：${chosen?.meta?.name || '页面'}${blockMsg}`
            })
          } else {
            useNotify({
              type: 'success',
              title: '导入成功',
              message: `已更新全局配置（未检测到页面）${blockMsg}`
            })
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
        state.pendingAppSchema = null
      }
    }

    // 覆盖选择：取消
    const handleOverwriteCancel = async () => {
      state.showOverwriteDialog = false
      state.duplicatePages = []
      state.toCreatePages = []
      state.pendingImportedPages = []
      state.pendingAppSchema = null
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
