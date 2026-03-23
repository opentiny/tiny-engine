<template>
  <div>
    <tiny-button
      jsonContent='{"key": "value", "nested": "data"}'
      mixedQuotes="She said &quot;hello&quot; and he said 'hi'"
      :filteredItems="state.items.filter((i) => i.name === 'test' && i.tag === 'featured')"
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
  items: [
    { name: 'test', tag: 'featured' },
    { name: 'hello', tag: 'normal' }
  ]
})
wrap({ state })
</script>
<style scoped></style>
