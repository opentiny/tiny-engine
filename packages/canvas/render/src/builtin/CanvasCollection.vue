<template>
  <component :is="tag" v-bind="$attrs" :key="updateKey">
    <slot>
      <canvas-placeholder></canvas-placeholder>
    </slot>
  </component>
</template>

<script>
import { ref, watch, computed } from 'vue'
import CanvasPlaceholder from './CanvasPlaceholder.vue'
import { getController } from '../render'
import { getHandler } from './CanvasCollection'

export const fetchDataSourceDetail = (dataSourceId) =>
  getController().request.get(`/app-center/api/sources/detail/${dataSourceId}`) // TODO: 强行耦合了

export default {
  components: {
    CanvasPlaceholder
  },
  props: {
    // TODO: 这里实际上没有提供配置的入口，可以考虑删除了(出码也没有定制)
    tag: {
      type: String,
      default: 'div'
    },
    schema: {
      type: Object,
      default: () => ({})
    },
    dataSource: [String, Array, Number]
  },
  setup(props) {
    const source = ref(null)
    // 这里 key 的作用是：触发组件更新，这样就能触发 tiny-grid 表格组件重新触发 fetchData 方法，进而刷新数据显示到画布
    const updateKey = ref(0)

    if (props.dataSource) {
      fetchDataSourceDetail(props.dataSource).then((res) => {
        source.value = res
      })
    }

    let handler
    watch(
      () => props.dataSource,
      async (value) => {
        if (value) {
          source.value = await fetchDataSourceDetail(value)
          const { getSchema, getNode } = window.host.schemaUtils
          const node = getNode(props.schema?.children?.[0]?.id)

          if (node) {
            handler = getHandler({
              sourceRef: source,
              node,
              schemaId: props.schema.id,
              pageSchema: getSchema(),
              updateKey
            })
          }
          handler?.updateNode()
          updateKey.value++
        }
      }
    )
    const isEmpty = computed(() => {
      const { children } = props.schema || {}
      return Array.isArray(children) ? !children.length : !children
    })

    watch(
      () => isEmpty.value,
      (value) => {
        const { getSchema, getNode } = window.host.schemaUtils
        const pageSchema = getSchema()

        if (value) {
          // 清除自动创建的state,method与setup逻辑
          if (handler) {
            handler.clearBindVar()
          } else {
            const schemaId = props.schema?.id
            // 当页面初始化时handler是不存在的，所以需要通过数据源的schemaId（唯一性），去删除对应的方法
            Object.keys(pageSchema.methods || {})?.some((item) => {
              if (item.includes(schemaId)) {
                delete pageSchema.methods[item]
                return true
              }
              return false
            })
          }
        } else {
          const node = getNode(props.schema?.children?.[0]?.id)
          if (node) {
            handler = getHandler({
              sourceRef: source,
              node,
              schemaId: props.schema.id,
              pageSchema,
              updateKey
            })
            handler.updateNode()
          }
        }

        const { publish } = getController().useMessage()

        publish({ topic: 'schemaChange', data: {} })
        updateKey.value++
      }
    )
    return { source, updateKey }
  }
}
</script>
