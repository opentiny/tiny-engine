<template>
    <div class="empty">
        <div class="empty__icon">
            <icon-warning />
        </div>
        <div class="empty__tips">
            <span>项目列表为空</span>
        </div>
    </div>
</template>

<script setup>
import {IconWarning} from '@opentiny/vue-icon';
const iconWarning = IconWarning();
</script>

<style scoped lang="less">
.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 8px 0;
    gap: 24px;
    &__icon {
        font-size: 48px;
        fill: #ff953e;
    }
    &__tips {
        font-size: 24px;
        color: #ff953e;
    }
}
</style>