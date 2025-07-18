<template>
  <tiny-popover
    placement="bottom-start"
    trigger="manual"
    v-model="isShow"
    :visible-arrow="false"
    :popper-class="['option-popper', 'fixed-left']"
    :offset="isSecond ? 652 : 0"
    width="860"
  >
    <div class="model-function-wrap">
      <div class="model-title">
        <span>选择模型方法</span>
        <div class="right">
          <tiny-button @click="closePopover">取消</tiny-button>
          <tiny-button type="primary" @click="setModelFunction"
            >确定</tiny-button
          >
          <tiny-icon-close
            class="tiny-svg-size"
            @click="closePopover"
          ></tiny-icon-close>
        </div>
      </div>
      <div class="model-set-wrap">
        <div class="model-wrap">
          <div class="model-groups">
            <model-select
              :model-page-size="5"
              @model-select="getModel"
              :meta="meta"
              :isShow="isShow"
            ></model-select>
          </div>
          <div class="model-parameters">
            <tiny-grid
              :data="modelFunctions || []"
              :loading="gridLoading"
              min-height="116"
              max-height="330"
              @radio-change="selectModelFunction"
            >
              <tiny-grid-column type="radio" width="40"></tiny-grid-column>
              <tiny-grid-column
                field="apiName"
                title="方法名称"
                show-overflow
              ></tiny-grid-column>
              <tiny-grid-column
                field="apiDescription"
                title="方法描述"
                show-overflow
              ></tiny-grid-column>
            </tiny-grid>
          </div>
        </div>
        <div class="model-param-wrap" v-if="selectedFunction">
          <tiny-collapse v-model="activeNames">
            <tiny-collapse-item title="入参配置" name="request">
              <params-bind-grid
                ref="gridRequest"
                :data="selectedFunction?.fields?.request || []"
                :model-fields="selectedModel?.params || []"
                :type="'request'"
              ></params-bind-grid>
            </tiny-collapse-item>
            <tiny-collapse-item title="出参配置" name="response">
              <params-bind-grid
                ref="gridResponse"
                :data="selectedFunction?.fields?.response || []"
                :model-fields="selectedModel?.params || []"
                :type="'response'"
              ></params-bind-grid>
            </tiny-collapse-item>
          </tiny-collapse>
        </div>
      </div>
    </div>
  </tiny-popover>
  <tiny-button @click="openPopover">{{
    buttonText
  }}</tiny-button>
</template>
<script setup>
import { ref, defineProps, defineEmits } from "vue";
import {
  Button as TinyButton,
  Popover as TinyPopover,
  Collapse as TinyCollapse,
  CollapseItem as TinyCollapseItem,
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
} from "@opentiny/vue";
import { iconClose } from "@opentiny/vue-icon";
import { HttpService, useCanvas } from "@opentiny/tiny-engine";
import ModelSelect from "../common/ModelSelect.vue";
import ParamsBindGrid from "../model-api-configurator/ParamsBindGrid.vue";
import { transformNode } from "../common/utils";

const props = defineProps({
  meta: {
    type: Object,
    default: () => ({}),
  },
  buttonText: {
    type: String,
    default: "绑定模型方法",
  },
  // 协议类型
  renderType: {
    type: String,
    default: "JSExpression",
  },
  isFunction: {
    type: Boolean,
    default: true,
  },
  // 是否是二级面板
  isSecond: {
    type: Boolean,
    default: false,
  },
  // 是否引入model的url等
  isShowModelDetail: {
    type: Boolean,
    default: true,
  },
});
const emit = defineEmits(["update:modelValue"]);
const { getPageSchema } = useCanvas();
const pageSchema = getPageSchema();
const TinyIconClose = iconClose();
const isShow = ref(false);
const gridLoading = ref(false);
const modelValue = ref(props.meta.widget.props.modelValue);
const activeNames = ref(["request", "response"]);

const gridRequest = ref();
const gridResponse = ref();

const selectedModel = ref();
const modelFunctions = ref([]);
const selectedFunction = ref();

const openPopover = () => {
  isShow.value = true;
};

const closePopover = () => {
  isShow.value = false;
};

const getModel = (data) => {
  gridLoading.value = true;
  selectedModel.value = data;
};

const modelDataToSchema = (modelData, resultValue) => {
  modelData.forEach((item) => {
    if (item.bindValue) {
      resultValue[item.prop] = item.bindValue;
      return;
    }
    if (item.children) {
      resultValue[item.prop] = {};
      modelDataToSchema(item.children, resultValue[item.prop]);
    }
  });
};

