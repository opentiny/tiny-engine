<template>
  <div class="meta-related-components">
    <div v-if="isBindingState" class="meta-binding-state">
      {{ `已绑定：${modelValue?.value}` }}
    </div>
    <meta-code-editor
      v-else
      :modelValue="modelValue"
      :language="language"
      :buttonText="buttonText"
      :title="title"
      :dataType="dataType"
      :single="single"
      :showFormatBtn="showFormatBtn"
      :showErrorMsg="showErrorMsg"
      @update:modelValue="saveValue"
    ></meta-code-editor>
    <meta-bind-variable :modelValue="bindValue" :name="name" @update:modelValue="saveValue"></meta-bind-variable>
  </div>
</template>

<script>
import { onMounted, ref, watchEffect } from 'vue'
import { useMessage, useCanvas } from '@opentiny/tiny-engine-controller'
import MetaCodeEditor from './MetaCodeEditor.vue'
import MetaBindVariable from './MetaBindVariable.vue'

export default {
  components: {
    MetaCodeEditor,
    MetaBindVariable
  },
  props: {
    buttonText: {
      type: String,
      default: '编辑代码'
    },
    modelValue: {
      type: [String, Object, Array],
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: 'json'
    },
    dataType: {
      type: String,
      default: ''
    },
    single: {
      type: Boolean,
      default: false
    },
    showFormatBtn: {
      type: Boolean,
      default: true
    },
    showErrorMsg: {
      type: Boolean,
      default: true
    },
    name: {
      type: String,
      default: ''
    },
    bindValue: {
      type: [String, Number, Boolean, Array, Object, Date],
      default: ''
    }
  },
  setup(props, { emit }) {
    const CONSTANT = {
      STATE: 'this.state.',
      JSEXPRESSION: 'JSExpression'
    }
    const isBindingState = ref(false)
    const componentName = useCanvas().getCurrentSchema()?.componentName
    const topic = `lowcode.${componentName}.dataChange`

    const publishMessage = (value) => {
      const { publish } = useMessage()
      publish({ topic, data: value })
    }

    const getStateValue = (value) => {
      let newValue = value

      if (value?.type === CONSTANT.JSEXPRESSION) {
        const pageSchema = useCanvas().canvasApi.value.getSchema()
        const stateName = value?.value?.replace(CONSTANT.STATE, '')
        newValue = pageSchema?.state?.[stateName]
      }

      return newValue
    }

    // 数据改变发布消息通知关联组件
    const saveValue = (value) => {
      const newValue = getStateValue(value)
      publishMessage(newValue)
      emit('update:modelValue', value)
    }

    // 初始化时发布消息通知关联组件
    onMounted(() => {
      if (props.modelValue) {
        const newValue = getStateValue(props.modelValue)
        publishMessage(newValue)
      }
    })

    watchEffect(() => {
      isBindingState.value = props.modelValue?.type === CONSTANT.JSEXPRESSION
    })

    return {
      isBindingState,
      saveValue
    }
  }
}
</script>
<style lang="less" scoped>
.meta-related-components {
  display: flex;
  justify-content: space-between;
}
.meta-binding-state {
  background: var(--ti-lowcode-icon-bind-color);
  padding: 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
