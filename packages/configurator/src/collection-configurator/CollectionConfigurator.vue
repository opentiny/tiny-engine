<template>
  <div class="meta-dataSource-wrap">
    <tiny-select v-model="selected" placeholder="请选择" @change="sourceChange">
      <tiny-option v-for="item in options" :key="item.id" :label="item.name" :value="item.id"> </tiny-option>
    </tiny-select>
    <tiny-tooltip class="item" effect="dark" content="刷新数据源" placement="top">
      <icon-common-refresh @click="refreshData"></icon-common-refresh>
    </tiny-tooltip>
  </div>
</template>

<script lang="jsx">
import { nextTick, ref, onMounted, watch, computed } from 'vue'
import { Option, Select, Tooltip } from '@opentiny/vue'
import { iconConmentRefresh as iconCommonRefresh } from '@opentiny/vue-icon'
import {
  useModal,
  getMetaApi,
  META_SERVICE,
  useCanvas,
  useProperties,
  useMessage
} from '@opentiny/tiny-engine-meta-register'
import { getHandler } from './collection'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option,
    IconCommonRefresh: iconCommonRefresh(),
    TinyTooltip: Tooltip
  },
  props: {
    modelValue: [String, Number]
  },
  setup(props, { emit }) {
    const options = ref([])
    const selected = ref(Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue)
    const { publish } = useMessage()

    const sourceChange = (value) => {
      if (props.modelValue) {
        useModal().confirm({
          message: '修改数据源将导致当前自定义配置失效，是否继续？',
          exec() {
            emit('update:modelValue', value)
          },
          cancel() {
            selected.value = Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue
          }
        })
      } else {
        emit('update:modelValue', value)
      }
    }

    const fetchDataSourceList = (appId) => getMetaApi(META_SERVICE.Http).get(`/app-center/api/sources/list/${appId}`)

    onMounted(() => {
      const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

      // 获取数据源列表
      fetchDataSourceList(appId).then((data) => {
        options.value = data
      })
    })

    const refreshData = () => {
      useModal().confirm({
        message: () => [
          <div class="update-type">
            <div style="margin-bottom:10px">确定更新数据源吗？</div>
          </div>
        ],
        exec() {
          // 这里先置为空，再赋值是为了触发画布中数据源组件进行强制刷新
          emit('update:modelValue', '')

          nextTick(() => {
            emit('update:modelValue', selected.value)
          })
        }
      })
    }

    const source = ref(null)

    const fetchDataSourceDetail = (dataSourceId) =>
      getMetaApi(META_SERVICE.Http).get(`/app-center/api/sources/detail/${dataSourceId}`)

    let handler = null

    watch(
      () => props.modelValue,
      async (value) => {
        if (value) {
          source.value = await fetchDataSourceDetail(value)

          const pageSchema = useCanvas().getPageSchema()
          const currentSchema = useProperties().getSchema()

          if (currentSchema?.children[0]) {
            handler = getHandler({
              sourceRef: source,
              node: currentSchema?.children[0],
              schemaId: currentSchema.id,
              pageSchema
            })
          }

          handler?.updateNode()

          publish({ topic: 'schemaChange', data: {} })
        }
      },
      {
        deep: true
      }
    )

    const isEmpty = computed(() => {
      const { children } = useProperties().getSchema() || {}

      return Array.isArray(children) ? !children.length : !children
    })

    watch(
      () => isEmpty.value,
      (value) => {
        const pageSchema = useCanvas().getPageSchema()
        const currentSchema = useProperties().getSchema()

        if (value) {
          // 清除自动创建的state,method与setup逻辑
          if (handler) {
            handler.clearBindVar()
          } else {
            const schemaId = currentSchema?.id

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
          if (currentSchema?.children[0]) {
            handler = getHandler({
              sourceRef: source,
              node: currentSchema?.children[0],
              schemaId: currentSchema.id,
              pageSchema
            })
            handler.updateNode()
          }
        }

        publish({ topic: 'schemaChange', data: {} })
      }
    )

    return {
      options,
      selected,
      sourceChange,
      refreshData
    }
  }
}
</script>
<style scoped lang="less">
.meta-dataSource-wrap {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  grid-gap: 10px;

  svg {
    cursor: pointer;
  }
}
</style>
