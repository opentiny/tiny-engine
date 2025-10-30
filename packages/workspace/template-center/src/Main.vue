<template>
  <div class="template-center">
    <div class="template-center-title">模板中心</div>
    <div class="template-center-operation">
      <tiny-search
        v-model="state.searchValue"
        clearable
        placeholder="输入关键字搜索、过滤"
        @search="getTemplateList"
        is-enter-search
      >
        <template #prefix> <tiny-icon-search /> </template>
      </tiny-search>
      <div class="template-center-operation-tags">
        <div class="tags-item">
          <div class="label">场景</div>
          <div class="tags">
            <div class="tag" :class="{ active: state.scene === null }" @click="handleChangeTags('scene', null)">
              全部
            </div>
            <template v-for="tag in tagList.scene" :key="tag.id">
              <div class="tag" :class="{ active: state.scene === tag.id }" @click="handleChangeTags('scene', tag.id)">
                {{ tag.name }}
              </div>
            </template>
          </div>
        </div>
        <div class="tags-item">
          <div class="label">行业</div>
          <div class="tags">
            <div class="tag" :class="{ active: state.industry === null }" @click="handleChangeTags('industry', null)">
              全部
            </div>
            <template v-for="tag in tagList.industry" :key="tag.id">
              <div
                class="tag"
                :class="{ active: state.industry === tag.id }"
                @click="handleChangeTags('industry', tag.id)"
              >
                {{ tag.name }}
              </div>
            </template>
          </div>
        </div>
        <div class="tags-item">
          <div class="label">技术栈</div>
          <div class="tags">
            <div class="tag" :class="{ active: state.framework === '' }" @click="handleChangeTags('framework', '')">
              全部
            </div>
            <template v-for="tag in tagList.framework" :key="tag">
              <div class="tag" :class="{ active: state.framework === tag }" @click="handleChangeTags('framework', tag)">
                {{ tag }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="template-center-list">
      <div class="list">
        <template v-for="item in templateList" :key="item.id">
          <div class="item" @click="handleClickTemplate(item)">
            <div class="template-img">
              <img :src="item.image_url || '/default-template-cover.png'" />
            </div>
            <div class="item-content">
              <div class="template-name">
                <span class="template-name-text">{{ item.name }}</span>
              </div>
              <div class="template-desc">{{ item.description }}</div>
              <div class="template-tag">
                <div v-if="item.sceneId" class="tag">
                  {{ item.scene[0]?.name }}
                </div>
                <div v-if="item.industryId" class="tag">
                  {{ item.industry[0]?.name }}
                </div>
                <div v-if="item.framework" class="tag">{{ item.framework }}</div>
              </div>
              <div class="template-from">来自TinyEngine官方</div>
            </div>
          </div>
        </template>
        <search-empty :isShow="!templateList.length" />
      </div>
      <tiny-pager
        v-if="state.total > state.pageSize"
        mode="number"
        :current-page="state.currentPage"
        :page-size="state.pageSize"
        :page-sizes="state.pageSizes"
        :total="state.total"
        @size-change="pageSizeChange"
        @current-change="currentChange"
      ></tiny-pager>
    </div>
    <template-detail
      v-if="state.templateVisible"
      v-model:visible="state.templateVisible"
      :template="state.currentTemplate"
      :placement="'bottom'"
      height="85vh"
      :mask-closable="false"
    ></template-detail>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { Pager, Search, Notify } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { SearchEmpty } from '@opentiny/tiny-engine-common'
import TemplateDetail from './TemplateDetail.vue'
import { fetchBusinessCategoryByGroup, fetchTemplateList } from './js/http'

export default {
  components: {
    TemplateDetail,
    TinyPager: Pager,
    TinySearch: Search,
    SearchEmpty,
    TinyIconSearch: iconSearch()
  },

  setup() {
    const templateList = ref([])

    const tagList = reactive({
      scene: [],
      industry: [],
      framework: ['Vue']
    })

    const state = reactive({
      templateVisible: false,
      currentTemplate: null,
      searchValue: '',
      scene: null,
      industry: null,
      framework: '',
      total: 0,
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 30, 40]
    })

    const getTagsList = async () => {
      Promise.all([fetchBusinessCategoryByGroup('场景'), fetchBusinessCategoryByGroup('行业')])
        .then((res) => {
          tagList.scene = res[0] || []
          tagList.industry = res[1] || []
        })
        .catch((error) => {
          Notify({
            type: 'error',
            message: error,
            position: 'top-right',
            duration: 5000
          })
        })
    }

    const getTemplateList = () => {
      const params = {
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        name: state.searchValue,
        sceneId: state.scene,
        industryId: state.industry,
        framework: state.framework
      }
      fetchTemplateList(Object.fromEntries(Object.entries(params).filter(([, value]) => !!value)))
        .then((res) => {
          templateList.value = res.apps || []
          state.total = res.total
        })
        .catch((error) => {
          Notify({
            type: 'error',
            message: error,
            position: 'top-right',
            duration: 5000
          })
        })
    }

    const handleChangeTags = (type, tag) => {
      if (state[type] === tag) {
        return
      }
      state[type] = tag
      getTemplateList()
    }

    const handleClickTemplate = (template) => {
      state.templateVisible = true
      state.currentTemplate = template
    }

    const pageSizeChange = (val) => {
      state.pageSize = val
      state.currentPage = 1
      getTemplateList()
    }

    const currentChange = (val) => {
      state.currentPage = val
      getTemplateList()
    }

    onMounted(async () => {
      await getTagsList()
      getTemplateList()
    })

    return {
      templateList,
      state,
      tagList,
      handleChangeTags,
      handleClickTemplate,
      pageSizeChange,
      currentChange,
      getTemplateList
    }
  }
}
</script>

