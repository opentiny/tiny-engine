<template>
  <div>
    <span class="page-header">测试 state accessor 出码场景</span>
  </div>
</template>

<script setup>
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const { utils } = wrap(function () {
  return this
})()
const state = vue.reactive({
  firstName: 'Opentiny',
  lastName: 'TinyEngine',
  nullValue: null,
  numberValue: 0,
  emptyStr: '',
  strVal: 'i am str.',
  trueVal: true,
  falseVal: false,
  arrVal: [1, '2', { aaa: 'aaa' }, [3, 4], true, false],
  objVal: { aaa: 'aaa', arr: [1, '2', true, false, 0], ccc: { bbb: 'bbb' }, d: 32432, e: '', f: null, g: false },
  IconPlusSquare: utils.IconPlusSquare(),
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    activeMethod: () => {
      return props.isEdit
    }
  },
  status: vue.computed(statusData),
  buttons: [
    { type: 'primary', text: '主要操作' },
    { type: 'success', text: '成功操作' },
    { type: 'danger', text: t('operation.danger') }
  ]
})
wrap({ state })

vue.watchEffect(
  wrap(function () {
    this.state.nullValue = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.numberValue = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.emptyStr = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.strVal = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.trueVal = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.falseVal = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.arrVal = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.objVal = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.IconPlusSquare = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.editConfig = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.status = `${this.state.firstName} ${this.state.lastName}`
  })
)
vue.watchEffect(
  wrap(function () {
    this.state.buttons = `${this.state.firstName} ${this.state.lastName}`
  })
)
</script>
<style scoped></style>
