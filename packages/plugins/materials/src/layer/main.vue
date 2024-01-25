<script setup>
import { Search, Button } from '@opentiny/vue'
import { Empty, FadeTransition } from '@opentiny/tiny-engine-common'
import { computed } from 'vue'
import { useResource } from '@opentiny/tiny-engine-controller'
const { resState } = useResource()
const isEmpty = computed(() => !resState.layer?.length)
</script>

<template>
  <div class="layer">
    <fade-transition>
      <template v-if="isEmpty">
        <Search class="layer__search" v-if="!isEmpty" />
        <Button>Add</Button>
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
}
</style>
