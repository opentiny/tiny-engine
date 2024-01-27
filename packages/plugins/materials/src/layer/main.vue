<script setup lang="jsx">
import { Button } from '@opentiny/vue'
import { useX6, useResource } from '@opentiny/tiny-engine-controller'
import { computed } from 'vue'
const { resState } = useResource()
const isEmpty = computed(() => resState.layer)
const { addNode } = useX6()
const addEmptyLayer = () => {
  addNode({
    mode: 'layer',
    label: {
      zh_CN: 'custom-layer',
      en_US: 'custom-layer'
    }
  })
}
</script>

<template>
  <div class="layer">
    <fade-transition group>
      <template v-if="isEmpty">
        <Search class="layer__search" v-if="!isEmpty" />
        <Button @click="addEmptyLayer">Add</Button>
        <div class="layer--empty">
          <empty desc="自定义层为空" />
        </div>
      </template>
    </fade-transition>
  </div>
</template>

<style scoped lang="less">
.layer {
  width: 100%;
  height: 100%;
  padding: 8px;
  display: flex;
  flex-direction: column;
  &__search {
    height: fit-content;
    flex: 0 0 auto;
  }
  &--empty {
    width: 100%;
    flex: 1 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .editor {
    height: 100%;
  }
}
</style>
