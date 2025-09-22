<template>
  <div class="source-container">
    <tiny-popover
      placement="bottom-start"
      trigger="manual"
      v-model="isShow"
      :visible-arrow="false"
      :popper-class="['option-popper', 'fixed-left']"
    >
      <div class="source-wrap">
        <div class="source-title">
          <span>资源</span>
          <div class="right">
            <tiny-button type="primary" plain @click="setSource"> 确认 </tiny-button>
            <tiny-icon-close class="tiny-svg-size" @click="closePopover"></tiny-icon-close>
          </div>
        </div>
        <div class="source-content">
          <div class="source-filter">
            <tiny-select
              v-model="sourceCategory"
              :options="categoryOptions"
              placeholder="请选择分组"
              @change="categoryChange"
            >
            </tiny-select>
            <tiny-search class="search" v-model="searchWords" placeholder="按资源名称搜索" clearable>
              <template #prefix>
                <tiny-icon-search />
              </template>
            </tiny-search>
          </div>
          <div>
            <span
              :class="['source-tag', { 'source-type-active': sourceType === 'all' }]"
              @click="sourceTypeChange('all')"
              >全部</span
            >
            <tiny-divider direction="vertical"></tiny-divider>
            <span
              :class="['source-tag', { 'source-type-active': sourceType === 'image' }]"
              @click="sourceTypeChange('image')"
              >图片</span
            >
          </div>
          <div class="source-list">
            <div v-for="(item, index) in sourceList" :key="item.id" class="source-item">
              <img :src="item.thumbnailUrl || item.resourceUrl" />
              <tiny-radio
                v-model="selectedSourceIndex"
                @change="selectSource(index)"
                :label="index"
                text=""
              ></tiny-radio>
              <div class="source-name-wrap">
                <span :title="item.name">{{ item.name }}</span>
              </div>
            </div>
            <search-empty :isShow="!sourceList?.length" />
          </div>
        </div>
      </div>
      <template #reference>
        <div v-if="imgSrc" class="source-img-wrap">
          <img :src="imgSrc" />
          <div class="source-img-modal">
            <div @click="getResourceData">选择资源</div>
          </div>
        </div>
        <tiny-button v-else @click="getResourceData">选择资源</tiny-button>
        <tiny-input v-model="imgSrc" @blur="$emit('update:modelValue', imgSrc)"></tiny-input>
      </template>
    </tiny-popover>
  </div>
</template>
<script lang="ts">
import { ref, watch } from 'vue'
import type { Component } from 'vue'
import { Popover as TinyPopover, TinyButton, Input, Search, Select, Divider, Radio } from '@opentiny/vue'
import { iconClose, iconSearch } from '@opentiny/vue-icon'
import { SearchEmpty } from '@opentiny/tiny-engine-common'
import { useNotify } from '@opentiny/tiny-engine-meta-register'
import { fetchResourceGroupByAppId } from './http'

const isShow = ref(false)

const openPopover = () => {
  isShow.value = true
}

const closePopover = () => {
  isShow.value = false
}

