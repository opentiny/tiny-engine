<template>
  <tiny-tooltip :content="props.tooltipContent" placement="top" effect="light" :open-delay="500">
    <div :class="['footer-button-wrapper', props.active ? 'active' : '']" @click="handleVisibleToggle">
      <div class="button">
        <slot name="icon"></slot>
        <span class="text">
          <slot name="text"></slot>
        </span>
      </div>
    </div>
  </tiny-tooltip>
</template>

<script lang="ts" setup>
import { TinyTooltip } from '@opentiny/vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  tooltipContent: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:active'])

const handleVisibleToggle = () => {
  emit('update:active', !props.active)
}
</script>

<style lang="less" scoped>
.footer-button-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border-radius: 32px;
  height: 32px;
  padding: 0px 8px;
  border: 1px solid rgb(194, 194, 194);
  color: #595959;
  cursor: pointer;
  box-sizing: border-box;
  background-color: var(--te-base-gray-10);

  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }

  &.active {
    border: 1px solid rgb(20, 118, 255);
    background: rgba(20, 118, 255, 0.08);
    color: rgb(20, 118, 255);

    &:hover {
      background: rgba(20, 118, 255, 0.12);
    }
  }

  .text {
    height: 22px;
    line-height: 22px;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
  }

  .button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .plugin-common {
    &_text {
      font-size: 12px;
      font-weight: 400;
      line-height: 20px;
      letter-spacing: 0;
      text-align: left;
    }

    &_icon {
      font-size: 16px;
    }
  }

  .plugin-active {
    &_count {
      width: 12px;
      height: 12px;
      background: #1476ff;
      // border-radius: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 9px;
      font-weight: 500;
      line-height: 12px;
      color: #fff;
    }

    &:hover {
      color: #1476ff;
      background-color: #eaf0f8;
      border: 1px solid #1476ff;
    }
  }
}

@container tiny-container (max-width: 640px) {
  .footer-button-wrapper {
    width: 32px;
    border-radius: 999px;
    padding: 0px;
  }
  .text {
    display: none;
  }
}
</style>
