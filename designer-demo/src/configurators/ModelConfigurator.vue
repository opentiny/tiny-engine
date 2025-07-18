<template>
  <div class="model-container">
    <div v-if="bindVisible" class="model-name-warp">
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
            <tiny-button type="primary" plain @click="setModel">
              确认
            </tiny-button>
            <tiny-icon-close
              class="tiny-svg-size"
              @click="closePopover"
            ></tiny-icon-close>
          </div>
        </div>
        <div class="model-wrap">
          <div class="model-groups">
            <model-select
              @model-select="getModel"
              :meta="meta"
              :isShow="isShow"
            ></model-select>
          </div>
          <div class="model-parameters">
            <tiny-grid
              :data="
                (selectedModel?.value || []).concat(selectedModel?.unused || [])
              "
              :loading="gridLoading"
              min-height="296"
              max-height="560"
            >
              <tiny-grid-column title="字段名" width="180">
                <template #default="data">
                  <div class="field-prop">
                    <tiny-tag
                      v-if="data.row.category"
                      type="info"
                      effect="plain"
                      >扩展</tiny-tag
                    >
                    <span>{{ data.row.prop }}</span>
                  </div>
                </template>
              </tiny-grid-column>
              <tiny-grid-column
                field="label"
                title="标签名"
                show-overflow
              ></tiny-grid-column>
              <tiny-grid-column
                field="originType"
                title="类型"
                show-overflow
              ></tiny-grid-column>
            </tiny-grid>
          </div>
        </div>
        <template #reference>
          <tiny-button @click="openPopover">
            <span v-if="modelDetail?.label">
              {{ modelDetail?.label }}
            </span>
            <span v-else>选择模型</span>
          </tiny-button>
        </template>
      </tiny-popover>
    </div>
    <template v-if="modelDetail">
      <span class="meta-model-title"
        >模型字段（{{ modelDetail.value.length }}/{{
          modelDetail?.value?.length + modelDetail?.unused?.length
        }}）</span
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
          <span
            >{{ modelDetail.unused.length }}/{{
              modelDetail.value.length + modelDetail.unused.length
            }}</span
          >
        </div>
        <span title="搜索">
          <tiny-search
            v-model="searchUnused"
            placeholder="请按名称搜索"
          ></tiny-search>
        </span>
        <div class="fields-wrap">
          <vue-draggable-next
            :list="modelDetail.unused"
            :disabled="disableDrag"
            group="shared"
            handle=".tiny-svg-size"
            @change="dragEnd"
          >
            <div
              v-for="(item, index) in modelDetail.unused"
              :key="item.itemId"
              class="move-item"
            >
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
        <div
          :class="[
            'filter-item',
            { 'move-active': isUsedIndeterminate || checkAllUsed },
          ]"
          @click="moveToUnused"
        >
          <span title="移动到未使用"
            ><shrink-icon class="tiny-svg-size icon-up-ward"></shrink-icon
          ></span>
        </div>
        <div
          :class="[
            'filter-item',
            { 'move-active': isUnusedIndeterminate || checkAllUnused },
          ]"
          @click="moveToUsed"
        >
          <span title="移动到已使用"
            ><expand-icon class="tiny-svg-size icon-down-ward"></expand-icon
          ></span>
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
          <span
            >{{ modelDetail.value.length }}/{{
              modelDetail.value.length + modelDetail.unused.length
            }}</span
          >
        </div>
        <span title="搜索">
          <tiny-search
            v-model="searchValue"
            placeholder="请按名称搜索"
          ></tiny-search>
        </span>
        <div class="fields-wrap">
          <vue-draggable-next
            :list="modelDetail.value"
            :disabled="disableDrag"
            group="shared"
            handle=".tiny-svg-size"
            @change="dragEnd"
          >
            <div v-for="(item, index) in modelDetail.value" :key="item.itemId">
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
  Checkbox as TinyCheckbox,
  Tag as TinyTag,
} from "@opentiny/vue";
import {
  iconUpWard,
  iconDownWard,
  iconClose,
  iconEdit,
} from "@opentiny/vue-icon";
import {
  defineEmits,
  defineProps,
  ref,
  reactive,
  nextTick,
  computed,
  watch,
} from "vue";
import { useCanvas, useModal, HttpService } from "@opentiny/tiny-engine";
import MetaListItem from "./MetaListItem.vue";
import ModelSelect from "../common/ModelSelect.vue";
import { typeComponentsMap, modelType } from "../common/constants.js";
import { setFormModelCondition } from "../common/utils.js";
import MetaChildItem from "../operator-group-configurator/MetaChildItem.vue";
import { VueDraggableNext } from "vue-draggable-next";

