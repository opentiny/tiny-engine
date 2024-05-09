<template>
  <div ref="languageContent" class="languageContent">
    <div v-show="!showEditItem">
      <tiny-select
        ref="selectRef"
        v-model="selectValue"
        placeholder="请根据显示值搜索"
        filterable
        :filter-method="filterMethod"
        @change="selectI18n"
      >
        <tiny-option v-for="item in langData" :key="item.key" :label="item[currentLang]" :value="item.key">
          <div style="display: flex">
            <span style="flex: 1">{{ item.key }}</span>
            <span style="flex: 1">{{ item[currentLang] }}</span>
          </div>
        </tiny-option>
      </tiny-select>
      <div v-if="paramsForm.length" class="params-form">
        <label>国际化参数配置</label>
        <div v-for="param in paramsForm" :key="param.name" class="params-item">
          <label>{{ param.name }}</label>
          <tiny-input v-model="param.value" @update:modelValue="paramsChange"></tiny-input>
        </div>
      </div>
      <slot name="suffix">
        <tiny-button type="info" @click="openCreateForm">
          <icon-plus class="icon-plus"></icon-plus>
          <span>创建新的多语言文案</span>
        </tiny-button>
        <tiny-button v-if="isBind" type="info" @click="unbindI18n"> 解除关联 </tiny-button>
      </slot>
    </div>
    <div v-show="showEditItem" class="addNewLanguage">
      <div>
        <div class="tiny-input">
          <label>唯一键</label>
          <input v-model="editForm.key" class="tiny-input__inner" />
        </div>

        <div v-for="locale in locales" :key="locale.lang" class="tiny-input">
          <label>{{ locale.label }}</label>
          <input v-model="editForm[locale.lang]" class="tiny-input__inner" />
        </div>
      </div>
      <div class="add-btns">
        <tiny-button type="info" @click="activeI18n">国际化管理 </tiny-button>
        <tiny-button type="info" @click="addBindI18n">添加并关联 </tiny-button>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, watchEffect } from 'vue'
import { useLayout, useTranslate } from '@opentiny/tiny-engine-controller'
import { PROP_DATA_TYPE } from '@opentiny/tiny-engine-controller/utils'
import { utils } from '@opentiny/tiny-engine-utils'
import { Select, Option, Button, Input } from '@opentiny/vue'
import { iconPlus } from '@opentiny/vue-icon'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option,
    TinyButton: Button,
    TinyInput: Input,
    IconPlus: iconPlus()
  },
  inheritAttrs: false,
  props: {
    currentLang: String,
    isBind: Boolean,
    langData: {
      type: [Array, Object],
      default: () => []
    },
    modelValue: {
      type: String,
      default: ''
    },
    data: [Object, String],
    locales: Array
  },
  setup(props, { emit }) {
    const selectValue = ref(props.modelValue)
    const showEditItem = ref(false)
    const selectRef = ref(null)
    const editForm = reactive({})
    const paramsForm = ref([])

    watchEffect(() => {
      selectValue.value = props.modelValue
      if (props.modelValue && props.langData[props.modelValue]) {
        const curValue = props.langData[props.modelValue][props.currentLang] || ''
        const params = []
        const data = props?.data?.params || {}

        curValue.replace(/\{(.+?)\}/g, (substr, key) => {
          key && params.push({ name: key, value: data[key] || '' })
        })
        paramsForm.value = params
      }
    })

    const filterMethod = (value) => {
      const options = selectRef.value.state.cachedOptions

      options.forEach((item) => {
        item.state.visible = value ? item.label.indexOf(value) > -1 : true
      })
    }

    const selectI18n = (key) => {
      const data = props.langData[key] || {}

      emit('bind', { ...data, key })
    }

    const activeI18n = () => useLayout().activePlugin('I18n')

    const addBindI18n = () => {
      useTranslate().ensureI18n(editForm, true)
      emit('bind', { ...editForm })
      showEditItem.value = false
    }

    const unbindI18n = () => {
      const i18nObj = props.langData[props.modelValue]

      emit('bind', i18nObj[props.currentLang])
      showEditItem.value = false
    }

    const paramsChange = () => {
      const params = {}

      paramsForm.value.forEach(({ name, value }) => {
        params[name] = value
      })
      emit('bind', { type: PROP_DATA_TYPE.I18N, key: selectValue.value, params })
    }

    const openCreateForm = () => {
      Object.keys(editForm).forEach((key) => delete editForm[key])
      editForm.key = 'lowcode.' + utils.guid()
      editForm.type = PROP_DATA_TYPE.I18N
      showEditItem.value = true
    }

    return {
      selectRef,
      showEditItem,
      filterMethod,
      selectI18n,
      selectValue,
      activeI18n,
      addBindI18n,
      unbindI18n,
      paramsForm,
      paramsChange,
      editForm,
      openCreateForm
    }
  }
}
</script>

<style lang="less" scoped>
.languageContent {
  width: 254px;
  border-radius: 5px;
  text-align: center;
  z-index: 99;
  margin-top: 5px;

  .tiny-svg {
    margin-right: 10px;
    font-size: 16px;
    &:hover {
      cursor: pointer;
      color: #ccc;
    }
  }
  .tiny-button {
    margin-top: 10px;
    max-width: initial;
    padding: 0 12px;
    background-color: var(--ti-lowcode-tabs-border-color);
    border-color: var(--ti-lowcode-tootip-input-border-color);
    color: var(--ti-lowcode-toolbar-icon-color);
    &:hover {
      background-color: var(--ti-lowcode-canvas-wrap-bg);
      border-color: var(--ti-lowcode-tabs-border-color);
    }
  }
  .addNewLanguage {
    padding: 0px 5px 5px;
    .tiny-input {
      display: flex;
      margin-bottom: 10px;
      align-items: center;
      label {
        width: 80px;
      }
      display: flex;
    }
    .add-btns {
      text-align: right;
    }
  }
}
.params-form {
  & > label {
    line-height: 30px;
  }
  .params-item {
    display: flex;
    align-items: center;
    label {
      width: 80px;
    }
    margin-bottom: 10px;
  }
}
</style>
