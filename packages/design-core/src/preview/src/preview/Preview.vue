<template>
  <div :class="['vue-repl-container', debugSwitch ? 'preview-debug-mode' : '']">
    <Repl
      :editor="editorComponent"
      :store="store"
      :sfcOptions="sfcOptions"
      :showCompileOutput="false"
      :showTsConfig="false"
      :showImportMap="true"
      :clearConsole="false"
      :autoResize="false"
    />
  </div>
</template>

<script>
import { defineComponent, computed, defineAsyncComponent } from 'vue'
import { Repl, ReplStore } from '@vue/repl'
import vueJsx from '@vue/babel-plugin-jsx'
import { transformSync } from '@babel/core'
import { genSFCWithDefaultPlugin, parseRequiredBlocks } from '@opentiny/tiny-engine-dsl-vue'
import importMap from './importMap'
import srcFiles from './srcFiles'
import generateMetaFiles, { processAppJsCode } from './generate'
import { getSearchParams, fetchMetaData, fetchImportMap, fetchAppSchema, fetchBlockSchema } from './http'
import { PanelType, PreviewTips } from '../constant'
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
    const store = new ReplStore()

    const sfcOptions = {
      script: {
        // scirpt setup 编译后注入 import { * } from "vue"
        inlineTemplate: false
      }
    }

    // 相比store.setFiles，只要少了state.activeFile = state.files[filename]，因为改变activeFile会触发多余的文件解析
    const setFiles = async (newFiles, mainFileName) => {
      await store.setFiles(newFiles, mainFileName)
      // 强制更新 codeSandbox
      store.state.resetFlip = !store.state.resetFlip
      store['initTsConfig']() // 触发获取组件d.ts方便调试
    }

    const addUtilsImportMap = (importMap, utils = []) => {
      const utilsImportMaps = {}
      utils.forEach(({ type, content: { package: packageName, cdnLink } }) => {
        if (type === 'npm' && cdnLink) {
          utilsImportMaps[packageName] = cdnLink
        }
      })
      const newImportMap = { imports: { ...importMap.imports, ...utilsImportMaps } }
      store.setImportMap(newImportMap)
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

      schemaList.forEach((item) => {
        if (item.status === 'fulfilled' && item.value?.[0]?.content) {
          res.push(item.value[0].content)
          res.push(...getBlocksSchema(item.value[0].content, blockSet))
        }
      })

      return res
    }

    const queryParams = getSearchParams()
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
      return importMap
    }

    const promiseList = [
      fetchAppSchema(queryParams?.app),
      fetchMetaData(queryParams),
      setFiles(srcFiles, 'src/Main.vue'),
      getImportMap()
    ]
    Promise.all(promiseList).then(async ([appData, metaData, _void, importMapData]) => {
      addUtilsImportMap(importMapData, metaData.utils || [])

      const blocks = await getBlocksSchema(queryParams.pageInfo?.schema)

      // TODO: 需要验证级联生成 block schema
      // TODO: 物料内置 block 需要如何处理？
      const pageCode = [
        {
          panelName: 'Main.vue',
          panelValue:
            genSFCWithDefaultPlugin(queryParams.pageInfo?.schema, appData?.componentsMap || [], {
              blockRelativePath: './'
            }) || '',
          panelType: 'vue',
          index: true
        },
        ...(blocks || []).map((blockSchema) => {
          return {
            panelName: blockSchema.fileName,
            panelValue:
              genSFCWithDefaultPlugin(blockSchema, appData?.componentsMap || [], { blockRelativePath: './' }) || '',
            panelType: 'vue',
            index: true
          }
        })
      ]

      // [@vue/repl] `Only lang="ts" is supported for <script> blocks.`
      const langReg = /lang="jsx"/
      const fixScriptLang = (generatedCode) => {
        const fixedCode = { ...generatedCode }

        if (generatedCode.panelType === PanelType.VUE) {
          fixedCode.panelValue = generatedCode.panelValue.replace(langReg, '')
        }

        return fixedCode
      }

      const newFiles = store.getFiles()

      const assignFiles = ({ panelName, panelValue, index }) => {
        if (index) {
          panelName = 'Main.vue'
        }

        const newPanelValue = panelValue.replace(/<script\s*setup\s*>([\s\S]*)<\/script>/, (match, p1) => {
          if (!p1) {
            // eslint-disable-next-line no-useless-escape
            return '<script setup><\/script>'
          }

          const transformedScript = transformSync(p1, {
            babelrc: false,
            plugins: [[vueJsx, { pragma: 'h' }]],
            sourceMaps: false,
            configFile: false
          })

          const res = `<script setup>${transformedScript.code}`
          // eslint-disable-next-line no-useless-escape
          const endTag = '<\/script>'

          return `${res}${endTag}`
        })

        newFiles[panelName] = newPanelValue
      }

      const appJsCode = processAppJsCode(newFiles['app.js'], queryParams.styles)

      newFiles['app.js'] = appJsCode

      pageCode.map(fixScriptLang).forEach(assignFiles)

      const metaFiles = generateMetaFiles(metaData)
      Object.assign(newFiles, metaFiles)

      setFiles(newFiles)

      return PreviewTips.READY_FOR_PREVIEW
    })

    return {
      store,
      sfcOptions,
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
