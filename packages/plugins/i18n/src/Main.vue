<template>
  <plugin-panel title="国际化资源" :isCloseLeft="false" class="plugin-panel-i18n">
    <template #header>
      <link-button :href="docsUrl"></link-button>
    </template>
    <template #content>
      <div class="btn-box">
        <tiny-button @click="openEditor($event, {})">新增词条</tiny-button>
        <tiny-file-upload
          ref="upload"
          size="small"
          :auto-upload="false"
          :show-file-list="false"
          action="/"
          @change="handleChange"
        >
          <template #trigger>
            <tiny-button>批量上传</tiny-button>
          </template>
        </tiny-file-upload>
        <tiny-button @click="batchDelete" :disabled="!selectedRowLength">批量删除</tiny-button>
        <div class="download-btn" @click="downloadFile">
          <svg-icon name="generate-code"></svg-icon>
          <tiny-button type="text"> 下载导入模板 </tiny-button>
        </div>
        <p v-show="isLoading && notEmpty">
          <span id="boxeight" class="i18n-loading"></span><span>正在导入，请稍后...</span>
        </p>
      </div>
      <div class="language-plugin-table">
        <div class="language-search-box">
          <tiny-select v-model="currentSearchType" :options="i18nSearchTypes"></tiny-select>
          <tiny-input v-model="searchKey" class="plugin-i18n-search" placeholder="请输入关键字" type="text" clearable>
            <template #prefix>
              <span class="icon">
                <svg-icon name="basic-search"></svg-icon>
              </span>
            </template>
          </tiny-input>
        </div>
        <tiny-grid
          ref="i18nTable"
          :data="langList"
          auto-resize
          class="stripe-tiny-grid"
          @edit-closed="editClosed($event)"
          :edit-config="{ trigger: 'manual', mode: 'row', showStatus: false }"
          :tooltip-config="{ appendToBody: false, placement: 'right' }"
          :edit-rules="validRules"
        >
          <tiny-grid-column type="selection" width="44"></tiny-grid-column>
          <tiny-grid-column
            width="120"
            field="key"
            title="key"
            show-overflow
            :show-icon="false"
            :editor="{ component: 'input', autoselect: true, attrs: { disabled: isEditMode } }"
          ></tiny-grid-column>
          <tiny-grid-column
            width="160"
            field="zh_CN"
            title="简体中文"
            :show-icon="false"
            :editor="{ component: 'input', autoselect: true }"
          ></tiny-grid-column>
          <tiny-grid-column
            width="160"
            field="en_US"
            title="English"
            :show-icon="false"
            :editor="{ component: 'input', autoselect: true }"
          ></tiny-grid-column>
          <tiny-grid-column width="90" field="operation" title="操作">
            <template v-slot="data">
              <div v-if="editingRow !== data.row" class="i18n-opera">
                <tiny-tooltip class="item" effect="dark" placement="bottom" content="编辑" :open-delay="500">
                  <span class="icon">
                    <svg-icon name="edit" @click.stop="openEditor($event, data.row)"></svg-icon>
                  </span>
                </tiny-tooltip>
                <tiny-tooltip class="item" effect="dark" placement="bottom" :open-delay="500">
                  <template #content>
                    <div style="padding: 10px 20px">
                      复制键值（唯一标识）<br />
                      {{ data.row.key }}
                    </div>
                  </template>
                  <tiny-popover
                    placement="top"
                    :visible-arrow="false"
                    trigger="manual"
                    :content="copyTipContent"
                    :modelValue="data.row.key && data.rowIndex === copyRowIndex"
                  >
                    <template #reference>
                      <span class="icon">
                        <svg-icon name="copy" @click="copyId(data.row, data.rowIndex)"></svg-icon>
                      </span>
                    </template>
                  </tiny-popover>
                </tiny-tooltip>
                <tiny-tooltip class="item" effect="dark" placement="bottom" content="删除" :open-delay="500">
                  <span class="icon">
                    <svg-icon name="delete" @click="openDeletePopover(data.row)"></svg-icon>
                  </span>
                </tiny-tooltip>
              </div>
            </template>
          </tiny-grid-column>
          <template #empty>
            <div v-if="isLoading" id="empty-loading-box" class="i18n-loading"></div>
            <search-empty isShow="!isLoading" />
          </template>
        </tiny-grid>
      </div>
    </template>
  </plugin-panel>
</template>

