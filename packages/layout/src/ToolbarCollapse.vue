<template>
  <tiny-popover :visible-arrow="false" width="140" trigger="hover">
    <template #reference>
      <span class="toolbar-ellipsis">
        <svg-icon name="ellipsis"></svg-icon>
      </span>
    </template>
    <div class="collapse-content">
      <div class="empty-bar" v-for="(item, idx) in collapseBar" :key="idx">
        <div class="toolbar-list-button" v-if="typeof item === 'string'">
          <component :is="getMergeMeta(item)?.entry" :options="getMergeMeta(comp).options"></component>
        </div>
        <div v-if="Array.isArray(item)">
          <div class="toolbar-list-button" v-for="comp in item" :key="comp">
            <component :is="getMergeMeta(comp)?.entry" :options="getMergeMeta(comp).options"></component>
          </div>
          <div class="empty-line"></div>
        </div>
      </div>
    </div>
  </tiny-popover>
</template>

<script>
import { Popover } from '@opentiny/vue'
import { IconPopup } from '@opentiny/vue-icon'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyPopover: Popover,
    IconPopup: IconPopup()
  },
  props: {
    collapseBar: {
      type: Array,
      default: () => []
    }
  },
  setup() {
    return {
      getMergeMeta
    }
  }
}
</script>

<style lang="less">
.toolbar-ellipsis {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  line-height: 24px;
  margin-left: 4px;

  &:hover {
    background: var(--ti-lowcode-toolbar-view-active-bg);
  }
}

.collapse-content {
  margin: 8px 4px;
  .empty-bar {
    font-size: 12px;

    .toolbar-list-button {
      height: 24px;
      line-height: 24px;

      &:hover {
        background-color: var(--ti-lowcode-toolbar-ellipsis-hover-bg);
        cursor: pointer;
      }
    }

    .empty-line {
      margin: 4px 0px;
      border-top: 1px solid var(--te-common-bg-container);
    }

    .icon-hides {
      margin-right: 8px;
      color: var(--te-common-icon-secondary);
    }
  }
}

.collapse-content .empty-bar:last-child {
  margin-bottom: 4px;
  .empty-line {
    display: none;
  }
}
</style>
