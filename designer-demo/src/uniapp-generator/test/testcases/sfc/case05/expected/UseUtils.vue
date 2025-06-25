<template>
  <div>
    <div>
      <span @click="onClickNew"
        >TinyEngine 前端可视化设计器，为设计器开发者提供定制服务，在线构建出自己专属的设计器。</span
      >
    </div>
  </div>
</template>

<script setup lang="jsx">
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ firstName: '', lastName: '' })
wrap({ state })

const onClickNew = wrap(function onClickNew(event) {
  this.utils.Moddal.alert({
    message: () => <div style="color: #f09841">testtest</div>
  })
})

wrap({ onClickNew })
</script>
<style scoped></style>
