<template>
  <div class="toolbar-save">
    <toolbar-base
      content="CodeSandbox"
      :icon="options.icon.default || options.icon"
      :options="options"
      @click-api="preview"
    >
    </toolbar-base>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { useLayout, useNotify, useSaveLocal } from '@opentiny/tiny-engine-meta-register'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { getParameters } from 'codesandbox/lib/api/define'
import { codesandboxFiles } from './codesandboxFiles'

export default {
  components: {
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const state = reactive({
      generating: false
    })

    const preview = async () => {
      if (useLayout().isEmptyPage()) {
        useNotify({
          type: 'warning',
          message: '请先创建页面'
        })

        return
      }

      try {
        const [_, fileRes] = await useSaveLocal().getPreGenerateInfo()

        const files = {}
        fileRes.forEach((file) => {
          // 使用 pnpm 包管理
          if (file.filePath === 'README.md') {
            files[file.filePath] = { content: file.fileContent.replace(/npm /g, 'pnpm ') }
          } else {
            files[file.filePath] = { content: file.fileContent }
          }
        })
        Object.assign(files, codesandboxFiles)

        const parameters = getParameters({ files, template: 'vue-cli' })
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = 'https://codesandbox.io/api/v1/sandboxes/define'
        form.target = '_blank'
        const parametersInput = document.createElement('input')
        parametersInput.name = 'parameters'
        parametersInput.value = parameters
        const queryInput = document.createElement('input')
        queryInput.name = 'query'
        queryInput.value = 'module=/src/App.vue'
        const environmentInput = document.createElement('input')
        environmentInput.name = 'environment'
        environmentInput.value = 'server'
        form.appendChild(parametersInput)
        form.appendChild(queryInput)
        form.appendChild(environmentInput)
        document.body.append(form)
        form.submit()
        document.body.removeChild(form)
        state.generating = false
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        useNotify({ type: 'error', title: '代码生成失败', message: error?.message || error })
        state.generating = false
      }
    }

    return {
      preview
    }
  }
}
</script>
