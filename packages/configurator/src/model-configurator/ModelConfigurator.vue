<template>
  <div class="model-container">
    <div class="model-name-warp">
      <tiny-popover
        placement="bottom-start"
        trigger="manual"
        v-model="isShow"
        :visible-arrow="false"
        :popper-class="['option-popper', 'fixed-left']"
      >
        <div class="model-title">
          <span>绑定模型数据</span>
          <div class="right">
            <tiny-button type="primary" plain @click="setModel"> 确认 </tiny-button>
            <tiny-icon-close class="tiny-svg-size" @click="closePopover"></tiny-icon-close>
          </div>
        </div>
        <div class="model-wrap">
          <div class="model-groups">
            <model-select @model-select="getModel" :isShow="isShow"></model-select>
          </div>
          <div class="model-parameters">
            <tiny-grid :data="selectedModel?.parameters || []" min-height="296" max-height="560">
              <tiny-grid-column field="prop" title="字段名" width="180"> </tiny-grid-column>
              <tiny-grid-column field="label" title="标签名" show-overflow></tiny-grid-column>
              <tiny-grid-column field="originType" title="类型" show-overflow></tiny-grid-column>
            </tiny-grid>
          </div>
        </div>
        <template #reference>
          <tiny-button @click="openPopover">
            <span v-if="modelDetail?.name">
              {{ modelDetail?.name }}
            </span>
            <span v-else>选择模型</span>
          </tiny-button>
        </template>
      </tiny-popover>
    </div>
    <template v-if="modelDetail">
      <span class="meta-model-title"
        >模型字段（{{ modelDetail.parameters.length }}/{{ originModelData?.parameters?.length }}）</span
      >
      <div class="meta-array-wrap">
        <div class="meta-array-header">
          <tiny-checkbox
            label="未使用"
            key="unused"
            :indeterminate="isUnusedIndeterminate"
            :modelValue="checkAllUnused"
            @change="checkAllUnusedChange"
          >
          </tiny-checkbox>
          <span>{{ unusedParameters.length }}/{{ originModelData?.parameters?.length }}</span>
        </div>
        <span title="搜索">
          <tiny-search v-model="searchUnused" placeholder="请按名称搜索"></tiny-search>
        </span>
        <div class="fields-wrap">
          <vue-draggable-next
            :list="unusedParameters"
            :disabled="disableDrag"
            group="shared"
            handle=".tiny-svg-size"
            @change="dragEnd"
          >
            <div v-for="(item, index) in unusedParameters" :key="item.itemId" class="move-item">
              <meta-list-item
                v-if="item.label.includes(searchUnused)"
                :item="item"
                :index="index"
                :dataScource="itemsOptions"
                :currentIndex="state.currentIndex"
                :expand="expand"
                :enabledOperation="false"
              >
                <template #content>
                  <tiny-checkbox
                    :label="item.label || item.type"
                    :key="item.itemId"
                    :modelValue="!item.itemVisible"
                    @change="unusedChange($event, item)"
                  >
                  </tiny-checkbox>
                </template>
                <template #metaForm>
                  <meta-child-item
                    type="array"
                    :meta="meta"
                    :index="index"
                    :arrayIndex="state.currentIndex"
                    @update:modelValue="onValueChange(index, $event)"
                  ></meta-child-item>
                </template>
              </meta-list-item>
            </div>
          </vue-draggable-next>
        </div>
      </div>
      <div class="meta-filter-wrap">
        <div :class="['filter-item', { 'move-active': isUsedIndeterminate || checkAllUsed }]" @click="moveToUnused">
          <span title="移动到未使用"><shrink-icon class="tiny-svg-size icon-up-ward"></shrink-icon></span>
        </div>
        <div :class="['filter-item', { 'move-active': isUnusedIndeterminate || checkAllUnused }]" @click="moveToUsed">
          <span title="移动到已使用"><expand-icon class="tiny-svg-size icon-down-ward"></expand-icon></span>
        </div>
      </div>
      <div class="meta-array-wrap">
        <div class="meta-array-header">
          <tiny-checkbox
            label="已使用"
            key="used"
            :indeterminate="isUsedIndeterminate"
            :modelValue="checkAllUsed"
            @change="checkAllUsedChange"
          >
          </tiny-checkbox>
          <span>{{ modelDetail.parameters.length }}/{{ originModelData?.parameters?.length }}</span>
        </div>
        <span title="搜索">
          <tiny-search v-model="searchValue" placeholder="请按名称搜索"></tiny-search>
        </span>
        <div class="fields-wrap">
          <vue-draggable-next
            :list="modelDetail.parameters"
            :disabled="disableDrag"
            group="shared"
            handle=".tiny-svg-size"
            @change="dragEnd"
          >
            <div v-for="(item, index) in modelDetail.parameters" :key="item.itemId">
              <meta-list-item
                v-if="item.label.includes(searchValue)"
                :item="item"
                :index="index"
                :dataScource="itemsOptions"
                :currentIndex="state.currentIndex"
                :expand="expand"
                @changeItem="changeItem"
                @editItem="editItem"
              >
                <template #content>
                  <tiny-checkbox
                    :label="item.label || item.type"
                    :key="item.itemId"
                    :modelValue="!item.itemVisible"
                    @change="usedChange($event, item)"
                  >
                  </tiny-checkbox>
                </template>
                <template #metaForm>
                  <meta-child-item
                    type="array"
                    :meta="meta"
                    :index="index"
                    :arrayIndex="state.currentIndex"
                    @update:modelValue="onValueChange(index, $event)"
                  ></meta-child-item>
                </template>
              </meta-list-item>
            </div>
          </vue-draggable-next>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  Button as TinyButton,
  Search as TinySearch,
  Notify,
  Popover as TinyPopover,
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
  Checkbox as TinyCheckbox
} from '@opentiny/vue'
import { iconUpWard, iconDownWard, iconClose, iconEdit } from '@opentiny/vue-icon'
import { defineEmits, defineProps, ref, reactive, nextTick, computed, watch, onMounted } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'
import MetaListItem from './MetaListItem.vue'
import ModelSelect from '../model-common/ModelSelect.vue'
import MetaChildItem from '../operator-group-configurator/MetaChildItem.vue'
import { getModelList } from '../model-common/http'
import { handleSelectedModelParameters } from '../model-common/utils'

