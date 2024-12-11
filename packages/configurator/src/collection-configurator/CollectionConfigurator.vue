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
import { nextTick, ref } from 'vue'
import { Option, Select, Tooltip } from '@opentiny/vue'
import { iconConmentRefresh as iconCommonRefresh } from '@opentiny/vue-icon'
import { useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

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

    const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

    // 获取数据源列表
    fetchDataSourceList(appId).then((data) => {
      options.value = data
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
