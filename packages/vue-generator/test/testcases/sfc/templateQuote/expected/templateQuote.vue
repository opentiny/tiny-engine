<template>
  <div>
    <tiny-button
      v-for="(item, index) in [
        {
          type: 'primary',
          subStr: 'primary\'subStr\''
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
      ]"
      type="primary"
      text="test"
      subStr="pri&quot;ma&quot;ry'subStr'"
      :customExpressionTest="{
        value: [
          {
            defaultValue: '{&quot;class&quot;: &quot;test-class&quot;, &quot;id&quot;: &quot;test-id&quot;}'
          }
        ]
      }"
      :customAttrTest="{
        value: [
          {
            defaultValue:
              '{&quot;class&quot;: &quot;test-class&quot;, &quot;id&quot;: &quot;test-id&quot;, &quot;class2&quot;: &quot;te\'st\'-class2&quot;}',
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
  customAttrTest: { value: [{ defaultValue: '{"class": "test-class", "id": "test-id"}' }] }
})
wrap({ state })
</script>
<style scoped></style>
