<template>
  <component :is="tag" v-bind="$attrs">
    <slot>
      <canvas-placeholder>{{ source?.name || '未选择数据源' }}</canvas-placeholder>
    </slot>
  </component>
</template>

<script>
import { ref, watch, computed, inject } from 'vue'
import { getController } from '../render/render'
import CanvasPlaceholder from './CanvasPlaceholder.vue'

import { getHandler } from './CanvasCollection.js'

export const fetchDataSourceDetail = (dataSourceId) =>
  getController().request.get(`/app-center/api/sources/detail/${dataSourceId}`)

export default {
  components: {
    CanvasPlaceholder
  },
  props: {
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
    const pageSchema = inject('rootSchema')

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
          if (props.schema?.children[0]) {
            handler = getHandler({
              sourceRef: source,
              node: props.schema?.children[0],
              schemaId: props.schema.id,
              pageSchema
            })
          }
          handler?.updateNode()
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
          if (props.schema?.children[0]) {
            handler = getHandler({
              sourceRef: source,
              node: props.schema?.children[0],
              schemaId: props.schema.id,
              pageSchema
            })
            handler.updateNode()
          }
        }
      }
    )

    return { source }
  }
}
</script>
