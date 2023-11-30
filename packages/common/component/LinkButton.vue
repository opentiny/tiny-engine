<template>
  <a class="help-box" :href="href" target="_blank">
    <svg-button id="help-icon" name="plugin-icon-plugin-help" :tips="tips"></svg-button>
  </a>
</template>

<script lang="jsx">
import { SvgButton } from '@opentiny/tiny-engine-common'
export default {
  components: {
    SvgButton
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
.help-box {
  width: 24px;
  height: 42px;

  #help-icon {
    :deep(.svg-icon.icon-plugin-icon-plugin-help) {
      font-size: 16px;
    }
  }
}
</style>
