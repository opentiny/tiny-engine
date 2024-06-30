<template>
  <div>
    <div v-for="(slot, index) in slotList" :key="slot.name" class="slot-list">
      <div class="slot-name">
        <span>
          {{ slot.label }}
        </span>
        <tiny-popover v-if="slot.description" placement="top" trigger="hover" :content="slot.description">
          <template #reference>
            <div>
              <icon-help-circle class="help-icon"></icon-help-circle>
            </div>
          </template>
        </tiny-popover>
      </div>
      <div class="slot-switch">
        <div :class="['e__switch', { 'e_is-checked': slot.bind }]">
          <span class="e__switch-core" @click="toggleSlot(slot, index)"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watchEffect, nextTick } from 'vue'
import { Popover } from '@opentiny/vue'
import { useProperties, useResource, useModal, useCanvas } from '@opentiny/tiny-engine-controller'
import { iconHelpCircle } from '@opentiny/vue-icon'

export default {
  components: {
    TinyPopover: Popover,
    IconHelpCircle: iconHelpCircle()
  },
  props: {
    slots: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const slotList = ref([])

    watchEffect(() => {
      const slots = {}
      let children = useProperties().getSchema()?.children
      Array.isArray(children) &&
        children.forEach((child) => {
          if (child.componentName === 'Template' && child.props?.slot) {
            const slotName = child.props.slot?.name || child.props.slot
            slots[slotName] = child.props.slot
          }
        })
      slotList.value = Object.keys(props.slots).map((name) => {
        const { label, description, params } = props.slots[name] || {}
        return {
          label: label?.['zh_CN'] || name,
          description: description?.['zh_CN'],
          name,
          params,
          bind: Boolean(slots[name])
        }
      })
    })
    const toggleSlot = ({ name = 'default', params, bind }, i) => {
      const schema = useProperties().getSchema()

      if (!schema.children) {
        schema.children = []
      }

      const children = schema.children

      if (!bind) {
        slotList.value[i].bind = !slotList.value[i].bind

        const template = {
          componentName: 'Template',
          props: {
            slot: {
              name
            }
          },
          children: []
        }

        // 如果有作用域插槽参数
        if (params?.length) {
          template.props.slot.params = params
        }

        children.push(template)
      } else {
        useModal().confirm({
          title: '提示',
          message: '关闭后插槽内的内容将被清空，是否继续？',
          status: 'info',
          exec: () => {
            slotList.value[i].bind = !slotList.value[i].bind

            const nodeIdex = children.findIndex(
              ({ componentName, props }) =>
                componentName === 'Template' && (props?.slot === name || props?.slot?.name === name)
            )
            children.splice(nodeIdex, 1)
          },
          cancel: () => {}
        })
      }
      const config = useResource().getMaterial(schema.componentName)
      const isPopper = config?.configure?.isPopper

      if (isPopper) {
        const showProp = typeof isPopper === 'string' ? isPopper : 'modelValue'

        schema.props[showProp] = false
        nextTick(() => {
          schema.props[showProp] = true
        })
      }

      useCanvas().canvasApi.value.updateRect()
    }

    return {
      toggleSlot,
      slotList
    }
  }
}
</script>

<style lang="less" scoped>
.slot-list {
  display: flex;
  margin: 5px 0;
  justify-content: center;
  align-items: center;
  .slot-name {
    width: 30%;
    color: var(--ti-lowcode-dialog-font-color);
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    margin-right: 5px;
  }
  .slot-switch {
    flex: 1;
  }
  .help-icon {
    margin-left: 3px;
    cursor: help;
    width: 14px;
    height: 14px;
  }
}
.e__switch {
  display: inline-flex;
  align-items: center;
  position: relative;
  font-size: 14px;
  line-height: 20px;
  height: 20px;
  vertical-align: middle;
  cursor: pointer;
}

.e__switch-core {
  margin: 0;
  position: relative;
  width: 40px;
  height: 20px;
  border: 1px solid var(--ti-lowcode-base-bg);
  outline: 0;
  border-radius: 10px;
  box-sizing: border-box;
  background: var(--ti-lowcode-base-bg);
  transition: border-color 0.3s, background-color 0.3s;
  vertical-align: middle;
}

.e__switch-core::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 100%;
  transition: all 0.3s;
  width: 16px;
  height: 16px;
  background-color: #ffffff;
}

.e__switch.e_is-checked .e__switch-core {
  border-color: var(--ti-lowcode-base-blue-6);
  background-color: var(--ti-lowcode-base-blue-6);
}

.e__switch.e_is-checked .e__switch-core::after {
  left: 100%;
  margin-left: -17px;
}
</style>
