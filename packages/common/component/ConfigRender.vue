<template>
  <div class="properties-list">
    <tiny-collapse v-model="activeNames">
      <tiny-collapse-item v-for="(group, groupIndex) in data" :key="group" :name="groupIndex">
        <template #title>
          <slot name="title" :group="group">
            <div @click="onGroupClick(group)">
              {{ group.label?.zh_CN || '' }}
            </div>
          </slot>
        </template>
        <config-group :group="group" :index="groupIndex" :design="design" :emptyText="emptyText">
          <template #item="{ data, propIndex }">
            <config-item
              :key="propIndex"
              :properties="properties"
              :property="data"
              :data-prop-index="propIndex"
              :data-group-index="groupIndex"
              :isTopLayer="true"
              :group="group"
              @click="onPropClick(data)"
            >
              <template #prefix>
                <slot name="prefix" :data="data"></slot>
              </template>
              <template v-if="!data.noBinding" #suffix>
                <slot name="suffix" :data="data"></slot>
              </template>
            </config-item>
          </template>
        </config-group>
      </tiny-collapse-item>
    </tiny-collapse>
  </div>
</template>

<script>
import { computed, provide, ref, watchEffect } from 'vue'
import { Collapse, CollapseItem } from '@opentiny/vue'
import ConfigGroup from './ConfigGroup.vue'
import ConfigItem from './ConfigItem.vue'
export default {
  components: {
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    ConfigGroup,
    ConfigItem
  },
  props: {
    data: {
      type: [Array, Object],
      default: () => []
    },
    design: Boolean,
    emptyText: {
      type: String,
      default: '空'
    }
  },
  emits: ['selected'],
  setup(props, { emit }) {
    const activeNames = ref([])

    const getPropsObj = (data) => {
      const obj = {}

      data?.forEach(({ content }) => {
        content.length &&
          content.forEach((item) => {
            const node = item.schema?.length ? getPropsObj(item.schema) : {}

            node.setValue = (value) => {
              item.widget.props.modelValue = value
            }
            obj[item.property] = node
          })
      })

      return obj
    }

    const propsObj = computed(() => getPropsObj(props.data || []))

    provide('propsObj', propsObj)

    const onPropClick = (data) => emit('select-prop', data)
    const onGroupClick = (data) => emit('select-group', data)

    const filterActiveGroup = (data) => data?.filter?.((item) => !item.fold)?.map?.((item, index) => index) || []

    watchEffect(() => {
      activeNames.value = filterActiveGroup(props.data)
    })

    const properties = computed(() => props.data)

    return { onPropClick, onGroupClick, activeNames, properties }
  }
}
</script>