<script lang="jsx">
import { computed, ref, watchEffect, reactive, onMounted, nextTick, resolveComponent } from 'vue'
import useClipboard from 'vue-clipboard3'
import { Grid, GridColumn, Input, Popover, Button, FileUpload, Loading, Tooltip, Select } from '@opentiny/vue'
import { iconLoadingShadow } from '@opentiny/vue-icon'
import { PluginPanel, LinkButton, SearchEmpty } from '@opentiny/tiny-engine-common'
import { useTranslate, useApp, useModal, getGlobalConfig, useHelp } from '@opentiny/tiny-engine-controller'
import { utils } from '@opentiny/tiny-engine-utils'
import { useHttp } from '@opentiny/tiny-engine-http'
import { BASE_URL } from '@opentiny/tiny-engine-controller/js/environments'

export default {
  components: {
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    TinyInput: Input,
    TinyButton: Button,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    PluginPanel,
    LinkButton,
    TinySelect: Select,
    TinyFileUpload: FileUpload,
    SearchEmpty
  },
  setup() {
    // 组件库iconLoadingShadow图标不能切换颜色，因此不同主题用不同icon
    const SvgIcon = resolveComponent('SvgIcon')
    const lightSpinnerIcon = iconLoadingShadow()
    const darkSpinnerIcon = () => <SvgIcon name="loading" />
    const isLightTheme = getGlobalConfig().theme === 'light'
    const { getLangs, i18nResource, currentLanguage, getI18nData } = useTranslate()
    const { toClipboard } = useClipboard()
    const fullLangList = computed(() => {
      const langs = getLangs()

      return Object.keys(langs)
        .map((key) => ({ ...langs[key] }))
        .reverse()
    })
    const i18nSearchTypes = [
      {
        value: 'byTimeDesc',
        label: '按时间倒序'
      },
      {
        value: 'byTimeAsc',
        label: '按时间正序'
      },
      {
        value: 'byLetterZh',
        label: '按中文排序'
      },
      {
        value: 'byLetterEn',
        label: '按英文排序'
      }
    ]
    const docsUrl = useHelp().getDocsUrl('i18n')
    const currentSearchType = ref('')
    const copyTipContent = ref('')
    const searchKey = ref('')
    const activedRow = ref('')
    const langList = ref([])
    const copyRowIndex = ref('')
    const isEditMode = ref(false)
    const isLoading = ref(false)
    const upload = ref('upload')
    const i18nTable = ref(null)
    const selectedRowLength = computed(() => {
      return i18nTable.value?.getSelectRecords().length
    })
    const notEmpty = computed(() => langList.value.length > 0)
    const current = ref({
      lang: 'zh_CN',
      label: '中文'
    })
    const editingRow = ref(null)
    const validateKey = (rule, value, callback) => {
      // 新增模式，需要校验 key 不重复
      if (!isEditMode.value && fullLangList.value.some(({ key }) => value === key)) {
        callback(new Error('不可与现有 key 重复'))
        return
      }

      callback()
    }
    const validRules = reactive({
      key: [{ required: true, message: '必填' }, { validator: validateKey }]
    })

    onMounted(() => {
      currentSearchType.value = i18nSearchTypes[0].value
    })

    const sortByLetter = (sortType = 'zh_CN') => {
      langList.value = langList.value.sort((a, b) => {
        if (typeof a[sortType] === 'undefined' && typeof b[sortType] === 'undefined') return 0
        else if (typeof a[sortType] === 'undefined') return 1
        else if (typeof b[sortType] === 'undefined') return -1
        else
          return sortType === 'zh_CN'
            ? a[sortType].localeCompare(b[sortType], 'zh')
            : a[sortType].localeCompare(b[sortType])
      })
    }

    const sortTypeChanges = (event) => {
      switch (event) {
        case 'byTimeAsc':
          langList.value.reverse()
          break
        case 'byLetterZh':
          sortByLetter()
          break
        case 'byLetterEn':
          sortByLetter('en_US')
          break
        default:
      }
    }

    watchEffect(() => {
      langList.value = fullLangList.value.filter((item) => {
        const reg = new RegExp(searchKey.value, 'i')
        return reg.test(item?.zh_CN) || reg.test(item?.en_US) || reg.test(item?.key)
      })
      sortTypeChanges(currentSearchType.value)
    })

    watchEffect(() => {
      if (i18nResource.locales.length) {
        current.value = i18nResource.locales.find((item) => item.lang === currentLanguage.value)
      }
    })

    const confirm = (rowData) => {
      useTranslate().ensureI18n(rowData, true)
    }

    const editClosed = (event) => {
      i18nTable.value.validate(event.row, (valid) => {
        if (valid) {
          confirm(event.row)
        }
      })
    }

    const batchDelete = () => {
      const i18nData = i18nTable.value.getSelectRecords()

      if (!i18nData.length) {
        return
      }

      const { confirm } = useModal()

      confirm({
        title: '批量删除',
        message: `您确定删除 ${i18nData.length} 条数据吗？`,
        status: 'warning',
        exec: () => {
          const keys = i18nData.map(({ key }) => key)
          useTranslate().removeI18n(keys)
          i18nTable.value.clearSelection()
        }
      })
    }

    const downloadFile = () => {
      window.open(`${BASE_URL}src/app/public/i18n-mock/i18n-template-for-batch-import.zip`)
    }

    const openDeletePopover = (row) => {
      const { confirm } = useModal()

      confirm({
        title: '删除词条',
        message: `您确定删除 key 为 ${row.key} 的词条吗？`,
        exec: () => {
          const keys = [row.key]
          useTranslate().removeI18n(keys)
          i18nTable.value.clearSelection()
        }
      })
    }

    const getActiveRow = () => {
      activedRow.value = i18nTable.value.getActiveRow()?.rowIndex ?? ''
    }
    const openEditor = (_event, row) => {
      isEditMode.value = Boolean(row.key)
      editingRow.value = row
      if (!isEditMode.value) {
        row.key = `lowcode.${utils.guid()}`
        langList.value.unshift(row)
      }
      i18nTable.value.setActiveRow(row).then(() => {
        getActiveRow()
      })
    }

    const copyId = async (row, rowIndex) => {
      copyRowIndex.value = rowIndex
      try {
        await toClipboard(row.key)
        copyTipContent.value = '复制成功！'
      } catch (e) {
        copyTipContent.value = '复制失败！'
      } finally {
        setTimeout(() => {
          copyRowIndex.value = ''
        }, 3000)
      }
    }

    const handleAvatarSuccess = () => {
      getI18nData().then((res) => {
        const zhData = res?.messages?.zh_CN || {}
        const enData = res?.messages?.en_US || {}
        const allI18nKey = [...Object.keys(zhData), ...Object.keys(enData)]
        const arr = [...new Set(allI18nKey)]

        arr.forEach((item) => {
          if (item) {
            useTranslate().ensureI18n(
              {
                en_US: enData[item] || '',
                key: item,
                type: 'i18n',
                zh_CN: zhData[item] || ''
              },
              false
            )
          }
        })
      })
    }
    const handleChange = (data) => {
      const appId = useApp().appInfoState.selectedId
      const action = `/app-center/api/apps/${appId}/i18n/entries/update`

      const loadingTarget = notEmpty.value ? '#boxeight' : '#empty-loading-box'
      const loadintText = notEmpty.value ? '' : '正在导入'
      const loadingIcon = isLightTheme ? lightSpinnerIcon : darkSpinnerIcon
      isLoading.value = true

      let loadingInstance
      nextTick(() => {
        loadingInstance = Loading.service({
          lock: true,
          text: loadintText,
          spinner: loadingIcon,
          target: loadingTarget,
          background: 'transparent'
        })
      })
      const formdata = new FormData()
      // 1中文 2英文
      let key = '1'
      if (data.name.indexOf('en') > -1) {
        key = '2'
      }
      formdata.set(key, data.raw)

      useHttp()
        .post(action, formdata)
        .then(() => {
          handleAvatarSuccess()
        })
        .finally(() => {
          loadingInstance.close()
          isLoading.value = false
        })
    }

    return {
      sortTypeChanges,
      currentSearchType,
      i18nSearchTypes,
      selectedRowLength,
      notEmpty,
      copyTipContent,
      validRules,
      langList,
      searchKey,
      activedRow,
      i18nResource,
      copyRowIndex,
      editClosed,
      openEditor,
      openDeletePopover,
      copyId,
      handleChange,
      upload,
      handleAvatarSuccess,
      isLoading,
      current,
      confirm,
      i18nTable,
      downloadFile,
      isEditMode,
      editingRow,
      batchDelete,
      docsUrl
    }
  }
}
</script>

