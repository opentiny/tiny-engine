<template>
  <span class="link-button">
    <tiny-tooltip effect="light" :content="tips">
      <template #content>
        <div class="tip-content">
          {{ tips }}
        </div>
        <a v-if="href" class="tip-jump" :href="href" target="_blank">
          <svg-icon name="jump"></svg-icon>
          查看详情
        </a>
      </template>
      <svg-icon name="plugin-icon-plugin-help"></svg-icon>
    </tiny-tooltip>
  </span>
</template>

<script lang="ts">
import { TinyTooltip } from '@opentiny/vue'
export default {
  components: {
    TinyTooltip
  },
  props: {
    href: {
      type: String,
      default: ''
    },
    tips: {
      type: String,
      default: '帮助'
    }
  }
}
</script>

<style lang="less" scoped>
.link-button {
  width: 24px;
  height: 24px;
  font-size: 16px;
  margin-left: 4px;
  color: var(--te-component-common-icon-color-primary);
  border: 1px solid transparent;
  border-radius: 4px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  .svg-icon {
    outline: none;
  }
  :deep(.svg-icon.icon-plugin-icon-plugin-help) {
    font-size: 16px;
  }
}
.tip-content {
  width: 220px;
  margin-bottom: 6px;
  color: var(--te-component-common-text-color-secondary);
}
.tip-jump {
  color: var(--te-component-common-text-color-link);
}
</style>
