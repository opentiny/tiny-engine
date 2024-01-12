<template>
  <div class="setting-container">
    <div class="flex">
      <ComponentList v-if="components.length" class="list" :data="componentList" @change="change"></ComponentList>
      <div class="attrs-panel">
        <PropertyList class="list" :data="propertyNames"></PropertyList>
        <PropertyCanvas class="canvas" design :schema="componentSchema"></PropertyCanvas>
        <SettingPanel class="setting"></SettingPanel>
      </div>
      <SourceEditor v-if="showCode" class="editor" :content="schemaCode"></SourceEditor>
    </div>
    <div class="confirm-box">
      <tiny-button type="primary" @click="confirmSelect">保存</tiny-button>
    </div>
  </div>
</template>

<script>
import { computed, watchEffect } from 'vue'
import { Button } from '@opentiny/vue'
import ComponentList from './components/ComponentList.vue'
import PropertyList from './components/PropertyList.vue'
import PropertyCanvas from './components/PropertyCanvas.vue'
import SettingPanel from './components/SettingPanel.vue'
import SourceEditor from './components/SourceEditor.vue'
import store, { getSchemaByComponetName } from './store'

export default {
  components: {
    TinyButton: Button,
    ComponentList,
    PropertyList,
    PropertyCanvas,
    SettingPanel,
    SourceEditor
  },
  props: {
    components: {
      type: Array,
      default: () => [
        {
          label: '',
          key: '',
          properties: {}
        }
      ]
    },
    properties: Object,
    modelValue: [],
    showCode: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const componentList = computed(() => store.componentList || [])
    const propertyNames = computed(() => Object.keys(store.currentProperties || {}))
    const componentSchema = computed(() => store.currentSchema || [])
    const schemaCode = computed(() => JSON.stringify(store.currentSchema || [], null, 2))

    watchEffect(() => {
      store.currentProperties = props.properties
      store.currentSchema = props.modelValue || []
    })

    const change = ({ key, properties }) => {
      if (key) {
        const keys = key.split('.')
        store.currentKeys = keys
        store.currentComponent = keys[0]
        store.currentProperties = properties
        store.currentSchema = getSchemaByComponetName(store.currentComponent)
      }
    }

    const confirmSelect = () => {
      emit('update:modelValue', store.currentSchema)
      emit('close')
    }

    const cancel = () => {
      window.close()
    }

    return {
      componentList,
      propertyNames,
      componentSchema,
      schemaCode,
      confirmSelect,
      change,
      cancel
    }
  }
}
</script>

<style lang="less">
:root {
  --ti-lowcode-common-primary-color: #5e7ce0;
  --ti-lowcode-common-text-title-color: #252b3a;
  --ti-lowcode-common-secondary-text-color: #adb0b8;
  --ti-lowcode-common-text-main-color: #575d6c;
  --ti-lowcode-design-plugin-color: #8a8e99;
  --ti-lowcode-common-border-color: #dfe1e6;
  --ti-lowcode-common-hover-bg-color: #f2f5fc;
  --ti-lowcode-title-color: #333;
  --ti-lowcode-mask-bg: #fafafa;
  --max-height: calc(65vh - 70px);
}
html {
  font-size: 14px;
}

body {
  padding: 0;
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, -apple-system, Arial, 'Lucida Grande', system-ui, BlinkMacSystemFont,
    'Segoe UI', Roboto, sans-serif;
}

body::-webkit-scrollbar {
  width: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

body::-webkit-scrollbar-track {
  box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.05);
}

body::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  outline: 1px solid slategrey;
}

body {
  --base-left-panel-width: 280px;
  --base-right-panel-width: 280px;
  --base-top-panel-height: 35px;
  --base-bottom-panel-height: 30px;
  --base-nav-panel-width: 40px;
  scrollbar-color: rgba(0, 0, 0, 0.1) #fff;
  scrollbar-width: thin;
  -webkit-font-smoothing: subpixel-antialiased;
  background: #f9f9f9;
}

ol,
ul {
  list-style: none;
}

a {
  cursor: pointer;
  background-image: none;
  text-decoration: none;
  outline: none;

  &:focus,
  &:active,
  &:hover {
    outline: none;
    text-decoration: none;
  }
}

dl,
dt,
dd,
ul,
ol,
li,
th,
td {
  margin: 0;
  padding: 0;
}

.sortable-chosen {
  background: #c5d4f6;
}
.mask {
  .source-code {
    --ti-lowcode-toolbar-bg: var(--ti-lowcode-mask-bg);
    .tiny-button {
      --ti-button-info-normal-bg-color: var(--ti-lowcode-common-primary-color);
    }
  }
}
</style>

<style lang="less" scoped>
.setting-container {
  display: flex;
  flex-direction: column;
  max-height: var(--max-height);
  overflow: auto;
  background-color: #fff;
}
.flex {
  display: flex;
  width: 100%;
  overflow-y: auto;
  .attrs-panel {
    display: grid;
    grid-template-columns: 150px 2fr 2fr;
    width: 100%;
  }

  .list {
    padding: 10px;
  }

  .canvas {
    background: var(--ti-lowcode-common-hover-bg-color);
    padding: 20px;
    margin: 0 20px;
  }

  .setting {
    margin-left: 20px;
  }

  .editor {
    width: 500px;
    height: 100%;
    border: 1px #ddd solid;
  }
}
.confirm-box {
  text-align: center;
  padding: 20px 0;
}
</style>