const props = defineProps({
  meta: {
    type: Object,
    default: () => {}
  },
  expand: {
    type: Boolean,
    default: false
  },
  disableDrag: {
    type: Boolean,
    default: false
  },
  // 协议类型
  renderType: {
    type: String,
    default: 'JSExpression'
  }
})
const emit = defineEmits(['update:modelValue'])

const shrinkIcon = iconUpWard()
const expandIcon = iconDownWard()
const TinyIconClose = iconClose()

const isShow = ref(false)

const searchUnused = ref('')
const searchValue = ref('')

const selectedModel = ref()
const originModelData = ref()

const getModel = (data) => {
  selectedModel.value = data
}

const modelDetail = ref(props.meta.widget.props.modelValue)

const unusedParameters = ref([])
// 已使用的列表是否全选
const checkAllUsed = computed(
  () => modelDetail.value.parameters.length > 0 && !modelDetail.value.parameters.some((item) => item.itemVisible)
)

// 已使用的列表是否半选
const isUsedIndeterminate = computed(
  () =>
    modelDetail.value.parameters.length > 0 &&
    !checkAllUsed.value &&
    modelDetail.value.parameters.some((item) => !item.itemVisible)
)

const checkAllUsedChange = (value) => {
  modelDetail.value.parameters.forEach((item) => (item.itemVisible = !value))
}
// 未使用的列表是否全选
const checkAllUnused = computed(
  () => unusedParameters.value.length > 0 && !unusedParameters.value.some((item) => item.itemVisible)
)
// 未使用的列表是否半选
const isUnusedIndeterminate = computed(
  () =>
    unusedParameters.value.length > 0 &&
    !checkAllUnused.value &&
    unusedParameters.value.some((item) => !item.itemVisible)
)

const checkAllUnusedChange = (value) => {
  unusedParameters.value.forEach((item) => (item.itemVisible = !value))
}

const itemsOptions = computed(() => ({
  valueField: 'prop',
  textField: props.meta.widget.props.textField || 'label',
  btnList: [
    {
      title: '编辑',
      type: 'edit',
      icon: iconEdit()
    }
  ],
  name: props.name,
  draggable: true
}))

const state = reactive({
  currentIndex: -1
})

const openPopover = () => {
  isShow.value = true
}

const closePopover = () => {
  isShow.value = false
}

// 选择模型
const setModel = async () => {
  if (!selectedModel.value) {
    return
  }
  emit('update:modelValue', selectedModel.value)
  Notify({
    type: 'success',
    message: '选择模型成功',
    position: 'top-right'
  })
  closePopover()
}

const editItem = (data) => {
  state.currentIndex = data.index
}

