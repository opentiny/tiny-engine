<template>
    <div class="space" :class="[vertical && 'is-vertical']">
        <slot />
    </div>
</template>

<script lang="ts">
export default {
    props: {
        vertical: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style scoped>
.space {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px 16px;
}
.space.is-vertical {
    align-items: flex-start;
    flex-direction: column;
}
</style>
