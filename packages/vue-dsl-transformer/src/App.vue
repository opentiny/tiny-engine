<template>
  <div class="app">
    <header class="header">
      <h1>DSL-Vue 双向转换工具</h1>
      <div class="controls">
        <button class="convert-btn" @click="convertVueToDsl" :disabled="converting">
          Vue → DSL
        </button>
        <button class="convert-btn" @click="convertDslToVue" :disabled="converting">
          DSL → Vue
        </button>
        <button class="convert-btn" @click="clearAll">
          清空
        </button>
      </div>
    </header>

    <main class="main-content">
      <!-- 左侧编辑器 -->
      <div class="editor-panel">
        <div class="panel-header">
          <div class="panel-title">Vue 代码</div>
          <div class="panel-actions">
            <button class="action-btn" @click="copyVueCode">复制</button>
          </div>
        </div>
        <div class="editor-container">
          <MonacoEditor
            v-model="vueCode"
            language="html"
            theme="vs"
            :options="editorOptions"
          />
        </div>
      </div>

      <!-- 右侧编辑器 -->
      <div class="editor-panel">
        <div class="panel-header">
          <div class="panel-title">DSL Schema</div>
          <div class="panel-actions">
            <button class="action-btn" @click="formatDslCode">格式化</button>
            <button class="action-btn" @click="copyDslCode">复制</button>
          </div>
        </div>
        <div class="editor-container">
          <MonacoEditor
            v-model="dslCode"
            language="json"
            theme="vs"
            :options="editorOptions"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref } from 'vue'
import MonacoEditor from './components/MonacoEditor.vue'
import { genSFCWithDefaultPlugin } from '@opentiny/tiny-engine-dsl-vue'
import { VueToDslConverter } from '@opentiny/tiny-engine-vue-to-dsl'

export default {
  name: 'App',
  components: {
    MonacoEditor
  },
  setup() {
    const vueCode = ref(`<!-- 粘贴Vue代码到这里 -->
<template>
  <div class="container">
    <h1>{{ title }}</h1>
    <button @click="handleClick">点击我</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Hello World')

function handleClick() {
  console.log('按钮被点击了')
}
<\/script>

<style scoped>
.container {
  padding: 20px;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

button {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #40a9ff;
}
<\/style>`)

    const dslCode = ref(JSON.stringify({
      "state": {
        "title": "Hello World"
      },
      "methods": {
        "handleClick": "console.log('按钮被点击了')"
      },
      "componentName": "Page",
      "css": ".container { padding: 20px; text-align: center; } .h1 { color: #333; margin-bottom: 20px; } button { background: #1890ff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; } button:hover { background: #40a9ff; }",
      "props": {},
      "children": [
        {
          "componentName": "div",
          "props": {
            "class": "container"
          },
          "children": [
            {
              "componentName": "h1",
              "children": ["{{ title }}"]
            },
            {
              "componentName": "button",
              "props": {
                "@click": "handleClick"
              },
              "children": ["点击我"]
            }
          ]
        }
      ],
      "fileName": "Example",
      "id": "body"
    }, null, 2))

    const converting = ref(false)
    const editorOptions = {
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true
    }

    // DSL转Vue
    const convertDslToVue = async () => {
      if (!dslCode.value.trim()) {
        alert('请先输入DSL代码')
        return
      }

      converting.value = true

      try {
        const dslSchema = JSON.parse(dslCode.value)
        const componentsMap = []
        const result = genSFCWithDefaultPlugin(dslSchema, componentsMap, {
          blockRelativePath: './'
        })

        if (result) {
          vueCode.value = result
        } else {
          alert('DSL转换失败，请检查DSL格式是否正确')
        }
      } catch (error) {
        console.error('DSL转Vue失败:', error)
        alert(`DSL转换失败: ${error.message}`)
      } finally {
        converting.value = false
      }
    }

    // Vue转DSL
    const convertVueToDsl = async () => {
      if (!vueCode.value.trim()) {
        alert('请先输入Vue代码')
        return
      }

      converting.value = true

      try {
        const converter = new VueToDslConverter({ computed_flag: false })
        const result = await converter.convertFromString(vueCode.value)

        if (result && result.schema) {
          dslCode.value = JSON.stringify(result.schema, null, 2)
        } else {
          alert('Vue转换失败，请检查Vue代码格式是否正确')
        }
      } catch (error) {
        console.error('Vue转DSL失败:', error)
        alert(`Vue转换失败: ${error.message}`)
      } finally {
        converting.value = false
      }
    }

  
    // 格式化DSL代码
    const formatDslCode = () => {
      try {
        const parsed = JSON.parse(dslCode.value)
        dslCode.value = JSON.stringify(parsed, null, 2)
      } catch (error) {
        alert('DSL格式无效，无法格式化')
      }
    }

    // 复制Vue代码
    const copyVueCode = async () => {
      try {
        await navigator.clipboard.writeText(vueCode.value)
        alert('Vue代码已复制到剪贴板')
      } catch (error) {
        alert('复制失败')
      }
    }

    // 复制DSL代码
    const copyDslCode = async () => {
      try {
        await navigator.clipboard.writeText(dslCode.value)
        alert('DSL代码已复制到剪贴板')
      } catch (error) {
        alert('复制失败')
      }
    }

    // 清空所有代码
    const clearAll = () => {
      if (confirm('确定要清空所有代码吗？')) {
        vueCode.value = ''
        dslCode.value = ''
      }
    }

    return {
      vueCode,
      dslCode,
      converting,
      editorOptions,
      convertDslToVue,
      convertVueToDsl,
      formatDslCode,
      copyVueCode,
      copyDslCode,
      clearAll
    }
  }
}
</script>

<style>
/* 样式已经在 style.css 中定义 */
</style>