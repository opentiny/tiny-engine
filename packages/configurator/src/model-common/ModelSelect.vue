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
      <tiny-grid-column field="version" title="版本" show-overflow></tiny-grid-column>
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
import { Search, Grid, GridColumn, Pager, DropdownMenu, DropdownItem } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { getModelList } from '../model-common/http'
import { handleSelectedModelParameters } from './utils'

export default {
  components: {
    TinySearch: Search,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    TinyPager: Pager,
    TinyDropdownMenu: DropdownMenu,
    TinyDropdownItem: DropdownItem,
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
    const modelList = ref([
      {
        id: 1,
        createdBy: '1',
        lastUpdatedBy: '1',
        tenantId: '1',
        renterId: null,
        siteId: null,
        nameCn: 'model1',
        nameEn: 'model1',
        version: '1.0.0',
        parameters: [
          {
            prop: 'name',
            label: '名称',
            type: 'String'
          },
          {
            prop: 'age',
            label: '年龄',
            type: 'Number'
          },
          {
            prop: 'job',
            label: '职业',
            type: 'Enum',
            options: "[{'label': '前端开发','value': 'frontend developer'},{'label': '后端开发','value': 'backend developer'}]"
          },
          {
            prop: 'birth',
            label: '生日',
            type: 'Date'
          },
          {
            prop: 'probation',
            label: '实习',
            type: 'Boolean'
          }
        ],
        method: [
          {
            name: '新增方法',
            nameEn: 'insertApi',
            requestParameters: [
              {
                prop: 'params',
                type: 'Object',
                children: [
                  {
                    prop: 'name',
                    type: 'string'
                  },
                  {
                    prop: 'age',
                    type: 'number'
                  }
                ]
              }
            ],
            responseParameters: [
              {
                prop: 'code',
                type: 'Number'
              },
              {
                prop: 'message',
                type: 'String'
              }
            ]
          },
          {
            name: '修改方法',
            nameEn: 'updateApi',
            requestParameters: [
              {
                prop: 'params',
                type: 'Object',
                children: [
                  {
                    prop: 'name',
                    type: 'string'
                  },
                  {
                    prop: 'age',
                    type: 'number'
                  }
                ]
              }
            ],
            responseParameters: [
              {
                prop: 'code',
                type: 'number'
              },
              {
                prop: 'message',
                type: 'string'
              }
            ]
          },
          {
            name: '查询方法',
            nameEn: 'queryApi',
            requestParameters: [
              {
                prop: 'currentPage',
                type: 'number'
              },
              {
                prop: 'pageSize',
                type: 'number'
              },
              {
                prop: 'params',
                type: 'Object',
                children: [
                  {
                    prop: 'name',
                    type: 'string'
                  },
                  {
                    prop: 'age',
                    type: 'number'
                  }
                ]
              }
            ],
            responseParameters: [
              {
                prop: 'code',
                type: 'Number'
              },
              {
                prop: 'message',
                type: 'String'
              },
              {
                prop: 'data',
                type: 'Array'
              },
              {
                prop: 'total',
                type: 'number'
              }
            ]
          },
          {
            name: '删除方法',
            nameEn: 'deleteApi',
            requestParameters: [
              {
                prop: 'id',
                type: 'Number'
              }
            ],
            responseParameters: [
              {
                prop: 'code',
                type: 'Number'
              },
              {
                prop: 'message',
                type: 'String'
              }
            ]
          }
        ],
        description: 'test',
        created_at: '2025-07-18 16:39:04',
        updated_at: '2025-07-18 16:39:04'
      },
      {
        id: 2,
        createdBy: '1',
        lastUpdatedBy: '1',
        tenantId: '1',
        renterId: null,
        siteId: null,
        nameCn: 'model2',
        nameEn: 'model2',
        version: '1.0.0',
        parameters: [
          {
            prop: 'name',
            label: '名称',
            type: 'String'
          },
          {
            prop: 'age',
            label: '年龄',
            type: 'Number'
          },
          {
            prop: 'job',
            label: '职业',
            type: 'Enum',
            options: "[{'label': '前端开发','value': 'frontend developer'},{'label': '后端开发','value': 'backend developer'}]"
          },
          {
            prop: 'birth',
            label: '生日',
            type: 'Date'
          },
          {
            prop: 'probation',
            label: '实习',
            type: 'Boolean'
          }
        ],
        method: [
          {
            name: '新增方法',
            nameEn: 'insertApi',
            requestParameters: [
              {
                name: 'params',
                type: 'Object',
                children: [
                  {
                    prop: 'name',
                    type: 'string'
                  },
                  {
                    prop: 'age',
                    type: 'number'
                  }
                ]
              }
            ],
            responseParameters: [
              {
                prop: 'code',
                type: 'Number'
              },
              {
                prop: 'message',
                type: 'String'
              }
            ]
          },
          {
            name: '修改方法',
            nameEn: 'updateApi',
            requestParameters: [
              {
                prop: 'params',
                type: 'Object',
                children: [
                  {
                    prop: 'name',
                    type: 'string'
                  },
                  {
                    prop: 'age',
                    type: 'number'
                  }
                ]
              }
            ],
            responseParameters: [
              {
                prop: 'code',
                type: 'Number'
              },
              {
                prop: 'message',
                type: 'String'
              }
            ]
          },
          {
            name: '查询方法',
            nameEn: 'queryApi',
            requestParameters: [
              {
                prop: 'params',
                type: 'Object',
                children: [
                  {
                    prop: 'name',
                    type: 'string'
                  },
                  {
                    prop: 'age',
                    type: 'number'
                  }
                ]
              }
            ],
            responseParameters: [
              {
                prop: 'code',
                type: 'Number'
              },
              {
                prop: 'message',
                type: 'String'
              },
              {
                prop: 'data',
                type: 'Array'
              }
            ]
          },
          {
            name: '删除方法',
            nameEn: 'deleteApi',
            requestParameters: [
              {
                prop: 'id',
                type: 'Number'
              }
            ],
            responseParameters: [
              {
                prop: 'code',
                type: 'Number'
              },
              {
                prop: 'message',
                type: 'String'
              }
            ]
          }
        ],
        description: 'test', 
        created_at: '2025-07-18 16:39:16',
        updated_at: '2025-07-18 16:39:16'
      }
    ])
    // 分页配置
    const pagerState = reactive({
      currentPage: 1,
      total: 0
    })
    // 已选中的模型
    const currentSelectedModel = ref()
    // 搜索
    const searchWords = ref('')

    const getModels = () => {
      getModelList(pagerState.currentPage, { nameCn: searchWords.value })
        .then((res) => {
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

    const selectModel = async (data) => {
      // 处理parameters
      currentSelectedModel.value = await handleSelectedModelParameters(data.row);
      emit('modelSelect', currentSelectedModel.value)
    }

    const showVersions = (e, data) => {}

    const changeVersion = (e, data) => {}

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
      selectModel,
      showVersions,
      changeVersion
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
