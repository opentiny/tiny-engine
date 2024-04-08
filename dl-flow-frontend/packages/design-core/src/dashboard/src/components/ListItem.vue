<template>
    <div class="list-item">
        <div class="list-item__prefix">
            <slot name="prefix"/>
        </div>
        <div class="list-item__content">
            <slot />
        </div>
        <div class="list-item__suffix">
            <slot name="suffix" />
        </div>
    </div>
</template>

<style lang="less" scoped>
.list-item{
    display: flex;
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    &__content{
        flex-grow: 1;
    }
    &:not(:last-child) {
        border-bottom: 1px solid #ccc;
    }
}
</style>