<template>
  <div class="model-select-wrap">
    <tiny-select
      v-model="appId"
      :options="applicationsList"
      placeholder="选择应用"
      filterable
      clearable
      value-key="value"
      value-field="id"
      @change="applicationChange"
    ></tiny-select>
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
    <tiny-grid
      ref="modelListRef"
      :data="modelList"
      :loading="gridLoading"
      @radio-change="selectModel"
    >
      <tiny-grid-column type="radio" width="30"></tiny-grid-column>
      <tiny-grid-column
        field="name"
        title="模型名称"
        width="170"
        show-overflow
      ></tiny-grid-column>
      <tiny-grid-column
        field="description"
        title="模型描述"
        show-overflow
      ></tiny-grid-column>
      <tiny-grid-column
        field="modelVersion"
        title="版本"
        width="90"
        show-overflow
      >
        <template #default="data">
          <tiny-dropdown
            :title="data.row.modelVersion"
            trigger="click"
            @visible-change="showVersions($event, data.row)"
            @item-click="changeVersion($event, data)"
          >
            <template #dropdown>
              <tiny-dropdown-menu popper-class="dropdown-menu-list">
                <tiny-dropdown-item
                  v-for="item in data.row?.versions || []"
                  :key="data.row.id + '-' + item.modelVersion"
                  :itemData="item.modelVersion"
                >
                  {{ item.modelVersion }}
                </tiny-dropdown-item>
              </tiny-dropdown-menu>
            </template>
          </tiny-dropdown>
        </template>
      </tiny-grid-column>
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
<script setup>
import {
  ref,
  reactive,
  watch,
  defineProps,
  defineEmits,
  computed,
} from "vue";
import {
  Search as TinySearch,
  Select as TinySelect,
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
  Pager as TinyPager,
  Dropdown as TinyDropdown,
  DropdownMenu as TinyDropdownMenu,
  DropdownItem as TinyDropdownItem,
} from "@opentiny/vue";
import { iconSearch } from "@opentiny/vue-icon";
import { HttpService } from "../../composable";

const props = defineProps({
  meta: {
    type: Object,
    default: () => ({}),
  },
  modelPageSize: {
    type: Number,
    default: 10,
  },
  isShow: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["modelSelect"]);
const TinyIconSearch = iconSearch();
const gridLoading = ref(false);
// 应用列表
const appId = ref("");
const applicationsList = ref([]);
const modelListRef = ref(null);
// 已选中的模型
const modelContent = computed(() => {
  return props.meta.widget.props.modelValue;
});
// 模型列表
const modelList = ref([]);
// 分页配置
const pagerState = reactive({
  currentPage: 1,
  total: 0,
});
// 已选中的模型
const currentSelectedModel = ref();
// 搜索
const searchWords = ref("");

const getApplications = () => {
  HttpService.apis
    .get(
      "http://10.159.227.31:9091/baseUiEngine/basic/xdm/module/getApplications"
    )
    .then((res) => {
      applicationsList.value = res || [];
      if (modelContent.value) {
        appId.value = modelContent.value.config?.modelApplicationId;
        searchWords.value = modelContent.value.name;
        getModelsByGroup();
      }
    });
};

const getModelsByGroup = () => {
  if (!appId.value) {
    return;
  }
  gridLoading.value = true;
  HttpService.apis
    .get(
      `http://10.159.227.31:9091/baseUiEngine/basic/xdm/module/getModules/${appId.value}/${props.modelPageSize}/${pagerState.currentPage}?name=${searchWords.value}`
    )
    .then((res) => {
      if (res.code === 200) {
        modelList.value = res.data || [];
        pagerState.total = res.pageVo?.totalRows || 0;
        modelList.value.forEach((item) => {
          if (modelContent.value && modelContent.value.id === item.id) {
            item.modelVersion = modelContent.value.config.modelVersion;
            modelListRef.value.setRadioRow(item);
            selectModel({ row: item });
          }
        });
      }
      gridLoading.value = false;
    })
    .catch(() => (gridLoading.value = false));
};

const search = () => {
  getModelsByGroup();
};

const getModelVersionsByName = async (modelName) => {
  if (!appId.value) {
    return null;
  }
  return await HttpService.apis.get(
    `http://10.159.227.31:9091/baseUiEngine/basic/xdm/module/getModuleVersion/${appId.value}?name=${modelName}`
  );
};

const applicationChange = () => {
  pagerState.currentPage = 1;
  getModelsByGroup();
};

const pageChange = (curPage) => {
  pagerState.currentPage = curPage;
  getModelsByGroup();
};

const showVersions = async (openStatus, row) => {
  if (!openStatus) {
    return;
  }
  const versions = await getModelVersionsByName(row.nameEn);
  if (versions) {
    row.versions = versions.map((item) => ({
      name: item.name,
      nameEn: item.nameEn,
      modelVersion: item.modelVersion,
    }));
  }
};

const selectModel = (data) => {
  currentSelectedModel.value = data.row;
  const emitData = {
    appId: appId.value,
    modelData: data.row,
  };
  emit("modelSelect", emitData);
};

const changeVersion = ({ itemData }, data) => {
  // 如果当前切换的版本为变化，则不做处理
  if (data.row.modelVersion === itemData) {
    return;
  }
  data.row.modelVersion = itemData;
  // 如果当前选中的模型是正在切换版本的模型，则调用接口查询字段详情
  if (
    currentSelectedModel.value &&
    currentSelectedModel.value?.id === data.row.id
  ) {
    selectModel(data);
  }
};

watch(
  () => props.isShow,
  (value) => {
    if (value) {
      getApplications();
    }
  }
);
</script>

<style lang="less" scoped>
.model-select-wrap {
  display: flex;
  :deep(.tiny-select) {
    .tiny-input__inner {
      border-radius: 4px 0 0 4px;
    }
  }
  :deep(.tiny-search) {
    .tiny-search__line {
      border-left: none;
      border-radius: 0 4px 4px 0;
    }
  }
}
.model-table-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;

  :deep(.tiny-dropdown__trigger) {
    .tiny-dropdown__suffix-inner {
      display: flex;
      justify-content: center;
    }
  }

  .tiny-pager {
    padding-top: 0;
  }
}
.dropdown-menu-list.tiny-popper.tiny-dropdown-menu {
  margin-top: 4px;
}
.dropdown-menu-list {
  padding: 8px 0;
  margin-left: 16px;
  border-radius: 4px;
  z-index: 9999;

  :deep(.tiny-dropdown-item__wrap) {
    width: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    line-height: 24px;
  }
}
</style>
