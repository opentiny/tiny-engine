<template>
  <div id="typography-more">
    <meta-collapse>
      <template #content>
        <div class="typography-more-wrap">
          <div class="typography-more-item">
            <div class="item-col">
              <numeric-select></numeric-select>
              <label for="">Letter spacing</label>
            </div>
            <div class="item-col">
              <numeric-select></numeric-select>
              <label for="">Text indent</label>
            </div>
            <div class="item-col">
              <numeric-select></numeric-select>
              <label for="">Columns</label>
            </div>
          </div>
          <div class="typography-more-item dir">
            <div class="item-col">
              <div class="item-btn">
                <tiny-tooltip :effect="effect" :placement="placement" content="None">
                  <div class="icon">
                    <svg-icon name="close" class="bem-Svg"></svg-icon>
                  </div>
                </tiny-tooltip>
                <tiny-tooltip :effect="effect" :placement="placement" content="ALL CAPS">
                  <div class="icon">
                    <svg-icon name="text-transform-capitalize" class="bem-Svg"></svg-icon>
                  </div>
                </tiny-tooltip>
                <tiny-tooltip :effect="effect" :placement="placement" content="Capitalize Every Word">
                  <div class="icon">
                    <svg-icon name="text-transform-sentence" class="bem-Svg"></svg-icon>
                  </div>
                </tiny-tooltip>
                <tiny-tooltip :effect="effect" :placement="placement" content="lowercase">
                  <div class="icon">
                    <svg-icon name="text-transform-lowercase" class="bem-Svg"></svg-icon>
                  </div>
                </tiny-tooltip>
              </div>
              <label for="">Capitalize</label>
            </div>
            <div class="item-col">
              <div class="item-btn">
                <tiny-tooltip :effect="effect" :placement="placement" content="Left to right">
                  <div class="icon">
                    <svg-icon name="text-direction-ltr" class="bem-Svg"></svg-icon>
                  </div>
                </tiny-tooltip>
                <tiny-tooltip :effect="effect" :placement="placement" content="Right to left">
                  <div class="icon">
                    <svg-icon name="text-direction-rtl" class="bem-Svg"></svg-icon>
                  </div>
                </tiny-tooltip>
              </div>
              <label for="">Direction</label>
            </div>
          </div>
          <div class="typography-more-item bre">
            <label for="">Breaking</label>
            <!-- <select-option></select-option> -->
          </div>
        </div>
        <div class="text-shadow">
          <div class="text">
            <span>Text shadows</span>
            <span><icon-plus></icon-plus></span>
          </div>
        </div>
      </template>
    </meta-collapse>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { Tooltip } from '@opentiny/vue'
import { IconPlus } from '@opentiny/vue-icon'
import NumericSelect from '../inputs/NumericSelect.vue'
import { ConfigCollapse } from '@opentiny/tiny-engine-common'

export default {
  components: {
    NumericSelect,
    TinyTooltip: Tooltip,
    IconPlus: IconPlus(),
    MetaCollapse: ConfigCollapse
  },
  props: {
    style: {
      type: Object,
      default: () => ({})
    },
    effect: {
      type: String,
      default: 'dark'
    },
    placement: {
      type: String,
      default: 'top'
    }
  },
  setup() {
    const state = reactive({
      activeNames: ['0']
    })

    return {
      state
    }
  }
}
</script>

<style lang="less" scoped>
#typography-more {
  padding: 0 10px 10px;
  .tiny-collapse {
    :deep(.tiny-collapse-item) {
      .tiny-collapse-item__header {
        height: 24px;
        line-height: 24px;
        background-color: var(--te-common-bg-container);
        justify-content: center;
        transition: 0.3s;

        &::before {
          top: 50%;
          left: 50%;
          transform: translate(-38px, -50%);
        }

        &.is-active::before {
          top: 50%;
          left: 50%;
          transform: translate(-42px, -30%) rotate(90deg);
        }

        &:hover {
          color: var(--ti-lowcode-toolbar-icon-color);

          svg {
            color: var(--ti-lowcode-toolbar-icon-color);
          }
        }
      }

      .tiny-collapse-item__content {
        padding: 0;
        border: none;
      }
    }
  }

  .typography-more-item {
    align-items: center;
    display: grid;
    gap: 4px 8px;
    grid-template-columns: repeat(3, 1fr);
    padding-top: 8px;

    &.dir {
      gap: 8px;
      grid-template-columns: 2fr 1fr;
    }

    &.bre {
      gap: 8px;
      grid-template-columns: 1fr auto;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--ti-lowcode-tabs-border-color);
    }

    .item-col {
      text-align: center;

      & > div {
        margin-bottom: 8px;
      }

      .item-btn {
        flex: auto;
        display: flex;
        border: 1px solid var(--ti-lowcode-tabs-border-color);

        .icon {
          flex: 1;
          padding: 4px 0;
          font-size: 16px;
          color: var(--te-common-text-secondary);
          background: var(--te-common-bg-container);
          position: relative;
          display: flex;
          justify-content: center;

          &:hover {
            color: var(--ti-lowcode-toolbar-icon-color);
          }

          &:not(:last-child)::after {
            content: '';
            width: 1px;
            height: 100%;
            background: var(--ti-lowcode-tabs-border-color);
            display: inline-block;
            position: absolute;
            top: 0;
            right: 0;
          }
        }
      }
    }

    label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .text-shadow {
    padding: 8px 0;
    .text {
      display: flex;
      justify-content: space-between;

      svg {
        font-size: 14px;
        color: var(--te-common-text-secondary);
      }
    }
  }
}
</style>