<style lang="less" scoped>
.stripe-tiny-grid {
  word-wrap: break-word;
  :deep(.tiny-grid) {
    .tiny-grid__header-wrapper {
      .tiny-grid-header__column {
        height: 32px;
      }
      .tiny-grid-cell {
        padding: 0;
        .tiny-grid-required-icon {
          display: none;
        }
      }
      .tiny-grid__repair {
        border-color: var(--ti-lowcode-tabs-border-color);
      }

      .tiny-grid-resizable.is__line:before {
        background-color: var(--ti-lowcode-toolbar-border-color);
      }
    }

    .tiny-grid__body-wrapper {
      &::-webkit-scrollbar {
        height: 10px;
      }
      .tiny-grid-body__column {
        height: 36px;
        .tiny-grid-cell {
          padding: 8px 0;
        }
        .i18n-opera svg {
          color: var(--ti-lowcode-i18n-operate-svg-color);
        }

        .copy-data {
          svg {
            margin-left: 5px;
          }
        }
      }

      .tiny-grid-body__row,
      .tiny-grid-body__row:not(.row__hover):nth-child(2n) {
        background-image: linear-gradient(
          -180deg,
          var(--ti-lowcode-tabs-border-color),
          var(--ti-lowcode-tabs-border-color)
        );
        background-repeat: no-repeat;
        background-size: 100% 1px;
        background-position: 100% 100%;
        &.row__current {
          background-color: var(--ti-lowcode-toolbar-view-hover-bg);
        }
      }

      .tiny-grid-body__row {
        &.row__selected {
          .tiny-grid-checkbox__icon {
            svg {
              color: var(--ti-lowcode-common-primary-color);
              width: 100%;
              height: 100%;
            }
          }
        }
      }
    }

    .tiny-grid__empty-text {
      color: var(--ti-lowcode-toolbar-breadcrumb-color);
    }
  }
  #empty-loading-box {
    width: 100%;
    color: red;
    :deep(.tiny-loading__spinner) svg {
      width: 36px;
      height: 36px;
      font-size: 36px;
    }
    :deep(.tiny-loading__text) {
      margin-top: 8px;
    }
  }
  .i18n-loading {
    :deep(.tiny-loading__spinner) {
      svg {
        color: var(--ti-lowcode-i18n-loading-svg-color);
      }
    }
    :deep(.tiny-loading__text) {
      color: var(--ti-lowcode-i18n-loading-text-color);
    }
  }
}
.btn-box {
  color: var(--ti-lowcode-toolbar-breadcrumb-color);
  font-size: 14px;
  padding-left: 10px;
  :deep(.tiny-file-upload) {
    display: inline-block;
    margin: 0 10px;
  }
  span {
    padding-left: 12px;
  }
  #boxeight {
    :deep(.circular) {
      width: 16px;
      height: 16px;
      margin-top: 13px;
    }
    :deep(.path) {
      stroke: var(--ti-lowcode-toolbar-breadcrumb-color);
    }
  }
}

