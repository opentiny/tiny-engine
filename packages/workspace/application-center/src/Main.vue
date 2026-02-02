<template>
  <div class="app-center">
    <div class="app-center-title">应用中心</div>
    <div class="app-center-operation">
      <tiny-button class="add-app" @click="creatApp()"> <svg-icon name="add"></svg-icon>创建应用 </tiny-button>
      <div class="app-center-filter">
        <tiny-select v-model="state.appFilter" :options="appFilterOptions" @change="getApplicationList"></tiny-select>
        <tiny-select v-model="state.orderBy" :options="appOrderByOptions" @change="getApplicationList"></tiny-select>
        <tiny-search
          class="app-center-search"
          v-model="state.appSearchKey"
          clearable
          placeholder="输入关键字搜索、过滤"
          @search="getApplicationList"
          is-enter-search
        >
          <template #prefix> <tiny-icon-search /> </template>
        </tiny-search>
        <div class="type-toolbar">
          <span
            v-for="item in arrangeOptions"
            :key="item.id"
            :class="['icon-wrap', { active: state.type === item.id }]"
            @click="typeClick(item.id)"
          >
            <svg-icon :name="item.assetsUrl"></svg-icon>
          </span>
        </div>
      </div>
    </div>
    <div class="app-center-list">
      <div class="list-wrap">
        <div class="list" v-if="state.type === 'default'">
          <template v-for="item in appList" :key="item.id">
            <div class="item">
              <div class="app-name">
                <svg-icon :name="item.assetsUrl || 'template-cover-1'" class="app-img"></svg-icon>
                <div class="app-name-content">
                  <div class="app-name-text">{{ item.name }}</div>
                  <div class="app-desc">{{ item.description }}</div>
                </div>
              </div>
              <div class="app-operation">
                <div class="option" @click="openApplication(item)">
                  <svg-icon name="cloud-shell"></svg-icon>
                  <span class="option-text">开发应用</span>
                </div>
                <tiny-divider direction="vertical"></tiny-divider>
                <div class="option" @click="handleDelete(item)">
                  <svg-icon name="delete"></svg-icon>
                  <span class="option-text">删除应用</span>
                </div>
              </div>
            </div>
          </template>
        </div>
        <tiny-grid ref="gridRef" class="table" v-if="state.type === 'table' && appList.length" :data="appList">
          <tiny-grid-column field="name" title="应用名称" show-overflow>
            <template #default="data">
              <div class="app-name">
                <svg-icon :name="data.row.assetsUrl || 'template-cover-1'" class="app-img"></svg-icon>
                <span>{{ data.row.name }}</span>
              </div>
            </template>
          </tiny-grid-column>
          <tiny-grid-column field="created_at" title="创建时间" show-overflow></tiny-grid-column>
          <tiny-grid-column field="createdBy" title="创建人" show-overflow></tiny-grid-column>
          <tiny-grid-column field="description" title="应用描述" show-overflow></tiny-grid-column>
          <tiny-grid-column width="180" field="operation" title="操作">
            <template #default="data">
              <tiny-button type="text" @click="openApplication(data.row)"> 开发应用 </tiny-button>
              <tiny-button type="text" @click="handleDelete(data.row)"> 删除应用 </tiny-button>
            </template>
          </tiny-grid-column>
        </tiny-grid>
        <search-empty :isShow="!appList.length" />
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
    <app-dialog v-model:visible="state.appVisible" @confirm="confirmApp"></app-dialog>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from 'vue'
import { Button, Select, Pager, Grid, GridColumn, Divider, Search, Modal, Notify } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { SearchEmpty } from '@opentiny/tiny-engine-common'
import AppDialog from './AppDialog.vue'
import { fetchApplicationList, createApplication, updateApplication, deleteApplication } from './js/http'

