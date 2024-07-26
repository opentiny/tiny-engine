<template>
  <array-item-configurator
    :meta="meta"
    :expand="expand"
    :disableDrag="disableDrag"
    @update:modelValue="saveValue"
  ></array-item-configurator>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { useMessage, useCanvas } from '@opentiny/tiny-engine-meta-register'
import ArrayItemConfigurator from '../array-item-configurator/ArrayItemConfigurator.vue'

export default {
  components: {
    ArrayItemConfigurator
  },
  props: {
    meta: {
      type: Object,
      default: () => ({})
    },
    expand: {
      type: Boolean,
      default: false
    },
    disableDrag: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const blockName = useCanvas().getCurrentSchema()?.componentName
    const topic = `lowcode.${blockName}.dataChange`

    const CONSTANTS = {
      FIELD: 'field',
      COMPONENT: 'SelectConfigurator'
    }

    const saveValue = (value) => emit('update:modelValue', value)

    const getSelectOptions = (value) => {
      const content = props.meta?.properties?.[0]?.content
      const property = content?.find(
        (item) => item.property === CONSTANTS.FIELD && item.widget?.component === CONSTANTS.COMPONENT
      )

      if (property) {
        if (value?.[0]) {
          property.widget.props.options = Object.keys(value[0])?.map((item) => ({
            label: item,
            value: item
          }))
        } else {
          property.widget.props.options = []
        }
      }
    }

    // 订阅数据改变，处理图表列
    onMounted(() => {
      const { subscribe } = useMessage()
      subscribe({ topic, callback: (value) => getSelectOptions(value) })
    })

    // 取消订阅
    onUnmounted(() => {
      const { unsubscribe } = useMessage()
      unsubscribe({ topic })
    })

    return {
      saveValue
    }
  }
}
</script>
