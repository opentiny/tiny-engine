<template>
  <div class="right-item">
    <span class="title">数据源模板</span>
    <div class="tips">
      <span class="blue">蓝色框代表对象数组</span>
      <span class="green">绿色框代表树形对象</span>
    </div>
    <ul class="templates">
      <li v-for="template in state.templates" :key="template.name">
        <tiny-button :type="templateType(template.type)" plain @click="selectTemplate(template.id)">{{
          template.name
        }}</tiny-button>
      </li>
    </ul>
  </div>
</template>

<script>
import { reactive, onMounted } from 'vue'
import { Button } from '@opentiny/vue'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { fetchTemplates } from './js/http'

export default {
  components: {
    TinyButton: Button
  },
  emits: ['select'],
  setup(props, { emit }) {
    const platformId = getMergeMeta('engine.config')?.platformId

    const state = reactive({
      templates: []
    })

    const templateType = (type) => (type === 'array' ? 'success' : 'primary')

    const selectTemplate = (templateId) => {
      emit('select', templateId)
    }

    onMounted(() => {
      fetchTemplates(platformId).then((data) => {
        state.templates = data
      })
    })

    return {
      state,
      templateType,
      selectTemplate
    }
  }
}
</script>

<style lang="less" scoped>
.right-item {
  padding: 16px 12px;
  color: var(--ti-lowcode-datasource-toolbar-icon-color);
  border-bottom: 1px solid var(--ti-lowcode-datasource-tabs-border-color);

  .tips {
    margin-bottom: 16px;
    font-size: 12px;
    color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
    span {
      &::before {
        content: '';
        display: inline-block;
        width: 24px;
        height: 14px;
        border-radius: 2px;
        margin-right: 6px;
        vertical-align: middle;
      }
      &:last-child {
        margin-left: 16px;
      }
    }
    .blue::before {
      border: 1px solid var(--ti-lowcode-datasource-json-border-color);
    }

    .green::before {
      border: 1px solid var(--ti-lowcode-datasource-tree-border-color);
    }
  }
  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    line-height: 22px;
    font-weight: 500;
    margin-bottom: 10px;
  }
  .templates {
    li {
      display: inline-block;
      margin-right: 10px;
      margin-bottom: 10px;
    }

    .tiny-button {
      color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
      &.tiny-button--primary {
        border-color: var(--ti-lowcode-datasource-common-border-primary-color);
      }

      &.tiny-button--success {
        border-color: var(--ti-lowcode-datasource-success-border-color);
      }
      &:hover {
        color: var(--ti-lowcode-datasource-toolbar-icon-color);
        background-color: transparent;
      }
    }
  }
}
</style>