.language-plugin-table {
  height: calc(100% - 48px);
  flex: 1;
  padding: 0 16px;
  overflow-y: scroll;

  .operation-column {
    display: flex;
    width: 100%;
    justify-content: space-around;

    svg {
      font-size: 14px;
    }
  }
  .language-search-box {
    display: flex;
    .tiny-input {
      margin: 12px 0;
      margin-left: 8px;
      :deep(.tiny-input__prefix) {
        left: 8px;
      }
    }
    .tiny-select {
      margin: 12px 0;
      width: 240px;
    }
  }
}

.delete-popover-container {
  padding: 20px;
  svg {
    font-size: 20px;
    color: var(--ti-lowcode-warning-color);
  }
  .delete-tip {
    margin-left: 5px;
  }
  .i18n-item {
    display: flex;
    margin-bottom: 10px;
    align-items: center;

    label {
      width: 80px;
    }

    display: flex;
  }

  .i18n-btns {
    margin-top: 24px;
    text-align: center;
  }
}
.stripe-tiny-grid {
  .i18n-opera {
    display: flex;
    justify-content: space-between;
    :deep(.icon) {
      svg {
        font-size: 16px;
      }
      &:hover {
        svg {
          opacity: 0.75;
        }
      }
    }
  }
}

.download-btn {
  cursor: pointer;
  display: inline-block;
  font-size: 12px;
  text-align: left;
  padding: 0;
  margin-left: 8px;
  color: var(--ti-lowcode-base-text-color);
  svg {
    font-size: 16px;
  }
  .tiny-button.tiny-button--text {
    color: var(--ti-lowcode-base-text-color);
  }
}
:deep(.help-box) {
  position: absolute;
  left: 86px;
  top: 3px;
}
</style>
