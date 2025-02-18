<template>
  <plugin-panel
    title="国际化资源"
    :docsUrl="docsUrl"
    :isShowDocsIcon="true"
    :isCloseLeft="false"
    class="plugin-panel-i18n"
  >
    <template #content>
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
      <div class="btn-box">
        <tiny-button @click="openEditor($event, {})">
          <svg-icon name="add" class="btn-icon"></svg-icon>添加词条
        </tiny-button>
        <tiny-button class="middle-btn" @click="batchDelete" :disabled="!selectedRowLength"
          ><svg-icon class="btn-icon" name="delete"></svg-icon>删除</tiny-button
        >
        <tiny-file-upload
          ref="upload"
          size="small"
          :auto-upload="false"
          :show-file-list="false"
          action="/"
          @change="handleChange"
        >
          <template #trigger>
            <tiny-button><icon-upload class="btn-icon"></icon-upload>批量上传</tiny-button>
          </template>
        </tiny-file-upload>
        <a class="download-btn" @click="downloadFile"> 下载导入模板 </a>
        <p v-show="isLoading && notEmpty">
          <span id="boxeight" class="i18n-loading"></span><span>正在导入，请稍后...</span>
        </p>
      </div>
      <div class="language-plugin-table lowcode-scrollbar">
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
                <span class="icon">
                  <svg-icon name="to-edit" @click.stop="openEditor($event, data.row)"></svg-icon>
                </span>
                <tiny-tooltip class="item" effect="light" placement="bottom" :open-delay="OPEN_DELAY.Default">
                  <template #content>
                    <div>
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
                <span class="icon">
                  <svg-icon name="delete" @click="openDeletePopover(data.row)"></svg-icon>
                </span>
              </div>
            </template>
          </tiny-grid-column>
          <template #empty>
            <div v-if="isLoading" id="empty-loading-box" class="i18n-loading"></div>
            <search-empty v-else />
          </template>
        </tiny-grid>
      </div>
    </template>
  </plugin-panel>
</template>

<script lang="jsx">
import { computed, ref, watchEffect, reactive, onMounted, nextTick, resolveComponent, watch } from 'vue'
import useClipboard from 'vue-clipboard3'
import { Grid, GridColumn, Input, Popover, Button, FileUpload, Loading, Tooltip, Select } from '@opentiny/vue'
import { iconLoadingShadow, iconUpload } from '@opentiny/vue-icon'
import { PluginPanel, SearchEmpty } from '@opentiny/tiny-engine-common'
import { useTranslate, useModal, useHelp, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { utils, constants } from '@opentiny/tiny-engine-utils'
import { BASE_URL } from '@opentiny/tiny-engine-common/js/environments'
const { OPEN_DELAY } = constants

export default {
  components: {
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    TinyInput: Input,
    TinyButton: Button,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    PluginPanel,
    TinySelect: Select,
    TinyFileUpload: FileUpload,
    SearchEmpty,
    IconUpload: iconUpload()
  },
  setup() {
    // 组件库iconLoadingShadow图标不能切换颜色，因此不同主题用不同icon
    const SvgIcon = resolveComponent('SvgIcon')
    const lightSpinnerIcon = iconLoadingShadow()
    const darkSpinnerIcon = () => <SvgIcon name="loading" />
    const isLightTheme = getMergeMeta('engine.config').theme === 'light'
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
      return i18nTable.value?.getAllSelection().length
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

    watch(
      () => [fullLangList.value, currentSearchType.value, searchKey.value],
      () => {
        langList.value = fullLangList.value.filter((item) => {
          const reg = new RegExp(searchKey.value, 'i')
          return reg.test(item?.zh_CN) || reg.test(item?.en_US) || reg.test(item?.key)
        })
        sortTypeChanges(currentSearchType.value)
      }
    )

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
        copyTipContent.value = '复制成功'
      } catch (e) {
        copyTipContent.value = '复制失败'
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
      const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
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

      getMetaApi(META_SERVICE.Http)
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
      docsUrl,
      OPEN_DELAY
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-panel-i18n {
  box-shadow: 6px 0px 3px 0px var(--te-i18n-panel-shadow-color);
}
.stripe-tiny-grid {
  word-wrap: break-word;
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
        color: var(--te-i18n-loading-icon-color);
      }
    }
    :deep(.tiny-loading__text) {
      color: var(--te-i18n-loading-text-color);
    }
  }
}

.language-search-box {
  padding: 0 12px;
  margin-bottom: 12px;
  display: flex;
  .tiny-input {
    margin-left: 8px;
  }
  .tiny-select {
    width: 210px;
  }
  :deep(.tiny-input) {
    .tiny-input__prefix {
      line-height: 1;
    }
    &.tiny-input-prefix .tiny-input__inner {
      padding: 0 8px 0 26px;
    }
  }
}

.btn-box {
  color: var(--te-i18n-button-text-color);
  font-size: 12px;
  margin-bottom: 12px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  column-gap: 8px;
  .btn-icon {
    font-size: 16px;
    color: var(--te-i18n-button-icon-color);
    margin-right: 4px;
  }
  .middle-btn {
    margin-left: 0;
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
      stroke: var(--te-i18n-common-tip-text-color);
    }
  }
  .download-btn {
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    font-size: 12px;
    text-align: left;
    padding: 0;
    color: var(--te-i18n-button-text-color);
    svg {
      font-size: 16px;
    }
    .tiny-button.tiny-button--text {
      color: var(--te-i18n-button-text-color);
    }
    &:hover {
      text-decoration: underline;
    }
  }
}

.language-plugin-table {
  height: calc(100% - 48px);
  flex: 1;
  padding: 12px;
  border-top: 1px solid var(--te-i18n-border-color);
  overflow-y: scroll;

  .operation-column {
    display: flex;
    width: 100%;
    justify-content: space-around;

    svg {
      font-size: 14px;
    }
  }
}

.stripe-tiny-grid {
  .i18n-opera {
    display: flex;
    justify-content: space-between;
    :deep(.icon) {
      color: var(--te-i18n-grid-opt-icon-color);
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
</style>
