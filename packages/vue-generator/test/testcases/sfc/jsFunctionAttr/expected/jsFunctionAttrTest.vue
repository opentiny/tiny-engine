<template>
  <div>
    <div>
      <tiny-tree
        class="component-base-style"
        :render-content="render"
        :data="[
          { label: '一级 1', children: [{ label: '二级 1-1', children: [{ label: '三级 1-1-1' }] }] },
          {
            label: '一级 2',
            children: [
              { label: '二级 2-1', children: [{ label: '三级 2-1-1' }] },
              { label: '二级 2-2', children: [{ label: '三级 2-2-1' }] }
            ]
          }
        ]"
      ></tiny-tree>
    </div>
  </div>
</template>

<script setup lang="jsx">
import { Tree as TinyTree } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({})
wrap({ state })

const render = wrap(function render(h, { node, data }) {
  return <span style="color: red;font-size: 20px;">{node.label}</span>
})
</script>
<style scoped></style>
