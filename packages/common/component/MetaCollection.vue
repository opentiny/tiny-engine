<template>
  <div class="meta-dataSource-wrap">
    <tiny-select v-model="selected" placeholder="请选择" @change="sourceChange">
      <tiny-option v-for="item in options" :key="item.id" :label="item.name" :value="item.id"> </tiny-option>
    </tiny-select>
    <tiny-tooltip class="item" effect="dark" content="刷新数据源" placement="top">
      <icon-conment-refresh @click="refreshData"></icon-conment-refresh>
    </tiny-tooltip>
  </div>
</template>

<script lang="jsx">
import { ref, nextTick } from 'vue'
import { useApp, useModal } from '@opentiny/tiny-engine-controller'
import { Select, Option, Tooltip } from '@opentiny/vue'
import { useHttp } from '@opentiny/tiny-engine-http'
import { IconConmentRefresh } from '@opentiny/vue-icon'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option,
    IconConmentRefresh: IconConmentRefresh(),
    TinyTooltip: Tooltip
  },
  props: {
    modelValue: [String, Number]
  },
  setup(props, { emit }) {
    const options = ref([])
    const selected = ref(Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue)
    const http = useHttp()

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

    const fetchDataSourceList = (appId) => http.get(`/app-center/api/sources/list/${appId}`)

    fetchDataSourceList(useApp().appInfoState.selectedId).then((data) => {
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