const setModelFunction = async () => {
  if (!selectedModel.value || !selectedFunction.value) {
    return;
  }
  const requsetFormValid = await gridRequest.value.validateForm();
  const responseFormValid = await gridResponse.value.validateForm();
  if (!("modelApis" in pageSchema)) {
    pageSchema.modelApis = {};
  }
  if (requsetFormValid && responseFormValid) {
    const requestBindResult = gridRequest.value.getData();
    const responseBindResult = gridResponse.value.getData();
    const apiKeys = Object.keys(pageSchema.modelApis);
    const apiIndex =
      apiKeys.filter((key) => /^api\d+$/.test(key)).length > 0
        ? Math.max(
            ...apiKeys
              .filter((str) => /^api\d+$/.test(str))
              .map((str) => parseInt(str.replace(/^api/, ""), 10))
          ) + 1
        : 1;
    const methodKeys = Object.keys(pageSchema.methods);
    const methodIndex =
      methodKeys.filter((key) => /^onModelApiMethod\d+$/.test(key)).length > 0
        ? Math.max(
            ...methodKeys
              .filter((str) => /^onModelApiMethod\d+$/.test(str))
              .map((str) => parseInt(str.replace(/^onModelApiMethod/, ""), 10))
          ) + 1
        : 1;
    let methodName = `onModelApiMethod${methodIndex}`;
    let apiName = `api${apiIndex}`;
    // 如果是重新绑定
    if (modelValue.value) {
      methodName = modelValue?.methodName || '';
      apiName = modelValue.apiName
    }
    // 处理映射关系
    let updateValue = {
      type: props.renderType,
      value: `this.modelApis.${apiName}`,
      apiName: apiName,
    };
    // 生成方法
    if (props.isFunction) {
      pageSchema.methods[
        `${methodName}`
      ] = {
        type: 'JSFunction',
        value: `function ${methodName}() {\n this.modelApis.${apiName}();\n}`
      };
      updateValue = {
        type: props.renderType,
        value: `this.${methodName}`,
        methodName: `${methodName}`,
        apiName: apiName,
      };
    }
    const result = {
      config: {
        modelApplicationId: selectedModel.value.appId,
        modelNameEn: selectedModel.value.modelData.nameEn,
        modelVersion: selectedModel.value.modelData.modelVersion,
      },
      name: selectedFunction.value.name,
      request: {},
      response: {},
    };
    if (props.isShowModelDetail) {
      result.method = selectedFunction.value.method;
      result.url = selectedFunction.value.url;
      result.headers = selectedFunction.value.headers || {};
    }
    modelDataToSchema(requestBindResult, result.request);
    modelDataToSchema(responseBindResult, result.response);
    pageSchema.modelApis[`${apiName}`] = result;
    useCanvas().canvasApi.value.updateRect();
    emit("update:modelValue", updateValue);
    closePopover();
  }
};

const selectModelFunction = (data) => {
  selectedFunction.value = data.row;
};
</script>

<style lang="less" scoped>
.model-function-wrap {
  overflow-y: scroll;
  height: 100%;
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
  .model-set-wrap {
    .model-wrap {
      display: flex;
      min-height: 140px;
      max-height: 355px;
      border: 1px solid #e6e6e6;
      border-radius: 4px;
      .model-groups {
        width: 410px;
        padding: 12px;
        border-right: 1px solid #e6e6e6;
        :deep(.tiny-tree) {
          .tiny-tree-node__content .tiny-tree-node__content-left {
            padding: 0;
            .tiny-tree-node__label {
              color: #191919;
            }
          }
          .tiny-tree-node__children .tiny-tree-node__content {
            padding: 0;
            .tiny-tree-node__content-left .tiny-tree-node__label {
              color: #595959;
            }
          }
        }
        .search {
          margin-bottom: 12px;
        }
      }
      .model-parameters {
        width: 412px;
        padding: 12px;
        overflow-y: scroll;
        &::-webkit-scrollbar {
          display: none;
        }
        div {
          border-bottom: 1px solid #f5f5f5;
        }
        span {
          padding-left: 12px;
          display: inline-block;
          width: 180px;
        }
        .title {
          height: 24px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          span:first-child {
            border-right: 1px solid #dbdbdb;
          }
        }
        .list-items {
          height: 30px;
          line-height: 30px;
          display: flex;
          align-items: center;
        }
      }
    }
  }
}
</style>
