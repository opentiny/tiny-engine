<template>
  <div>
    <ul class="block-menu">
      <li>菜单1</li>
      <li>菜单2</li>
      <li>菜单3</li>
      <li>菜单4</li>
      <li>菜单5</li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  console.log('blockMenu mounted')
})
</script>

<style>
.block-menu {
  color: red;
}
</style>
