<template>
  <div>
    <tiny-button
      v-for="(item, index) in state.loop_6cio"
      type="primary"
      text="test"
      subStr="pri'ma'ry'subStr'"
      :customExpressionTest="state.customExpressionTest_vBHN"
      :customAttrTest="{
        value: [
          {
            defaultValue: '{\'class\': \'test-class\', \'id\': \'test-id\', \'class2\': \'te\'st\'-class2\'}',
            subStr: 'test-\'cl\'ass2'
          }
        ]
      }"
    ></tiny-button>
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

const state = vue.reactive({
  loop_6cio: [
    {
      type: 'primary',
      subStr: "primary'subStr'"
    },
    {
      type: ''
    },
    {
      type: 'info'
    },
    {
      type: 'success'
    },
    {
      type: 'warning'
    },
    {
      type: 'danger'
    }
  ],
  customExpressionTest_vBHN: {
    value: [
      {
        defaultValue: '{"class": "test-class", "id": "test-id"}'
      }
    ]
  },
  customAttrTest: { value: [{ defaultValue: "{'class': 'test-class', 'id': 'test-id'}" }] }
})
wrap({ state })
</script>
<style scoped></style>
