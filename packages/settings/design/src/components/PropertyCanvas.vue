<template>
  <div ref="root" class="properties-wrap">
    <div v-if="!store.currentSubConfig" class="properties-controll">
      <tiny-button type="primary" @click="addGroup">创建分组</tiny-button>
      <tiny-button v-if="store.currentProperty" @click="removeProperty">删除属性</tiny-button>
    </div>
    <div v-if="store.currentSchema.length === 0" class="empty-group-tips">
      <svg-icon class="empty-data-icon" name="empty-data"></svg-icon>
      <p class="tips-desc">您还没有创建分组</p>
    </div>
    <array-config-item-form v-if="store.currentSubConfig"></array-config-item-form>
    <config-render
      v-else
      design
      :data="store.currentSchema"
      :key="store.configGroupKey"
      emptyText="从左侧（属性列表）拖拽属性到这里，进行分组"
      @select-prop="($event) => setCurrentProperty($event)"
    >
      <template #title="titleProps">
        <div class="title-wrap">
          <h6>{{ titleProps.group.label?.zh_CN || '' }}</h6>
          <div>
            <tiny-tooltip class="option-tips" effect="light" content="编辑分组信息" placement="top">
              <span class="item-icon">
                <svg-icon name="to-edit" class="option-icon" @click.stop="handleEditGroup(titleProps.group)"></svg-icon>
              </span>
            </tiny-tooltip>
            <tiny-tooltip class="option-tips" effect="light" content="删除分组" placement="top">
              <span class="item-icon">
                <svg-icon
                  name="delete"
                  class="option-icon"
                  @click.stop="handleDeleteGroup(titleProps.group)"
                ></svg-icon>
              </span>
            </tiny-tooltip>
          </div>
        </div>
      </template>
    </config-render>
  </div>
</template>

<script>
import { onMounted, ref, provide, computed, watch, nextTick } from 'vue'
import Sortable from 'sortablejs'
import { Button, Tooltip } from '@opentiny/vue'
import { ConfigRender } from '@opentiny/tiny-engine-common'
import store, { addProperty, setCurrentProperty, addGroup, removeGroup, removeProperty } from '../store'
import ArrayConfigItemForm from './ArrayConfigItemForm.vue'

export default {
  components: {
    TinyButton: Button,
    TinyTooltip: Tooltip,
    ConfigRender,
    ArrayConfigItemForm
  },
  props: {
    schema: {
      type: Object,
      default: () => ({})
    },
    design: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const root = ref(null)

    provide(
      'currentProperty',
      computed(() => store.currentProperty)
    )

    onMounted(() => {
      const container = root.value.querySelector('.tiny-collapse')

      Sortable.create(container, {
        handle: '.tiny-collapse-item__header',
        group: {
          name: 'group'
        },
        onAdd(event) {
          addGroup(event.newIndex)
          event.item.remove()
        },
        onEnd({ newIndex, oldIndex }) {
          const list = props.schema
          const item = list.splice(oldIndex, 1)

          list.splice(newIndex, 0, ...item)
        }
      })
    })

    const onSortEnd = (event) => {
      const { groupIndex } = event.item.dataset
      const { oldIndex, newIndex } = event
      const toGroupIndex = event.to.dataset.groupIndex
      const schema = store.currentSchema
      const moveItem = schema[groupIndex].content.splice(oldIndex, 1)

      schema[toGroupIndex].content.splice(newIndex, 0, ...moveItem)
      ++store.configGroupKey
    }

    watch(
      () => [store.currentSchema.length, root.value, store.configGroupKey, store.currentSubConfig],
      async () => {
        if (!root.value || !store.currentSchema.length || store.currentSubConfig) {
          return
        }
        await nextTick()
        root.value.querySelectorAll('.item-container').forEach((element) => {
          if (element.dataset.dargable) {
            return
          }
          element.dataset.dargable = true
          Sortable.create(element, {
            handle: '.properties-item',
            group: {
              name: 'property'
            },
            onAdd(event) {
              const { id, type } = event.item.dataset
              const toGroupIndex = event.to.dataset.groupIndex
              if (id && type === 'property') {
                event.item.remove()
                addProperty(store.currentSchema[toGroupIndex], id, event.newIndex)
              }
            },
            onEnd: onSortEnd,
            onMove(event) {
              // 只允许拖动到 item-container 容器下面，即属性面板分组之间拖动排序
              return event.to.className.includes('item-container')
            }
          })
        })
      }
    )

    const handleEditGroup = (group) => {
      store.currentEditGroupInfo = group
      if (!group.description) {
        group.description = { zh_CN: '' }
      }
      if (!group.label) {
        group.label = { zh_CN: '' }
      }
      store.currentProperty = null
    }
    const handleDeleteGroup = (group) => {
      removeGroup(group)
    }

    return {
      addGroup,
      addProperty,
      store,
      setCurrentProperty,
      root,
      handleEditGroup,
      handleDeleteGroup,
      removeProperty
    }
  }
}
</script>