const props = defineProps({
  meta: {
    type: Object,
    default: () => {},
  },
  expand: {
    type: Boolean,
    default: false,
  },
  disableDrag: {
    type: Boolean,
    default: false,
  },
});
const { confirm } = useModal();
const { getCurrentSchema, getPageSchema } = useCanvas();
const emit = defineEmits(["update:modelValue"]);
const appId = ref();

const shrinkIcon = iconUpWard();
const expandIcon = iconDownWard();
const TinyIconClose = iconClose();

const isShow = ref(false);
const gridLoading = ref(false);

const selectedModel = ref();
const searchUnused = ref("");
const searchValue = ref("");
const handleFormItemRules = (rules) => {
  if (!rules) {
    return [];
  }
  return rules.map((item) => {
    if (item.type === "enum") {
      item.enum = item.value.map((valueField) => valueField.alias);
      delete item.value;
    }
    return item;
  });
};
const getModelParams = (checkLastVersion) => {
  if (!appId.value) {
    return;
  }
  HttpService.apis
    .get(
      `basic/xdm/module/getAllAttribute/${
        appId.value
      }/${selectedModel.value.nameEn}?version=${
        checkLastVersion ? "" : selectedModel.value.modelVersion
      }`
    )
    .then((res) => {
      if (res) {
        selectedModel.value.value =
          res.map((item) => {
            item.originType = item.type;
            delete item.type;
            if (item?.enumValueList) {
              item.options = item.enumValueList;
              delete item.enumValueList;
            }
            return {
              ...item,
              prop: item.runTimeName,
              rules: handleFormItemRules(item?.rules),
              isVisible: false,
              itemVisible: true,
              componentName:
                typeComponentsMap?.[item.originType]?.component || "TinyInput",
              ...typeComponentsMap?.[item.originType]?.props,
            };
          }) || [];
        selectedModel.value.unused = [];
      }
      gridLoading.value = false;
    })
    .catch(() => (gridLoading.value = false));
};

const checkModelVersion = async () => {
  if (!appId.value) {
    return null;
  }
  return await HttpService.apis.post(
    `basic/xdm/module/checkModelVersion`,
    {
      applicationId: appId.value,
      name: selectedModel.value.nameEn,
      version: selectedModel.value.modelVersion,
    }
  );
};

const setModelExpose = () => {
  const currentSchema = getCurrentSchema();
  const pageSchema = getPageSchema();
  if (currentSchema.componentType === modelType.FORM) {
    const modelValue = {};
    selectedModel.value.value.forEach((formItem) => {
      modelValue[formItem.prop] = formItem.defaultValue;
    });
    pageSchema.state[`modelState_${currentSchema.id}`] = {
      modelValue,
    };
  } else if (currentSchema.componentType === modelType.TABLE) {
    pageSchema.state[`modelState_${currentSchema.id}`] = {
      pager: {
        currentPage: 1,
        pageSize: 5,
        total: 0,
        pageSizes: [5, 10, 20, 50],
        layout: "total, sizes, prev, pager, next, jumper",
      },
      modelValue: [],
      detail: {},
    };
    currentSchema.props.pager = {
      type: "JSExpression",
      value: `this.state.modelState_${currentSchema.id}.pager`,
    };
  }
  currentSchema.props.modelValue = {
    type: "JSExpression",
    value: `this.state.modelState_${currentSchema.id}.modelValue`,
    model: true,
  };
};

const updateModelState = () => {
  const currentSchema = getCurrentSchema();
  const pageSchema = getPageSchema();
  if (currentSchema.componentType === modelType.FORM) {
    const modelValue = {};
    modelDetail.value.value.forEach((usedItem) => {
      modelValue[usedItem.prop] = usedItem?.defaultValue || null;
    });
    pageSchema.state[`modelState_${currentSchema.id}`].modelValue = modelValue;
  }
};
// 选择模型
const setModel = async () => {
  if (!selectedModel.value) {
    return;
  }
  const updateModel = () => {
    setModelExpose();
    nextTick(() => {
      emit("update:modelValue", {
        id: selectedModel.value.id,
        name: selectedModel.value.name,
        description: selectedModel.value.description,
        config: {
          modelApplicationId: appId.value,
          modelNameEn: selectedModel.value.nameEn,
          modelVersion: selectedModel.value.modelVersion,
        },
        value: selectedModel.value.value,
        unused: selectedModel.value.unused,
      });
    });
    Notify({
      type: "success",
      message: "选择模型成功",
      position: "top-right",
    });
    closePopover();
  };
  // 判断是否有版本更新
  const isLastVersion = await checkModelVersion();
  if (!isLastVersion) {
    updateModel();
  } else {
    confirm({
      title: "提示",
      status: "custom",
      message: "当前模型有新版本发布，是否使用最新版本？",
      async exec() {
        // 直接使用新版本的字段
        await getModelParams(true);
        updateModel();
      },
      cancel() {
        updateModel();
      },
    });
  }
};

