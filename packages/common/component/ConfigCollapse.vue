<template>
  <div id="typography-more">
    <tiny-collapse>
      <tiny-collapse-item :title="title" name="1">
        <slot></slot>
      </tiny-collapse-item>
    </tiny-collapse>
  </div>
</template>

<script>
import { Collapse, CollapseItem } from '@opentiny/vue'

export default {
  components: {
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem
  },
  props: {
    title: {
      type: String,
      default: '更多类型选项'
    }
  },
  setup() {
    return {}
  }
}
</script>

<style lang="less" scoped>
#typography-more {
  .tiny-collapse {
    :deep(.tiny-collapse-item) {
      .tiny-collapse-item__header {
        height: 24px;
        line-height: 24px;
        border: none;
        justify-content: center;
        transition: 0.3s;

        &:hover {
          color: var(--te-common-icon-primary);

          svg {
            color: var(--te-common-icon-primary);
          }
        }
      }

      .tiny-collapse-item__content {
        padding: 0;
      }
    }
  }
}
</style>
