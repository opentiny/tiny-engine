<template>
  <div class="wrapper" v-loading="loading">
    <template v-for="(item, idx) of nn" :key="idx">
      <div @click="() => onClickNN(item)">
        <span>{{ item.label.zh_CN }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useResource, useX6 } from '@opentiny/tiny-engine-controller'
import { Loading } from '@opentiny/vue'
const { fetchNN, resState } = useResource()
const { nn, loading } = await fetchNN()
const vLoading = Loading.directive
const { addNode } = useX6()
/** @param {import('@opentiny/tiny-engine-controller/useX6').MaterialInfo} item */
const onClickNN = (item) => {
  addNode(item, resState.types)
}
</script>

<style scoped>
.wrapper {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 50%);
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  padding: 0 1em;
}
.wrapper > div {
  cursor: pointer;
  text-align: center;
  font-size: 14px;
  padding: 4px 6px;
}
.wrapper > div > span {
  word-break: break-all;
}
.wrapper > div:hover {
  border-radius: 4px;
  background: #eee;
}
</style>
