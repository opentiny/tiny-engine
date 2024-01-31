<template>
  <transition mode="out-in">
    <slot />
  </transition>
</template>

<style lang="less" scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 150ms linear;
}
.v-enter-from,
.v-leave-to {
  opacity: 0;
}
.v-enter-to,
.v-leave-from {
  opacity: 1;
}
</style>
