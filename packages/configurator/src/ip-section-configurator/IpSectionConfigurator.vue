<template>
  <div class="meta-ip-section">
    <tiny-form>
      <tiny-form-item v-for="(item, index) in state.configs" :key="index">
        <tiny-select
          v-if="item.options"
          ref="selectRef"
          v-model="state.ipArray[index]"
          :disabled="item.disabled"
          placeholder=""
          filterable
          @update:modelValue="ipChange"
        >
          <tiny-option
            v-for="(optionItem, optionIndex) in item.options"
            :key="optionIndex"
            :label="optionItem"
            :value="optionItem"
          ></tiny-option>
        </tiny-select>
        <tiny-tooltip
          v-else
          class="item"
          effect="light"
          :content="item.tip || ''"
          placement="top"
          :disabled="!item.tip"
        >
          <tiny-input v-model="state.ipArray[index]" :disabled="item.disabled" @update:modelValue="ipChange">
          </tiny-input>
        </tiny-tooltip>
        <span v-if="index < 3" class="spot">·</span>
        <span v-if="index === 3 && state.configs.length === 5" class="line">/</span>
      </tiny-form-item>
    </tiny-form>
    <ul v-if="configsGroup.length" class="proposal">
      {{
        $t('common.proposal')
      }}
      <li v-for="(item, index) in configsGroup" :key="index" class="proposal-item">
        {{ item.ipLabel || '' }}
        (<span class="proposal-select" @click="selectProposal(item)">{{ $t('common.select') }}</span
        >)
      </li>
    </ul>
  </div>
</template>

<script>
import { reactive, computed, ref, watch } from 'vue'
import { Input, Form, FormItem, Select, Option, Tooltip } from '@opentiny/vue'

export default {
  name: 'IpSectionConfigurator',
  components: {
    TinyInput: Input,
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinySelect: Select,
    TinyOption: Option,
    TinyTooltip: Tooltip
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    configs: {
      type: Array,
      default: () => []
    },
    configsGroup: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const selectRef = ref(null)

    const state = reactive({
      configs: props.configs,
      ipArray: props.modelValue ? props.modelValue.replace(/\//, '.').split('.') : []
    })

    // 输出ip
    const ipValue = computed(() => {
      let ip = state.ipArray.join('.')
      if (state.ipArray.length > 4) {
        ip = ip.replace(/(.*)\./, '$1/')
      }

      return ip
    })

    const ipChange = () => {
      const emitData = state.ipArray.every((item) => item) ? ipValue.value : ''
      emit('update:modelValue', emitData)
    }

    const selectProposal = (proposalConfigs) => {
      state.ipArray = proposalConfigs.ipValue ? proposalConfigs.ipValue.replace(/\//, '.').split('.') : []
      ipChange()
    }

    watch(
      () => props.configs,
      (val) => {
        state.configs = val
      }
    )

    return {
      state,
      ipChange,
      selectProposal,
      selectRef
    }
  }
}
</script>

<style lang="less" scoped>
.meta-ip-section {
  :deep(.tiny-form) {
    display: flex;
    .tiny-form-item {
      flex: 1;
      margin-bottom: 0;
      position: relative;
      .spot,
      .line {
        position: absolute;
        top: 30%;
        right: -7px;
      }
      .spot {
        font-weight: 600;
      }
      .tiny-form-item__content {
        margin-left: 0 !important;
        margin-right: 10px;
      }
      .tiny-input {
        margin-right: 10px;
      }
      .tiny-select {
        .tiny-input__inner {
          padding-right: 0 !important;
        }
        .tiny-input__suffix {
          right: 3px;
        }
        .tiny-input__suffix-inner {
          width: 8px;
          height: 8px;
        }
      }
    }
  }
  .proposal {
    margin-top: 6px;
    color: var(--ti-lowcode-flowchart-ip-proposal-color);
    font-size: 12px;
    .proposal-item {
      line-height: 20px;
      height: 20px;
      .proposal-select {
        color: var(--ti-lowcode-flowchart-ip-proposal-select);
        cursor: pointer;
      }
    }
  }
}
</style>
