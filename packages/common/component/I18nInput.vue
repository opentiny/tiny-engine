<template>
  <div class="text-input">
    <tiny-input :modelValue="inputValue" placeholder="请输入内容" v-bind="$attrs" @input="inputChange">
      <template #suffix>
        <tiny-popover
          ref="popoverRef"
          width="260"
          trigger="click"
          :visible-arrow="false"
          popper-class="lowcode"
          @hide="onHide"
        >
          <div class="popover-content">
            <icon-close class="icon-close" @click="closePopover"></icon-close>
            <bind-i18n
              ref="addI1i8nRef"
              v-model="i18nValue"
              :lang-data="langs"
              :is-bind="isBind"
              :currentLang="currentLanguage"
              :data="modelValue"
              :locales="i18nResource.locales"
              @bind="setI18n"
            ></bind-i18n>
          </div>

          <template #reference>
            <icon-language :class="['icon-language', { isBind }]"></icon-language>
          </template>
        </tiny-popover>
      </template>
    </tiny-input>
  </div>
</template>

<script>
import { computed, ref, watchEffect } from 'vue'
import { useTranslate } from '@opentiny/tiny-engine-meta-register'
import { Input, Popover } from '@opentiny/vue'
import { IconClose, IconLanguage } from '@opentiny/vue-icon'
import BindI18n from './BindI18n.vue'

export default {
  name: 'I18nInput',
  components: {
    TinyInput: Input,
    BindI18n,
    TinyPopover: Popover,
    IconClose: IconClose(),
    IconLanguage: IconLanguage()
  },
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Object],
      default: ''
    }
  },
  setup(props, { emit }) {
    const { currentLanguage, getLangs, i18nResource } = useTranslate()
    const langs = computed(() => getLangs())
    const isBind = computed(() => props.modelValue?.type === 'i18n')
    const inputValue = ref('')
    const i18nValue = ref(props.modelValue?.key || '')
    const addI1i8nRef = ref(null)
    const popoverRef = ref(null)

    watchEffect(() => {
      i18nValue.value = props.modelValue?.key || ''
      inputValue.value = useTranslate().translate(props.modelValue)
    })

    const inputChange = (event) => {
      emit('update:modelValue', event.target.value) // 直接修改时去掉绑定
    }

    const setI18n = (data) => {
      emit('update:modelValue', data)
    }

    const onHide = () => {
      if (addI1i8nRef.value) {
        addI1i8nRef.value.showEditItem = false
      }
    }

    const closePopover = () => {
      popoverRef.value.state.showPopper = false
    }

    return {
      isBind,
      inputValue,
      inputChange,
      langs,
      i18nValue,
      currentLanguage,
      i18nResource,
      setI18n,
      addI1i8nRef,
      onHide,
      closePopover,
      popoverRef
    }
  }
}
</script>

<style lang="less" scoped>
.text-input {
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  .tiny-svg {
    outline: none;
    &:hover {
      cursor: pointer;
      color: var(--ti-lowcode-toolbar-icon-color);
    }
    &.isBind {
      color: var(--ti-lowcode-icon-bind-color);
    }
  }
}
.popover-content {
  text-align: right;
  .icon-close {
    margin-right: 5px;
  }
}
</style>
