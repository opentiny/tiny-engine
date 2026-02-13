<template>
  <div class="model-select-wrap">
    <tiny-search
      class="search"
      v-model="searchWords"
      placeholder="按模型名称搜索"
      clearable
      @search="search"
      @clear="search"
    >
      <template #prefix>
        <tiny-icon-search />
      </template>
    </tiny-search>
  </div>
  <div class="model-table-wrap">
    <tiny-grid ref="modelListRef" :data="modelList" :loading="gridLoading" row-id="nameCn" @radio-change="selectModel">
      <tiny-grid-column type="radio" width="30"></tiny-grid-column>
      <tiny-grid-column field="nameCn" title="模型名称" show-overflow></tiny-grid-column>
      <tiny-grid-column field="description" title="模型描述" show-overflow></tiny-grid-column>
    </tiny-grid>
    <tiny-pager
      :current-page="pagerState.currentPage"
      :page-size="modelPageSize"
      pager-count="3"
      :total="pagerState.total"
      hide-on-single-page
      layout="total, prev, pager, next"
      @current-change="pageChange"
    ></tiny-pager>
  </div>
</template>
<script>
import { ref, reactive, watch } from 'vue'
import { Search, Grid, GridColumn, Pager } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { getModelList } from '../model-common/http'
import { handleSelectedModelParameters } from './utils'

export default {
  components: {
    TinySearch: Search,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    TinyPager: Pager,
    TinyIconSearch: iconSearch()
  },
  props: {
    modelPageSize: {
      type: Number,
      default: 10
    },
    isShow: {
      type: Boolean,
      default: false
    }
  },
  emits: ['modelSelect'],
  setup(props, { emit }) {
    const gridLoading = ref(false)
    const modelListRef = ref(null)
    // 模型列表
    const modelList = ref([])
    // 分页配置
    const pagerState = reactive({
      currentPage: 1,
      total: 0
    })
    // 已选中的模型
    const currentSelectedModel = ref()
    // 搜索
    const searchWords = ref('')

    const selectModel = async (data) => {
      currentSelectedModel.value = await handleSelectedModelParameters(data.row)
      emit('modelSelect', currentSelectedModel.value)
    }

    const getModels = () => {
      getModelList(pagerState.currentPage, { nameCn: searchWords.value }).then(async (res) => {
        modelList.value = res.records
        pagerState.total = res.total
      })
    }

    const search = () => {
      getModels()
    }

    const pageChange = (curPage) => {
      pagerState.currentPage = curPage
      getModels()
    }

    watch(
      () => props.isShow,
      (value) => {
        if (value) {
          getModels()
        }
      }
    )

    return {
      gridLoading,
      modelListRef,
      modelList,
      pagerState,
      searchWords,
      search,
      pageChange,
      selectModel
    }
  }
}
</script>

<style lang="less" scoped>
.model-table-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;

  .tiny-pager {
    padding-top: 0;
  }
}
</style>