export default {
  components: {
    TinyButton: Button,
    TinySelect: Select,
    TinyPager: Pager,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    TinyDivider: Divider,
    TinySearch: Search,
    SearchEmpty,
    TinyIconSearch: iconSearch(),
    AppDialog
  },

  setup() {
    const appList = ref([])

    const appFilterOptions = [
      {
        label: '全部应用',
        value: 'all'
      },
      {
        label: '我的应用',
        value: 'my'
      }
    ]

    const appOrderByOptions = [
      {
        label: '按创建时间排序',
        value: 'created_time'
      },
      {
        label: '按最近更新时间排序',
        value: 'last_updated_time'
      }
    ]

    const arrangeOptions = [
      {
        id: 'default',
        name: '栅格',
        assetsUrl: 'workspace-icon-application-center'
      },
      {
        id: 'table',
        name: '列表',
        assetsUrl: 'small-list'
      }
    ]

    const queryParams = new URLSearchParams(location.search)

    const state = reactive({
      appFilter: 'all',
      orderBy: 'created_time',
      appSearchKey: '',
      type: 'default',
      total: 0,
      pageSize: 10,
      currentPage: 1,
      pageSizes: [10, 20, 30, 40],
      appVisible: false
    })

    const getApplicationList = () => {
      const params = {
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        name: state.appSearchKey,
        createdBy: state.appFilter === 'all' ? '' : '1'
      }
      if (state.orderBy === 'last_updated_time') {
        params.orderBy = state.orderBy
      }
      fetchApplicationList(Object.fromEntries(Object.entries(params).filter(([, value]) => !!value))).then((res) => {
        appList.value = res.apps || []
        state.total = res.total
      })
    }

    const creatApp = () => {
      state.appVisible = true
    }

    const handleDelete = (template) => {
      Modal.confirm({
        message: '即将删除应用，删除后不可恢复，请谨慎操作。',
        title: '删除应用'
      }).then((res) => {
        if (res === 'confirm') {
          deleteApplication(template.id)
            .then(() => {
              getApplicationList()
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
      })
    }

    const openApplication = (template) => {
      const href = window.location.href.split('?')[0] || './'
      const newUrl = `${href}?type=app&id=${template.id}&tenant=${template.tenantId || queryParams.get('tenant')}`
      if (window.self !== window.top) {
        window.parent.postMessage(
          {
            type: 'openNewTab',
            url: newUrl
          },
          '*'
        )
      } else {
        window.open(newUrl)
      }
    }

    const typeClick = (type) => {
      state.type = type
    }

    const pageSizeChange = (val) => {
      state.pageSize = val
      state.currentPage = 1
      getApplicationList()
    }

    const currentChange = (val) => {
      state.currentPage = val
      getApplicationList()
    }

    const confirmApp = (formData) => {
      if (formData?.id) {
        const updateId = formData.id
        delete formData.id
        updateApplication(updateId, formData)
          .then(() => {
            Notify({
              type: 'success',
              message: '应用更新成功',
              position: 'top-right',
              duration: 5000
            })
            getApplicationList()
          })
          .catch((error) => {
            Notify({
              type: 'error',
              message: error,
              position: 'top-right',
              duration: 5000
            })
          })
      } else {
        createApplication(formData)
          .then(() => {
            Notify({
              type: 'success',
              message: '应用创建成功',
              position: 'top-right',
              duration: 5000
            })
            getApplicationList()
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
    }

    onMounted(() => {
      getApplicationList()
    })

    return {
      state,
      appList,
      appFilterOptions,
      appOrderByOptions,
      arrangeOptions,
      creatApp,
      getApplicationList,
      typeClick,
      handleDelete,
      openApplication,
      confirmApp,
      pageSizeChange,
      currentChange
    }
  }
}
</script>

<style lang="less" scoped>
.app-center {
  padding: 24px;
  background: var(--te-template-common-bg-color);
  height: -webkit-fill-available;
  .app-center-title {
    font-size: 20px;
    font-weight: 600;
  }
  .app-center-operation {
    margin: 24px 0 20px;
    display: flex;
    justify-content: space-between;
  }
  .app-center-filter {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .app-center-search {
    min-width: 300px;
  }
  .type-toolbar {
    display: flex;
    border-radius: 4px;
    background-color: var(--te-template-app-center-btn-bg-color);
    .icon-wrap {
      width: 24px;
      height: 24px;
      color: var(--te-template-app-center-btn-icon-color);
      font-size: 16px;
      cursor: pointer;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      transition: 0.3s;
      &.active {
        border: 1px solid var(--te-template-app-center-btn-border-color-active);
        color: var(--te-template-app-center-btn-color-active);
        border-radius: 4px;
        background-color: var(--te-template-app-center-btn-bg-color-active);
      }
    }
  }
  .app-center-list {
    height: calc(100vh - 200px);
  }
}
.list {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  .item {
    width: 252px;
    padding: 24px 24px 12px;
    border-radius: 8px;
    border: 1px solid var(--te-template-app-center-item-border-color);
    position: relative;
    &:hover {
      border-color: var(--te-template-app-center-item-border-color-hover);
    }
    .app-name {
      display: flex;
      gap: 16px;
      .app-img {
        width: 48px;
        height: 48px;
      }
      .app-name-content {
        width: calc(100% - 64px);
        .app-name-text {
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .app-desc {
          margin-top: 4px;
          font-size: 12px;
          line-height: 18px;
          color: var(--te-template-center-common-item-desc-text-color);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }
    .app-operation {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-top: 12px;
      margin-top: 16px;
      border-top: 1px dashed var(--te-template-app-center-item-border-color);
      .option {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        &:hover {
          .option-text {
            text-decoration: underline;
          }
        }
      }
    }
  }
}
.table {
  .app-name {
    display: flex;
    gap: 8px;
    align-items: center;
    .app-img {
      width: 24px;
      height: 24px;
    }
  }

  .tiny-button.tiny-button--text {
    padding-left: 0;
  }
}

.list-wrap {
  margin-bottom: 12px;
  max-height: calc(100% - 80px);
  overflow: auto;
  .empty-wrap {
    width: 100%;
  }
}
.options {
  .option {
    padding: 4px 16px;
    cursor: pointer;
    &:hover {
      background: var(--te-template-common-bg-color-hover);
    }
  }
}
</style>