<style lang="less" scoped>
.properties-wrap {
  min-width: 510px;
  box-sizing: border-box;
  .empty-group-tips {
    margin-top: 100px;
    text-align: center;
    color: var(--te-common-text-weaken);
    font-size: 12px;
    .empty-data-icon {
      width: 100px;
      height: 100px;
    }
  }
  .properties-controll {
    margin-bottom: 10px;
    .property-tips {
      font-size: 12px;
      .tips-item {
        margin: 0;
      }
      .tips-item + .tips-item {
        margin-top: 4px;
      }
    }
    .tip-wrap {
      margin-top: 10px;
      font-size: 12px;
      color: #3c3939;
      line-height: 16px;

      span {
        display: block;
        margin-bottom: 10px;
      }
    }
  }

  .properties-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    min-height: 30px;
    max-height: calc(var(--max-height) - 80px);
    overflow-y: auto;

    .item-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-wrap: wrap;
      .empty {
        height: 40px;
        line-height: 40px;
        text-align: center;
        width: 100%;
      }
    }
  }

  :deep(.tiny-collapse) {
    flex: 1;
    .tiny-collapse-item {
      &.is-active {
        .tiny-collapse-item__header {
          border-bottom: 1px solid var(--te-common-border-divider);
          height: 36px;
        }
      }
      .title-wrap {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        h6 {
          color: var(--te-common-text-primary);
        }
        .option-icon {
          display: inline-block;
          color: var(--ti-lowcode-setting-plugin-icon-color);
        }
        .option-tips + .option-tips {
          margin-left: 8px;
        }
      }
    }

    .tiny-collapse-item__header {
      color: var(--te-common-text-secondary);
      background-color: var(--te-common-bg-prompt);
      font-weight: 600;

      svg {
        color: var(--te-common-text-secondary);
        margin-right: 4px;
      }
    }

    .tiny-collapse-item__content {
      display: flex;
      flex-wrap: wrap;
      padding: 0;
      background: var(--ti-lowcode-tabs-active-bg);
      border-top: none;
      border-bottom: 1px solid var(--ti-lowcode-tabs-border-color);
      color: var(--te-common-text-secondary);

      .properties-item {
        padding: 3px 10px;
        cursor: pointer;
        &.active {
          background-color: var(--ti-lowcode-common-hover-bg-color);
        }
        .item-input .action-icon {
          display: none;
        }
        .item-label {
          width: 80px;
        }
        .item-input {
          .meta-array-wrap {
            .top {
              color: var(--te-common-text-secondary);
            }
            .actions {
              display: none;
            }
          }
        }
      }
      .item-container {
        .empty {
          color: var(--te-common-text-secondary);
        }
      }
    }

    .tiny-collapse-item__wrap {
      padding: 12px 20px;
    }
  }
}
</style>