export default {
  components: {
    TinyPopover: TinyPopover as Component,
    TinyButton: TinyButton as Component,
    TinyInput: Input,
    TinySearch: Search,
    TinySelect: Select,
    TinyDivider: Divider as Component,
    TinyRadio: Radio,
    SearchEmpty,
    TinyIconClose: iconClose(),
    TinyIconSearch: iconSearch()
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const imgSrc = ref(props.modelValue)

    const categoryData = ref([])

    const categoryOptions = ref([])

    const sourceCategory = ref()

    const sourceType = ref('all')

    const searchWords = ref('')

    const sourceOriginList = ref([])

    const sourceList = ref([])

    const selectedSourceIndex = ref()

    const getResourceData = () => {
      fetchResourceGroupByAppId()
        .then((res) => {
          if (Array.isArray(res)) {
            categoryData.value = res
            categoryOptions.value = res.map((item) => ({ label: item.name, value: item.id, resources: item.resources }))
            if (categoryOptions.value.length) {
              sourceCategory.value = categoryOptions.value[0].value
              sourceOriginList.value = categoryOptions.value[0].resources
              sourceList.value = categoryOptions.value[0].resources
            }
          }
          openPopover()
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            message: error
          })
        })
    }

    const categoryChange = () => {
      sourceOriginList.value = categoryData.value.find((item) => item.id === sourceCategory.value).resources
      sourceList.value = sourceOriginList.value.filter((item) => item.name.includes(searchWords.value))
    }

    const selectSource = (sourceIndex) => {
      selectedSourceIndex.value = sourceIndex
    }

    const sourceTypeChange = (type) => {
      sourceType.value = type
    }

    const setSource = () => {
      emit('update:modelValue', sourceList.value[selectedSourceIndex.value].resourceUrl)
      imgSrc.value = sourceList.value[selectedSourceIndex.value].resourceUrl
      closePopover()
    }
    watch(
      () => searchWords.value,
      () => {
        sourceList.value = sourceOriginList.value.filter((item) =>
          item.name.toLowerCase().includes(searchWords.value.toLowerCase())
        )
      }
    )

    return {
      isShow,
      imgSrc,
      sourceType,
      searchWords,
      sourceList,
      selectedSourceIndex,
      categoryOptions,
      sourceCategory,
      openPopover,
      closePopover,
      getResourceData,
      categoryChange,
      selectSource,
      sourceTypeChange,
      setSource
    }
  }
}
</script>
<style lang="less" scoped>
.source-container {
  width: 100%;
  line-height: 28px;
  background-color: var(--ti-lowcode-input-bg);
  .source-img-wrap {
    position: relative;
    width: 150px;
    height: 96px;
    background-color: var(--te-common-bg-container);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .source-img-modal {
      width: 0;
      height: 0;
      overflow: hidden;
      position: absolute;
      border-radius: 2px;
      left: 0;
      top: 0;
      background-color: rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;

      div {
        width: 70px;
        height: 22px;
        line-height: 22px;
        border: 1px solid var(--te-common-bg-popover);
        border-radius: 4px;
        text-align: center;
        color: var(--te-common-text-inverse);
        cursor: pointer;
      }
    }
    &:hover {
      .source-img-modal {
        width: 100%;
        height: 100%;
      }
    }
  }
}

.source-wrap {
  width: 392px;
  border-radius: 4px;

  .source-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0 20px 0;

    .right {
      .tiny-button {
        min-width: 45px;
      }
      svg {
        margin-left: 10px;
      }
    }

    span {
      font-weight: 600;
    }

    .tiny-svg {
      cursor: pointer;
    }
  }

  .source-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    .source-filter {
      display: flex;
      :deep(.tiny-select .tiny-input__inner) {
        border-radius: 4px 0 0 4px;
      }
      :deep(.tiny-search .tiny-search__line) {
        border-left: none;
        border-radius: 0 4px 4px 0;
      }
    }
    .source-tag {
      cursor: pointer;
    }
    .source-type-active {
      font-weight: 600;
    }
    .source-list {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      .empty-wrap {
        width: 100%;
      }

      .source-item {
        width: 120px;
        height: 78px;
        position: relative;
        background-color: var(--te-common-bg-container);
        border-radius: 2px;

        .tiny-radio {
          position: absolute;
          left: 8px;
          top: 8px;
          :deep(.tiny-radio__label) {
            visibility: hidden;
          }
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .source-name-wrap {
          display: none;
          height: 28px;
          position: absolute;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0));
          left: 0;
          right: 0;
          bottom: 0;
          text-align: center;
          line-height: 28px;
          width: 120px;
          color: var(--te-common-text-inverse);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          span {
            padding: 0 6px;
          }
        }

        &:hover {
          .source-name-wrap {
            display: block;
          }
        }
      }
    }
  }
}
</style>