const getModel = (data) => {
  appId.value = data.appId;
  selectedModel.value = data.modelData;
  // 如果已选择模型，则展示已选择模型的字段
  if (
    modelDetail.value &&
    selectedModel.value.id === modelDetail.value.id &&
    selectedModel.value.modelVersion === modelDetail.value.config.modelVersion
  ) {
    selectedModel.value = modelDetail.value;
  } else {
    gridLoading.value = true;
    getModelParams();
  }
};

const modelDetail = ref(props.meta.widget.props.modelValue);

const bindVisible = computed(() => {
  if (modelDetail.value) {
    return "bindVisible" in modelDetail.value
      ? modelDetail.value.bindVisible
      : true;
  }
  return true;
});
// 已使用的列表是否全选
const checkAllUsed = computed(
  () =>
    modelDetail.value.value.length > 0 &&
    !modelDetail.value.value.some((item) => item.itemVisible)
);

// 已使用的列表是否半选
const isUsedIndeterminate = computed(
  () =>
    modelDetail.value.value.length > 0 &&
    !checkAllUsed.value &&
    modelDetail.value.value.some((item) => !item.itemVisible)
);

const checkAllUsedChange = (value) => {
  modelDetail.value.value.forEach((item) => (item.itemVisible = !value));
};
// 未使用的列表是否全选
const checkAllUnused = computed(
  () =>
    modelDetail.value.unused.length > 0 &&
    !modelDetail.value.unused.some((item) => item.itemVisible)
);
// 未使用的列表是否半选
const isUnusedIndeterminate = computed(
  () =>
    modelDetail.value.unused.length > 0 &&
    !checkAllUnused.value &&
    modelDetail.value.unused.some((item) => !item.itemVisible)
);
const checkAllUnusedChange = (value) => {
  modelDetail.value.unused.forEach((item) => (item.itemVisible = !value));
};

const itemsOptions = computed(() => ({
  valueField: "prop",
  textField: props.meta.widget.props.textField || "value",
  btnList: [
    {
      title: "编辑",
      type: "edit",
      icon: iconEdit(),
    },
  ],
  name: props.name,
  draggable: true,
}));

const state = reactive({
  currentIndex: -1,
});

const openPopover = () => {
  isShow.value = true;
};

const closePopover = () => {
  isShow.value = false;
};

const editItem = (data) => {
  state.currentIndex = data.index;
};

const updatedColumns = () => {
  emit("update:modelValue", modelDetail.value);
};

const changeItem = (item) => {
  modelDetail.value.value[item.index] = item.data;
  updatedColumns();
};

const unusedChange = (value, item) => {
  item.itemVisible = !value;
};

const usedChange = (value, item) => {
  item.itemVisible = !value;
};
// 移动到未使用列表
const moveToUnused = () => {
  const checkedList = modelDetail.value.value.filter(
    (item) => !item.itemVisible
  );
  modelDetail.value.value = modelDetail.value.value.filter(
    (item) => item.itemVisible
  );
  checkedList.forEach((item) => {
    item.itemVisible = true;
    modelDetail.value.unused.push(item);
  });
  checkAllUsed.value = false;
  nextTick(() => {
    updatedColumns();
    updateModelState();
    setFormModelCondition();
  });
};

// 移动到正在使用列表
const moveToUsed = () => {
  const checkedList = modelDetail.value.unused.filter(
    (item) => !item.itemVisible
  );
  modelDetail.value.unused = modelDetail.value.unused.filter(
    (item) => item.itemVisible
  );
  checkedList.forEach((item) => {
    item.itemVisible = true;
    modelDetail.value.value.push(item);
  });
  checkAllUnused.value = false;
  nextTick(() => {
    updatedColumns();
    updateModelState();
    setFormModelCondition();
  });
};

const onValueChange = (index, { propertyKey, propertyValue }) => {
  if ([null, undefined, ""].includes(propertyValue)) {
    delete modelDetail.value.value[index][propertyKey];
  } else {
    modelDetail.value.value[index][propertyKey] = propertyValue;
  }
  updatedColumns();
};

const dragEnd = () => {
  updatedColumns();
  updateModelState();
  setFormModelCondition();
};

watch(
  () => props.meta.widget.props.modelValue,
  (value) => {
    if (value) {
      modelDetail.value = value;
    }
  }
);
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
    padding-bottom: 10px;
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
    .field-prop {
      display: flex;
      gap: 4px;
      align-items: center;
    }
  }
}
</style>
