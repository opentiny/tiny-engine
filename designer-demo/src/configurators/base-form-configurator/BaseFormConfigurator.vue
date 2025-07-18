<template>
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
          <model-select @model-select="getModel" :meta="meta"></model-select>
        </div>
        <div class="model-parameters">
          <tiny-grid :data="selectedModel?.value || []" :loading="gridLoading">
            <tiny-grid-column title="字段名" width="180">
              <template #default="data">
                <div class="field-prop">
                  <tiny-tag v-if="data.row.category" type="info" effect="plain"
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
  <div v-if="modelDetail && searchForm?.length" class="search-form-wrap">
    <div v-for="(item, index) in searchForm" :key="item.id">
      <div class="search-form-item">
        <span>{{ item.children[0].props?.label || "操作" }}</span>
        <span :title="item?.condition === false ? '可搜索' : '不可搜索'">
          <tiny-icon-clear-filter
            v-if="item?.condition === false"
            @click="setItemSearchable(index, true)"
          ></tiny-icon-clear-filter>
          <tiny-icon-filter
            v-else
            @click="setItemSearchable(index, false)"
          ></tiny-icon-filter>
        </span>
      </div>
    </div>
  </div>
</template>
<script setup>
import {
  Button as TinyButton,
  Popover as TinyPopover,
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
  Tag as TinyTag,
  Notify,
} from "@opentiny/vue";
import { iconClose, iconFilter, iconClearFilter } from "@opentiny/vue-icon";
import { defineEmits, defineProps, ref, computed, watch } from "vue";
import { useCanvas, HttpService } from "@opentiny/tiny-engine";
import { utils } from "@opentiny/tiny-engine-utils";
import ModelSelect from "../common/ModelSelect.vue";
import { typeComponentsMap } from "../common/constants.js";

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

const { getCurrentSchema, getPageSchema } = useCanvas();
const emit = defineEmits(["update:modelValue"]);
const appId = ref();
const TinyIconClose = iconClose();
const TinyIconFilter = iconFilter();
const TinyIconClearFilter = iconClearFilter();
const isShow = ref(false);
const gridLoading = ref(false);
const selectedModel = ref();
const currentSchema = getCurrentSchema();
const pageSchema = getPageSchema();
const { operateNode } = useCanvas();
const modelDetail = ref(props.meta.widget.props.modelValue);
const searchForm = computed(() => {
  return modelDetail.value ? currentSchema.children[0]?.children : [];
});

const openPopover = () => {
  isShow.value = true;
};

const closePopover = () => {
  isShow.value = false;
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

const getModel = (data) => {
  gridLoading.value = true;
  appId.value = data.appId;
  selectedModel.value = data.modelData;
  getModelParams();
};

const generateFormSchema = () => {
  return {
    componentName: "TinyForm",
    props: {
      labelWidth: "130px",
      labelPosition: "left",
      className: "component-base-style",
    },
    children: selectedModel.value.value
      .map((item) => {
        const formItem = {
          componentName: "TinyCol",
          props: {
            span: "6",
          },
          children: [
            {
              componentName: "TinyFormItem",
              props: {
                ...item
              },
              children: [
                {
                  componentName: item.componentName,
                  props: {
                    modelValue: {
                      type: "JSExpression",
                      value: `this.state.modelState_${currentSchema.id}.modelValue.${item.prop}`,
                      model: true,
                    },
                  },
                  id: utils.guid(),
                },
              ],
              id: utils.guid(),
            },
          ],
          id: utils.guid(),
        };
        return formItem;
      })
      .concat([
        {
          componentName: "TinyCol",
          props: {
            span: "12",
          },
          children: [
            {
              componentName: "TinyFormItem",
              props: {},
              children: [
                {
                  componentName: "TinyButton",
                  props: {
                    text: "确定",
                    type: "primary",
                    style: "margin-right: 10px",
                  },
                  id: utils.guid(),
                },
                {
                  componentName: "TinyButton",
                  props: {
                    text: "取消",
                  },
                  id: utils.guid(),
                },
              ],
              id: utils.guid(),
            },
          ],
          id: utils.guid(),
        },
      ]),
    id: utils.guid(),
  };
};

const setModelState = () => {
  const formModelData = Object.fromEntries(
    selectedModel.value.value.map((item) => [item.prop.toLowerCase(), null])
  );
  return {
    modelValue: formModelData,
  };
};

const setModel = async () => {
  if (
    currentSchema.props?.serviceModel?.id &&
    currentSchema.props?.serviceModel?.id === selectedModel.value.id
  ) {
    Notify({
      type: "error",
      message: "已选择当前选择模型",
      position: "top-right",
    });
    return;
  }
  // 重新设置模型时先清空原数模型据
  if (currentSchema.children.length) {
    currentSchema.children = [];
  }
  const modelState = setModelState();
  pageSchema.state[`modelState_${currentSchema.id}`] = modelState;
  pageSchema.modelApis = {};

  const formSchema = generateFormSchema();
  currentSchema.children.push(formSchema);
  operateNode({
    type: "updateAttributes",
    id: currentSchema.id,
    value: { children: currentSchema.children },
  });
  useCanvas().canvasApi.value.updateRect();
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
  Notify({
    type: "success",
    message: "选择模型成功",
    position: "top-right",
  });
  closePopover();
};

const setItemSearchable = (index, condition) => {
  const currentItem = currentSchema.children[0].children[index];
  const prop = currentItem.children[0].props.prop;
  // 同时设置search state
  // 显示时，如果没有该属性，则初始化为null
  const searchState = pageSchema.state[`modelState_${currentSchema.id}`].modelValue;
  if (condition === true && !searchState?.[prop]) {
    searchState[prop] = null;
  }
  // 隐藏时，如果有该属性且值不为null，则删除该字段
  if (condition === false && prop in searchState) {
    delete searchState[prop];
  }
  operateNode({
    type: "updateAttributes",
    id: currentItem.id,
    value: { condition },
  });
  useCanvas().canvasApi.value.updateRect();
};

// 监听并更新布局
watch(
  () => currentSchema.props?.layout,
  (value) => {
    if (value) {
      currentSchema.children[0].children.forEach((item, index) => {
        if (
          item.componentName === "TinyCol" &&
          index < currentSchema.children[0].children.length - 1
        ) {
          operateNode({
            type: "updateAttributes",
            id: item.id,
            value: { props: { span: 12 / parseInt(value, 10) } },
          });
        }
      });
      useCanvas().canvasApi.value.updateRect();
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
    overflow-y: scroll;

    .field-prop {
      display: flex;
      gap: 4px;
      align-items: center;
    }
  }
}

.search-form-wrap {
  margin-top: 10px;
  border-top: 1px solid #f5f5f5;
  .search-form-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 10px;
    border-bottom: 1px solid #f5f5f5;

    svg {
      font-size: 14px;
      cursor: pointer;
    }
  }
}
</style>
