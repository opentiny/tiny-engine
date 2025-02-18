<template>
  <div :class="['vue-repl-container', debugSwitch ? 'preview-debug-mode' : '']">
    <Repl
      :editor="editorComponent"
      :store="store"
      :showCompileOutput="false"
      :showTsConfig="false"
      :showImportMap="true"
      :clearConsole="false"
      :autoResize="false"
    />
  </div>
</template>

<script>
import { defineComponent, computed, defineAsyncComponent, ref } from 'vue'
import { Repl, useStore } from '@vue/repl'
import { getMetaApi } from '@opentiny/tiny-engine-meta-register'
import { getImportMap as getInitImportMap } from './importMap'
import srcFiles from './srcFiles'
import generateMetaFiles, { processAppJsCode } from './generate'
import { getSearchParams, fetchMetaData, fetchImportMap, fetchAppSchema, fetchBlockSchema } from './http'
import { PreviewTips } from '../constant'
import { injectDebugSwitch } from './debugSwitch'
import '@vue/repl/style.css'

const Monaco = defineAsyncComponent(() => import('@vue/repl/monaco-editor')) // 异步组件实现懒加载，打开debug后再加载

const EmptyEditor = defineComponent({
  setup() {
    return () => null
  }
})

export default {
  components: {
    Repl
  },
  setup() {
    const debugSwitch = injectDebugSwitch()
    const editorComponent = computed(() => (debugSwitch?.value ? Monaco : EmptyEditor))

    const sfcOptions = ref({
      script: {
        // scirpt setup 编译后注入 import { * } from "vue"
        inlineTemplate: false
      }
    })

    const currentImportMap = ref({
      imports: {}
    })

    const store = useStore({
      builtinImportMap: currentImportMap,
      showOutput: false,
      outputMode: 'preview',
      sfcOptions
    })
    const { getAllNestedBlocksSchema, generatePageCode } = getMetaApi('engine.service.generateCode')
    const ROOT_ID = '0'

    const setImportMap = (newImportMap) => {
      currentImportMap.value = newImportMap
    }

    const setFiles = async (newFiles, mainFileName) => {
      await store.setFiles(newFiles, mainFileName)
    }

    const queryParams = getSearchParams()
    document.documentElement?.setAttribute?.('data-theme', queryParams.theme || 'light')

    const getImportMap = async () => {
      if (import.meta.env.VITE_LOCAL_BUNDLE_DEPS === 'true') {
        const mapJSON = await fetchImportMap()
        return {
          imports: {
            ...mapJSON.imports,
            ...getSearchParams().scripts
          }
        }
      }
      return getInitImportMap()
    }

    const getFamilyPages = (appData) => {
      const familyPages = []
      const ancestors = queryParams.ancestors

      if (!ancestors?.length || !appData?.componentsMap) {
        return familyPages
      }

      for (let i = 0; i < ancestors.length; i++) {
        const nextPage = i < ancestors.length - 1 ? ancestors[i + 1].name : null
        const panelValueAndType = {
          panelValue:
            generatePageCode(
              ancestors[i].page_content,
              appData?.componentsMap || [],
              {
                blockRelativePath: './'
              },
              nextPage
            ) || '',
          panelType: 'vue'
        }

        if (ancestors[i]?.parentId === ROOT_ID) {
          familyPages.push({
            ...panelValueAndType,
            panelName: 'Main.vue',
            index: true
          })
        } else {
          familyPages.push({
            ...panelValueAndType,
            panelName: `${ancestors[i].name}.vue`,
            index: false
          })
        }
      }

      return familyPages
    }

    const promiseList = [fetchAppSchema(queryParams?.app), fetchMetaData(queryParams), getImportMap()]

    Promise.all(promiseList).then(async ([appData, metaData, importMapData]) => {
      setImportMap(importMapData)
      await setFiles(srcFiles, 'App.vue')

      const blocks = await getAllNestedBlocksSchema(queryParams.pageInfo?.schema, fetchBlockSchema)

      // TODO: 物料内置 block 需要如何处理？
      const pageCode = [
        ...getFamilyPages(appData),
        ...(blocks || []).map((blockSchema) => {
          return {
            panelName: `${blockSchema.fileName}.vue`,
            panelValue: generatePageCode(blockSchema, appData?.componentsMap || [], { blockRelativePath: './' }) || '',
            panelType: 'vue'
          }
        })
      ]

      const newFiles = store.getFiles()

      const assignFiles = ({ panelName, panelValue, index }) => {
        if (index) {
          panelName = 'Main.vue'
        }

        newFiles[panelName] = panelValue
      }

      const appJsCode = processAppJsCode(newFiles['app.js'], queryParams.styles)

      newFiles['app.js'] = appJsCode

      pageCode.forEach(assignFiles)

      const metaFiles = generateMetaFiles(metaData)
      Object.assign(newFiles, metaFiles)

      setFiles(newFiles, 'App.vue')
      return PreviewTips.READY_FOR_PREVIEW
    })

    return {
      store,
      editorComponent,
      debugSwitch
    }
  }
}
</script>

<style lang="less">
.vue-repl {
  height: 100%;

  .split-pane {
    .left {
      display: none;
    }

    .right {
      width: 100% !important;

      .output-container {
        height: 100%;

        .msg.warn {
          display: none;
        }
      }

      .tab-buttons {
        display: none;
      }
    }
  }
}
.vue-repl-container {
  height: calc(100vh - 48px);
  &.preview-debug-mode .vue-repl .split-pane {
    .left,
    .right .tab-buttons {
      display: block;
    }
    .right .output-container {
      height: calc(100% - 38px);
    }
  }
}
</style>
