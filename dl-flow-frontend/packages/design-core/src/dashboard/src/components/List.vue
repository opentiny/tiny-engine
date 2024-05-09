<script setup>
import {useIntersectionObserver} from '@vueuse/core';
import { ref } from 'vue';
const flag = ref(null);
const emits = defineEmits(['scroll-finish'])
useIntersectionObserver(flag, () => {
    emits('scroll-finish');
})
</script>
<template>
    <div class="list">
        <div class="list__wrapper">
            <slot />
        </div>
        <div class="flag" ref="flag"></div>
    </div>
</template>

<style scoped lang="less">
.list {
    width: 100%;
    border-radius: 8px;
    &__wrapper{
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: 1px solid #ccc;
    }
    .flag {
        width: 100%;
        height: 2px;
    }
}
</style>