<style lang="less" scoped>
.template-center {
  padding: 24px;
  background: var(--te-template-common-bg-color);
  height: -webkit-fill-available;
  .template-center-title {
    font-size: 20px;
    font-weight: 600;
  }
  .template-center-operation {
    margin-top: 24px;
    &-tags {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      .tags-item {
        display: flex;
        align-items: center;
        .label {
          width: 36px;
          margin-right: 30px;
          color: var(--te-template-common-text-color-secondary);
        }
        .tags {
          display: flex;
          gap: 20px;
          .tag {
            padding: 2px 4px;
            border-radius: 2px;
            cursor: pointer;
          }
          .active {
            background: var(--te-template-center-common-item-tag-bg-color);
          }
        }
      }
    }
  }
  .template-center-list {
    margin-top: 20px;
    height: calc(100vh - 300px);
    .list {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 12px;
      overflow: auto;
      max-height: calc(100% - 80px);
      .empty-wrap {
        width: 100%;
      }
      .item {
        width: 300px;
        border-radius: 8px;
        background: var(--te-template-center-common-item-bg-color);
        position: relative;
        .item-content {
          padding: 16px 20px 20px;
        }
        .template-img {
          width: 100%;
          height: 132px;
          overflow: hidden;
          img {
            width: 100%;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
        }
        .template-name {
          display: flex;
          gap: 8px;
          align-items: center;
          .template-name-text {
            font-size: 18px;
            font-weight: 600;
          }
        }
        .template-tag {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          .tag {
            padding: 2px 4px;
            border-radius: 2px;
            background: var(--te-template-center-common-item-tag-bg-color);
            cursor: pointer;
          }
        }
        .template-desc {
          margin-top: 8px;
          height: 16px;
          color: var(--te-template-center-common-item-desc-text-color);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .template-from {
          margin-top: 16px;
          color: var(--te-template-center-common-item-from-text-color);
        }
      }
    }
  }
}
</style>
<style lang="less">
.tiny-pager__selector.tiny-popover.tiny-popper[x-placement],
.operation-popover.tiny-popover.tiny-popper[x-placement] {
  padding: 8px 0;
}
</style>
