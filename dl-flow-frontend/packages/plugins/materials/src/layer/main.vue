<script setup lang="jsx">
import {Empty} from '@opentiny/tiny-engine-common';
import { Button, Search } from '@opentiny/vue'
import { useX6, useLayer } from '@opentiny/tiny-engine-controller'
import { computed } from 'vue'
import i18n from '@opentiny/tiny-engine-i18n-host';
const locale = i18n.global.locale;
const { layers, getLayer } = useLayer()
getLayer();
const isEmpty = computed(() => !layers.value.length);
const { addNode } = useX6()
const addEmptyLayer = () => {
  addNode({
    mode: 'layer',
    label: {
      zh_CN: '自定义层',
      en_US: 'custom-layer'
    },
    new: true
  })
}
const addLayer = (layer) => {
  addNode({
    ...layer
  });
}
</script>

<template>
  <div class="layer">
    <Search class="layer__search" v-if="!isEmpty" />
    <Button @click="addEmptyLayer">Add</Button>
    <div class="layer--empty" v-if="isEmpty">
      <empty desc="自定义层为空" />
    </div>
    <div class="layer__wrapper">
      <template v-for="layer of layers" :key="layer">
        <div class="layer__wrapper__item" @click="()=>addLayer(layer)">
          {{layer.label[locale]}}
        </div>
      </template> 
    </div>
  </div>
</template>

<style scoped lang="less">
.layer {
  width: 100%;
  height: 100%;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px   ;
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
  &__wrapper{
    width: 100%;
    padding: 4px 8px;
    gap: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    gap: 4px;
    &__item {
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid transparent;
      text-align: center;
    }
    &__item:hover{
      background: #eee;
      border: 1px solid #e4e4e4;
    }
  }
}
</style>
