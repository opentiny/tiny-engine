<template>
  <div :class="['vue-repl-container', debugSwitch ? 'preview-debug-mode' : '']">
    <IframeVue :src="iframeSrc" :show="showIframe" :initialMessage="newFiles" :isDebug="debugSwitch" />
  </div>
</template>

<script>
import Config from '../../../../config/lowcode.config.js'
import { parseRequiredBlocks } from '@opentiny/tiny-engine-dsl-vue'
import { generateCode } from '../../../../../react-generator/src/index.js'
import importMap from '../preview/importMap'
import { ref } from 'vue'
import generateMetaFiles from './generate'
import { getSearchParams, fetchMetaData, fetchImportMap, fetchAppSchema, fetchBlockSchema } from '../preview/http'
import { PreviewTips } from '../constant'
import { injectDebugSwitch } from '../preview/debugSwitch'
import IframeVue from '../iframe/index.vue'

export default {
  components: {
    IframeVue
  },
  setup() {
    const debugSwitch = ref(injectDebugSwitch())

    const showIframe = ref(Config.dslMode === 'React');
    const newFiles = {}
    const iframeSrc = 'http://127.0.0.1:5173/'; // 你想要嵌入的 URL

    const addUtilsImportMap = (importMap, utils = []) => {
      const utilsImportMaps = {}
      utils.forEach(({ type, content: { package: packageName, cdnLink } }) => {
        if (type === 'npm' && cdnLink) {
          utilsImportMaps[packageName] = cdnLink
        }
      })
      // const newImportMap = { imports: { ...importMap.imports, ...utilsImportMaps } }
      // store.setImportMap(newImportMap)
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
      getImportMap()
    ]
    Promise.all(promiseList).then(async ([appData, metaData, importMapData]) => {
      addUtilsImportMap(importMapData, metaData.utils || [])

      const blocks = await getBlocksSchema(queryParams.pageInfo?.schema)

      // TODO: 需要验证级联生成 block schema
      // TODO: 物料内置 block 需要如何处理？
      const pageInfo = queryParams.pageInfo
      const componentMap = appData?.componentMap || []
      newFiles['pageInfo'] = pageInfo
      newFiles['componentMap'] = componentMap
      const pageCode = [
        {
          panelName: 'Main.jsx',
          panelValue:
            generateCode({ pageInfo, componentMap }
            ) || '',
          panelType: 'jsx',
          index: true
        },
        ...(blocks || []).map((blockSchema) => {
          return {
            panelName: blockSchema.fileName,
            panelValue:
              generateCode(blockSchema, appData?.componentsMap || [], { blockRelativePath: './' }) || '',
            panelType: 'jsx',
            index: true
          }
        })
      ]

      const assignFiles = ({ panelName, panelValue, index }) => {
        if (index) {
          panelName = 'Main.jsx'
        }

        // 将css代码嵌入到jsx代码之中
        const cssValue = panelValue[1]?.panelValue || ''
        const jsxValue = panelValue[0]?.panelValue || ''

        const newPanelValue = jsxValue.replace(/(<>)\s*/g, `$1<style>${cssValue}</style>`);

        newFiles[panelName] = newPanelValue
      }

      // const appJsCode = processAppJsCode(newFiles['app.js'], queryParams.styles)

      // newFiles['app.js'] = appJsCode

      pageCode.forEach(assignFiles)

      const metaFiles = generateMetaFiles(metaData) // 有报错，需要处理一下
      Object.assign(newFiles, metaFiles)

      return PreviewTips.READY_FOR_PREVIEW
    })

    return {
      debugSwitch,
      showIframe,
      iframeSrc,
      newFiles,
    }
  }
}
</script>

<style lang="less">
.iframe {
  width: 100%;
  height: 100vh
}

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