const updatedColumns = () => {
  emit('update:modelValue', modelDetail.value)
}

const changeItem = (item) => {
  modelDetail.value.parameters[item.index] = item.data
  updatedColumns()
}

const unusedChange = (value, item) => {
  item.itemVisible = !value
}

const usedChange = (value, item) => {
  item.itemVisible = !value
}
// 移动到未使用列表
const moveToUnused = () => {
  const checkedList = modelDetail.value.parameters.filter((item) => !item.itemVisible)
  modelDetail.value.parameters = modelDetail.value.parameters.filter((item) => item.itemVisible)
  checkedList.forEach((item) => {
    item.itemVisible = true
    unusedParameters.value.push(item)
  })
  checkAllUsed.value = false
  nextTick(() => {
    updatedColumns()
  })
}

// 移动到正在使用列表
const moveToUsed = () => {
  const checkedList = unusedParameters.value.filter((item) => !item.itemVisible)
  unusedParameters.value = unusedParameters.value.filter((item) => item.itemVisible)
  checkedList.forEach((item) => {
    item.itemVisible = true
    modelDetail.value.parameters.push(item)
  })
  checkAllUnused.value = false
  nextTick(() => {
    updatedColumns()
  })
}

const onValueChange = (index, { propertyKey, propertyValue }) => {
  if ([null, undefined, ''].includes(propertyValue)) {
    delete modelDetail.value.parameters[index][propertyKey]
  } else {
    modelDetail.value.parameters[index][propertyKey] = propertyValue
  }
  updatedColumns()
}

const dragEnd = () => {
  updatedColumns()
}

watch(
  () => props.meta.widget.props.modelValue,
  (value) => {
    if (value) {
      modelDetail.value = value
      originModelData.value = value
    }
  }
)

onMounted(() => {
  if (modelDetail.value) {
    getModelList(1, { nameCn: modelDetail.value.name }).then(async (res) => {
      originModelData.value = res.records[0]
      originModelData.value = await handleSelectedModelParameters(originModelData.value)
      unusedParameters.value = originModelData.value.parameters.filter((item) => {
        if (modelDetail.value.parameters.find((usedParams) => usedParams.prop === item.prop)) {
          return false
        }
        return true
      })
    })
  }
})
</script>

<style lang="less" scoped>
.model-container {
  width: 100%;
  line-height: 28px;
  background-color: var(--ti-lowcode-input-bg);
  &:hover {
    cursor: pointer;
  }
  .model-name-warp {
    border: 1px solid var(--ti-lowcode-component-input-border-color);
  }
  .meta-model-title {
    color: #808080;
  }
  .meta-array-wrap {
    font-size: 12px;
    border: 1px solid #dbdbdb;
    border-radius: 4px;
    display: block;
    :deep(.tiny-search) {
      padding: 0 10px;
      .tiny-search__line {
        border: none;
        border-radius: 0;
        border-bottom: 1px solid var(--ti-search-input-border-color);
      }
    }
    .meta-array-header {
      height: 28px;
      border-bottom: 1px solid #dbdbdb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 10px;
    }
    .fields-wrap {
      min-height: 28px;
      max-height: 132px;
      overflow-y: scroll;

      .move-item {
        width: 100%;
      }
    }
  }
  .meta-filter-wrap {
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
    .filter-item {
      background-color: #f0f0f0;
      border: 1px solid #dbdbdb;
      border-radius: 4px;
      width: 20px;
      height: 20px;
      text-align: center;
      margin: 10px 0;
      cursor: pointer;
      svg {
        margin-top: -12px;
      }
      .icon-down-ward {
        padding: 1px;
      }
    }

    .move-active {
      background: var(--te-component-config-item-bind-bg-color);
      border: 1px solid var(--te-component-config-item-bind-border-color);

      .tiny-svg-size {
        fill: var(--te-component-common-text-color-emphasize);
      }
    }
  }
  .add {
    display: flex;
    align-items: center;
    color: var(--te-configurator-common-text-color-emphasize);
    &:hover {
      cursor: pointer;
    }

    & .icon-plus {
      font-size: 14px;
      margin-right: 5px;
    }
  }
}
.model-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0 20px 0;

  .right {
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
.model-wrap {
  display: flex;
  min-height: 320px;
  max-height: 585px;
  margin-bottom: 20px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  .model-groups {
    width: 380px;
    padding: 12px;
    border-right: 1px solid #e6e6e6;
  }
  .model-parameters {
    width: 380px;
    padding: 12px;
  }
}
</style>
