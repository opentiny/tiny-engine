<template>
  <Repl
    :editor="Monaco"
    :store="store"
    :sfcOptions="sfcOptions"
    :showCompileOutput="false"
    :showImportMap="false"
    :clearConsole="false"
    :autoResize="false"
  />
</template>

<script>
import { Repl, ReplStore } from '@vue/repl'
import Monaco from '@vue/repl/monaco-editor'
import vueJsx from '@vue/babel-plugin-jsx'
import { transformSync } from '@babel/core'
import { Notify } from '@opentiny/vue'
import importMap from './importMap'
import srcFiles from './srcFiles'
import generateMetaFiles, { processAppJsCode } from './generate'
import { getSearchParams, fetchCode, fetchMetaData } from './http'
import { PanelType, PreviewTips } from '../constant'
import '@vue/repl/style.css'

const importNames = [
  'createVNode',
  'Fragment',
  'resolveComponent',
  'withDirectives',
  'vShow',
  'vModelSelect',
  'vModelText',
  'vModelCheckbox',
  'vModelRadio',
  'vModelText',
  'vModelDynamic',
  'resolveDirective',
  'mergeProps',
  'createTextVNode',
  'isVNode'
]

const importRegexps = importNames.map((name) => ({
  regexp: new RegExp(`_${name}`, 'g'),
  replace: `vue.${name}`
}))

export default {
  components: {
    Repl
  },
  setup() {
    const store = new ReplStore()

    const compiler = store.compiler
    const compileScript = compiler.compileScript
    // repl 编译 script 之后加入 vue jsx 编译
    store.compiler = {
      ...compiler,
      compileScript(...args) {
        // repl 内置 script 编译
        const compiledScript = compileScript(...args)
        // vue jsx 编译
        const script = transformSync(compiledScript.content, {
          babelrc: false,
          plugins: [vueJsx],
          sourceMaps: false,
          configFile: false
        })

        // 清除 vue jsx 编译后注入的 import
        let code = script.code.replace(/import \{.+\} from "vue";/, '')
        // 使用 vue 函数时，从 vue 对象中获取 vue 函数
        importRegexps.forEach((regexp) => {
          code = code.replace(regexp.regexp, regexp.replace)
        })

        compiledScript.content = code

        return compiledScript
      }
    }

    const sfcOptions = {
      script: {
        // scirpt setup 编译后注入 import { * } from "vue"
        inlineTemplate: false
      }
    }

    store.setImportMap(importMap)

    // 相比store.setFiles，只要少了state.activeFile = state.files[filename]，因为改变activeFile会触发多余的文件解析
    const setFiles = async (newFiles, mainFileName) => {
      await store.setFiles(newFiles, mainFileName)
      // 强制更新 codeSandbox
      store.state.resetFlip = !store.state.resetFlip
    }

    const addUtilsImportMap = (utils = []) => {
      const utilsImportMaps = {}
      utils.forEach(({ type, content: { package: packageName, cdnLink } }) => {
        if (type === 'npm' && cdnLink) {
          utilsImportMaps[packageName] = cdnLink
        }
      })
      const newImportMap = { imports: { ...importMap.imports, ...utilsImportMaps } }
      store.setImportMap(newImportMap)
    }

    const queryParams = getSearchParams()

    const promiseList = [fetchCode(queryParams), fetchMetaData(queryParams), setFiles(srcFiles, 'src/Main.vue')]
    Promise.all(promiseList).then(([codeList, metaData]) => {
      addUtilsImportMap(metaData.utils || [])
      const codeErrorMsgs = codeList
        .filter(({ errors }) => errors?.length)
        .map(({ errors }) => errors)
        .flat()
        .map(({ message }) => message)

      if (codeErrorMsgs.length) {
        const title = PreviewTips.ERROR_WHEN_COMPILE
        Notify({
          type: 'error',
          title,
          message: codeErrorMsgs.join('\n'),
          // 不自动关闭
          duration: 0,
          position: 'top-right'
        })

        return title
      }

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

        newFiles[panelName] = panelValue
      }

      const appJsCode = processAppJsCode(newFiles['app.js'], queryParams.styles)

      newFiles['app.js'] = appJsCode

      codeList.map(fixScriptLang).forEach(assignFiles)

      const metaFiles = generateMetaFiles(metaData)
      Object.assign(newFiles, metaFiles)

      setFiles(newFiles)

      return PreviewTips.READY_FOR_PREVIEW
    })

    return {
      store,
      sfcOptions,
      Monaco
    }
  }
}
</script>

<style lang="less">
.vue-repl {
  width: 100vw;
  height: 100vh;

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
</style>
