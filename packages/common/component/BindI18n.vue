<template>
  <div ref="languageContent" class="languageContent">
    <div v-show="!showEditItem">
      <tiny-select
        ref="selectRef"
        v-model="selectValue"
        placeholder="请选择多语言文案"
        filterable
        is-drop-inherit-width
        :filter-method="filterMethod"
        @change="selectI18n"
      >
        <tiny-option v-for="item in langData" :key="item.key" :label="item.key + item[currentLang]" :value="item.key">
        </tiny-option>
      </tiny-select>
      <div v-if="paramsForm.length" class="params-form">
        <div class="label">国际化参数配置</div>
        <div v-for="param in paramsForm" :key="param.name" class="params-item">
          <label>{{ param.name }}</label>
          <tiny-input v-model="param.value" @update:modelValue="paramsChange"></tiny-input>
        </div>
      </div>
      <slot name="suffix">
        <div class="bottom-buttons">
          <tiny-button v-if="isBind" @click="unbindI18n">解除关联</tiny-button>
          <tiny-button type="primary" @click="openCreateForm">
            <span>创建新的多语言文案</span>
          </tiny-button>
        </div>
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
      <div class="bottom-buttons">
        <tiny-button @click="activeI18n">国际化管理</tiny-button>
        <tiny-button type="primary" @click="addBindI18n">添加并关联</tiny-button>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, watchEffect } from 'vue'
import { useLayout, useTranslate } from '@opentiny/tiny-engine-meta-register'
import { PROP_DATA_TYPE } from '../js/constants'
import { utils } from '@opentiny/tiny-engine-utils'
import { Select, Option, Button, Input } from '@opentiny/vue'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option,
    TinyButton: Button,
    TinyInput: Input
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

    const { PLUGIN_NAME, activePlugin } = useLayout()
    const activeI18n = () => activePlugin(PLUGIN_NAME.I18n)

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
  z-index: 99;

  .tiny-svg {
    margin-right: 10px;
    font-size: 16px;
    &:hover {
      cursor: pointer;
      color: #ccc;
    }
  }
  .addNewLanguage {
    .tiny-input {
      display: flex;
      margin-bottom: 10px;
      padding: 0 8px;
      align-items: center;
      label {
        text-wrap: nowrap;
        text-align: left;
        width: 50px;
      }
      display: flex;
    }
    .tiny-input__inner {
      flex: 1;
    }
  }
}
.params-form {
  .label {
    margin: 16px 0;
    font-size: 12px;
    line-height: 18px;
  }
  .params-item + .params-item {
    margin-top: 12px;
  }
  .params-item {
    display: flex;
    align-items: center;
    label {
      width: 80px;
    }
  }
}
.bottom-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 8px;
  .tiny-button,
  .tiny-button.tiny-button--default {
    margin: 0;
  }
}
</style>
